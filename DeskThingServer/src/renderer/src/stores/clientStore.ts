import { create } from 'zustand'
import { IpcRendererCallback, LoggingData } from '@shared/types'
import { ClientManifest, Client, ADBClientType, ClientConnectionMethod } from '@deskthing/types'
import useNotificationStore from './notificationStore'
import { PlatformIDs } from '@shared/stores/platformStore'

interface ClientStoreState {
  devices: ADBClientType[]
  connections: number
  clients: Client[]
  logging: LoggingData | null
  clientManifest: ClientManifest | null
  initialized: boolean

  // Actions
  initialize: () => Promise<void>
  requestClientManifest: () => Promise<Partial<Client>>
  requestADBDevices: () => Promise<Client[] | undefined>
  requestConnections: () => Promise<void>
  loadClientUrl: (url: string) => Promise<void>
  loadClientZip: (zip: string) => Promise<void>
  updateClientManifest: (client: Partial<ClientManifest>) => void
}

// Create Zustand store
const useClientStore = create<ClientStoreState>((set, get) => ({
  devices: [],
  connections: 0,
  clients: [],
  logging: null,
  clientManifest: null,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return

    const handleClientData: IpcRendererCallback<'clients'> = (_event, data) => {
      set(() => ({
        clients: data,
        connections: data.length
      }))
    }

    const handleNewClient: IpcRendererCallback<'platform:client'> = (_event, data) => {
      if (data.request === 'added') {
        if (data.client.manifest?.context.method === ClientConnectionMethod.ADB) {
          set((state) => ({
            devices: [...state.devices, (data.client?.manifest?.context as ADBClientType) || []]
          }))
        }
        set((state) => {
          const existingClientIndex = state.clients.findIndex(
            (client) => client.connectionId === data.client.connectionId
          )
          if (existingClientIndex !== -1) {
            return {
              clients: state.clients,
              connections: state.clients.length
            }
          }

          return {
            clients: [...state.clients, data.client],
            connections: state.connections + 1
          }
        })
      } else if (data.request === 'removed') {
        set((state) => ({
          clients: state.clients.filter((client) => client.connectionId !== data.clientId),
          connections: state.connections - 1
        }))
      } else if (data.request === 'modified') {
        set((state) => ({
          clients: state.clients.map((client) =>
            client.connectionId === data.client.connectionId ? data.client : client
          )
        }))
      }
    }

    window.electron.ipcRenderer.on('clients', handleClientData)
    window.electron.ipcRenderer.on('platform:client', handleNewClient)

    await get().requestConnections()
    await get().requestADBDevices()
    await get().requestClientManifest()

    set({ initialized: true })
  },

  requestClientManifest: async (): Promise<Partial<ClientManifest>> => {
    const clientManifest = await window.electron.client.getClientManifest()

    if (!clientManifest) {
      const addIssue = useNotificationStore.getState().addIssue
      addIssue({
        title: 'Client Is Not Installed!',
        description:
          "The client wasn't found! Please install the Client in order to finish setting up the server!",
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
    window.electron.client.updateClientManifest(client)
  },

  requestADBDevices: async (): Promise<Client[] | undefined> => {
    try {
      const devices = await window.electron.platform.send({
        platform: PlatformIDs.ADB,
        type: 'refresh',
        request: 'adb'
      })

      return devices
    } catch (error) {
      console.error('Error fetching ADB devices:', error)
      return []
    }
  },

  // Request Connections
  requestConnections: async (): Promise<void> => {
    try {
      const connections = await window.electron.utility.getConnections()
      console.debug('Got the connections', connections)
      set({
        connections: connections.length,
        clients: connections
      })
    } catch (error) {
      console.error('Error fetching connections:', error)
    }
  },

  loadClientUrl: async (url: string): Promise<void> => {
    const promise = window.electron.client.handleClientURL(url)

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
    const promise = window.electron.client.handleClientZip(zip)

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
