import { create } from 'zustand'
import { ADBClient, Client, LoggingData } from '@shared/types'
import { ClientManifest } from '@deskthing/types'
import useNotificationStore from './notificationStore'

interface ClientStoreState {
  ADBDevices: ADBClient[]
  connections: number
  clients: Client[]
  logging: LoggingData | null
  clientManifest: ClientManifest | null

  // Actions
  setADBDevices: (devices: ADBClient[]) => void
  setConnections: (connections: number) => Promise<void>
  setClients: (clients: Client[]) => void
  setClientManifest: (client: ClientManifest) => void
  requestClientManifest: () => Promise<Partial<Client>>
  requestADBDevices: () => Promise<ADBClient[]>
  requestConnections: () => Promise<void>
  loadClientUrl: (url: string) => Promise<void>
  loadClientZip: (zip: string) => Promise<void>
  updateClientManifest: (client: Partial<ClientManifest>) => void
}

// Create Zustand store
const useClientStore = create<ClientStoreState>((set, get) => ({
  ADBDevices: [],
  connections: 0,
  clients: [],
  logging: null,
  clientManifest: null,

  // Setters
  setADBDevices: async (clients: ADBClient[]): Promise<void> => {
    set({ ADBDevices: clients })
  },

  setConnections: async (connections: number): Promise<void> => set({ connections }),
  setClients: async (clients: Client[]): Promise<void> => {
    set({ clients })
    get().requestADBDevices() // update adb mapping
  },
  setClientManifest: async (client: ClientManifest): Promise<void> =>
    set({ clientManifest: client }),

  requestClientManifest: async (): Promise<Partial<ClientManifest>> => {
    const clientManifest = await window.electron.getClientManifest()

    if (!clientManifest) {
      const addIssue = useNotificationStore.getState().addIssue
      addIssue({
        title: 'Client Is Not Installed!',
        description:
          'The client wasnt found! Please install the Client in order to finish setting up the server!',
        id: `client-manifest-missing`,
        status: 'error',
        complete: false,
        steps: [
          {
            task: 'Go to Downloads -> Client Downloads and download the latest client',
            status: false,
            stepId: 'download'
          }
        ]
      })
      return {}
    } else {
      const removeIssue = useNotificationStore.getState().removeIssue
      removeIssue('client-manifest-missing')
    }

    set({ clientManifest })
    return clientManifest
  },

  updateClientManifest: async (client: Partial<ClientManifest>): Promise<void> => {
    set((state) => ({
      clientManifest: state.clientManifest
        ? { ...state.clientManifest, ...client }
        : (client as ClientManifest)
    }))
    window.electron.updateClientManifest(client)
  },

  // Request ADB Devices
  requestADBDevices: async (): Promise<ADBClient[]> => {
    try {
      return await window.electron.getDevices()
    } catch (error) {
      console.error('Error fetching ADB devices:', error)
      return []
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

    const loggingListener = (_event: Electron.Event, reply: LoggingData): void => {
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

    const loggingListener = (_event: Electron.Event, reply: LoggingData): void => {
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
