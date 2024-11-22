import { create } from 'zustand'
import { Client, ClientManifest, LoggingData } from '@shared/types'
import useNotificationStore from './notificationStore'
import useSettingsStore from './settingsStore'

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
  clientManifest: ClientManifest | null

  // Actions
  setADBDevices: (devices: string[]) => void
  setConnections: (connections: number) => Promise<void>
  setClients: (clients: Client[]) => void
  setClientManifest: (client: ClientManifest) => void
  requestClientManifest: () => Promise<Partial<Client>>
  requestADBDevices: () => Promise<void>
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
  setADBDevices: async (devices: string[]): Promise<void> => {
    if (devices.includes('offline')) {
      window.electron.handleClientADB('reconnect offline')
    }

    const currentDevices = get().ADBDevices
    const newDevices = devices.filter((device) => !currentDevices.includes(device))

    set((state) => {
      const updatedClients = state.clients.filter(
        (client) => client.connected || devices.includes(client.adbId || 'XXXXX')
      )

      devices.forEach((deviceId) => {
        if (!updatedClients.some((client) => client.adbId === deviceId)) {
          updatedClients.push({
            adbId: deviceId,
            device_type: { name: 'Car Thing', id: 4 },
            client_name: `Car Thing ${deviceId}`,
            ip: '',
            port: 0,
            connectionId: '',
            connected: false,
            timestamp: Date.now()
          })
        }
      })

      return {
        ADBDevices: devices,
        clients: updatedClients as Client[]
      }
    })

    if (newDevices.length > 0) {
      const { autoConfig } = useSettingsStore.getState().settings

      if (autoConfig) {
        newDevices.forEach((deviceId) => {
          const client = get().clients.find((c) => c.adbId === deviceId)
          if (client && !client.connected) {
            window.electron.configureDevice(deviceId)
          }
        })
      }
    }
  },

  setConnections: async (connections: number): Promise<void> => set({ connections }),
  setClients: async (clients: Client[]): Promise<void> => {
    set({ clients })
    get().requestADBDevices() // update adb mapping

    if (clients.some((client) => client.adbId)) {
      const resolveTask = useNotificationStore.getInitialState().resolveTask
      resolveTask('adbdevices-configure')
    }
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
  requestADBDevices: async (): Promise<void> => {
    try {
      const response = await window.electron.handleClientADB('devices')
      if (response) {
        if (response.includes('offline')) {
          await window.electron.handleClientADB('reconnect offline')
        }
        const deviceList = parseADBDevices(response)
        get().setADBDevices(deviceList)
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
