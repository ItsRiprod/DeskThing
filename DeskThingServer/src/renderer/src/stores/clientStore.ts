import { create } from 'zustand'
import { ClientDownloadReturnData, IpcRendererCallback, LoggingData } from '@shared/types'
import { ClientManifest, Client, PlatformIDs } from '@deskthing/types'
import useNotificationStore from './notificationStore'

interface ClientStoreState {
  connections: number
  clients: Client[]
  logging: LoggingData | null
  clientManifest: ClientManifest | null
  initialized: boolean

  // Actions
  initialize: () => Promise<void>
  requestClientManifest: () => Promise<ClientManifest | undefined>
  requestADBDevices: () => Promise<Client[] | undefined>
  requestConnections: () => Promise<void>
  refreshConnections: () => Promise<boolean>
  downloadLatestClient: () => Promise<void>
  /**
   * @deprecated - use release store instead for URLs
   */
  loadClientUrl: (url: string) => Promise<ClientDownloadReturnData>
  loadClientZip: (zip: string) => Promise<ClientDownloadReturnData>
  updateClientManifest: (client: Partial<ClientManifest>) => void
}

// Create Zustand store
const useClientStore = create<ClientStoreState>((set, get) => ({
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
        connections: data?.length || 0
      }))
    }

    const handleNewClient: IpcRendererCallback<'platform:client'> = (_event, data) => {
      switch (data.request) {
        case 'added': {
          set((state) => {
            const existingClientIndex = state.clients.findIndex(
              (client) => client.clientId === data.client.clientId
            )

            if (existingClientIndex !== -1) {
              state.clients[existingClientIndex] = data.client
              return {
                clients: state.clients,
                connections: state.connections
              }
            }

            return {
              clients: [...state.clients, data.client],
              connections: state.connections
            }
          })
          break
        }
        case 'removed': {
          set((state) => ({
            clients: state.clients.filter((client) => client.clientId !== data.clientId),
            connections: state.connections
          }))
          break
        }
        case 'modified': {
          set((state) => {
            const existingClientIndex = state.clients.findIndex(
              (client) => client.clientId === data.client.clientId
            )
            if (existingClientIndex === -1) {
              return {
                clients: [...state.clients, data.client]
              }
            }

            state.clients[existingClientIndex] = data.client

            return {
              clients: state.clients.map((client) =>
                client.clientId === data.client.clientId ? data.client : client
              )
            }
          })
          break
        }
        case 'list': {
          set({
            clients: data.clients,
            connections: data.clients?.length || 0
          })
          break
        }
      }
    }

    window.electron.ipcRenderer.on('clients', handleClientData)
    window.electron.ipcRenderer.on('platform:client', handleNewClient)

    const clientManifest = await window.electron.client.getClientManifest()

    set({ initialized: true, clientManifest: clientManifest })
  },

  downloadLatestClient: async (): Promise<void> => {
    const clientManifest = await window.electron.client.downloadLatestClient()
    if (!clientManifest) {
      return undefined
    } else {
      set({ clientManifest })
    }
  },

  requestClientManifest: async (): Promise<ClientManifest | undefined> => {
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
      return undefined
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
        connections: connections?.length || 0,
        clients: connections
      })
    } catch (error) {
      console.error('Error fetching connections:', error)
    }
  },

  refreshConnections: async (): Promise<boolean> => {
    try {
      const clients = await window.electron.platform.refreshConnections()
      console.debug('Got the connections', clients)
      if (!clients) return false
      set(() => ({
        clients: clients,
        connections: clients?.length || 0
      }))
      return true
    } catch (error) {
      console.error('Error fetching connections:', error)
      return false
    }
  },

  loadClientUrl: async (url: string): Promise<ClientDownloadReturnData> => {
    const result = await window.electron.client.handleClientURL(url)

    if (result.success) {
      set({ clientManifest: result.clientManifest })
    }

    return result
  },

  loadClientZip: async (zip: string): Promise<ClientDownloadReturnData> => {
    const result = await window.electron.client.handleClientZip(zip)

    if (result.success) {
      set({ clientManifest: result.clientManifest })
    }

    return result
  }
}))
export default useClientStore
