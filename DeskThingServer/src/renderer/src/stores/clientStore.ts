import { create } from 'zustand'
import { Client, LoggingData } from '@shared/types'

// Utility function to parse ADB devices
const parseADBDevices = (response: string): string[] => {
  return response
    .split('\n')
    .filter((line) => line && !line.startsWith('List of devices attached') && line.trim() !== '')
    .map((line) => line.replace('device', '').trim())
}

interface ClientStoreState {
  ADBDevices: string[]
  connections: number
  clients: Client[]
  logging: LoggingData | null
  clientManifest: Client | null

  // Actions
  setADBDevices: (devices: string[]) => void
  setConnections: (connections: number) => void
  setClients: (clients: Client[]) => void
  setClientManifest: (client: Client) => void
  requestClientManifest: () => Promise<Partial<Client>>
  requestADBDevices: () => Promise<void>
  requestConnections: () => Promise<void>
  loadClientUrl: (url: string) => Promise<void>
  loadClientZip: (zip: string) => Promise<void>
  updateClientManifest: (client: Partial<Client>) => void
}

// Create Zustand store
const useClientStore = create<ClientStoreState>((set, get) => ({
  ADBDevices: [],
  connections: 0,
  clients: [],
  logging: null,
  clientManifest: null,

  // Setters
  setADBDevices: (devices: string[]): void => set({ ADBDevices: devices }),
  setConnections: (connections: number): void => set({ connections }),
  setClients: (clients: Client[]): void => set({ clients }),
  setClientManifest: (client: Client): void => set({ clientManifest: client }),
  requestClientManifest: async (): Promise<Partial<Client>> => {
    const clientManifest = await window.electron.getClientManifest()
    set({ clientManifest })
    return clientManifest
  },

  updateClientManifest: (client: Partial<Client>): void => {
    set((state) => ({
      clientManifest: state.clientManifest
        ? { ...state.clientManifest, ...client }
        : (client as Client)
    }))
    window.electron.updateClientManifest(client)
  },

  // Request ADB Devices
  requestADBDevices: async (): Promise<void> => {
    try {
      const response = await window.electron.handleClientADB('devices')
      if (response) {
        const deviceList = parseADBDevices(response)
        set({ ADBDevices: deviceList })
      } else {
        console.log('No devices found')
      }
    } catch (error) {
      console.error('Error fetching ADB devices:', error)
    }
  },

  // Request Connections
  requestConnections: async (): Promise<void> => {
    try {
      const connections = await window.electron.getConnections()
      set({ connections: connections.length })
    } catch (error) {
      console.error('Error fetching connections:', error)
    }
  },

  loadClientUrl: async (url: string): Promise<void> => {
    const promise = window.electron.handleClientURL(url)

    const loggingListener = (_event: any, reply: LoggingData): void => {
      set({ logging: reply })
      if (reply.final === true || reply.status === false) {
        removeListener()
        get().requestClientManifest()
      }
    }
    const removeListener = window.electron.ipcRenderer.on('logging', loggingListener)

    return promise
  },

  loadClientZip: async (zip: string): Promise<void> => {
    const promise = window.electron.handleClientZip(zip)

    const loggingListener = (_event: any, reply: LoggingData): void => {
      set({ logging: reply })
      if (reply.final === true || reply.status === false) {
        removeListener()
        get().requestClientManifest()
      }
    }
    const removeListener = window.electron.ipcRenderer.on('logging', loggingListener)

    return promise
  }
}))

export default useClientStore
