console.log('[ClientCom Service] Starting')
import { SocketData, MESSAGE_TYPES, SongData } from '@shared/types'
import { server, Clients } from './websocket'
import loggingStore from '../../stores/loggingStore'
import connectionsStore from '../../stores/connectionsStore'
import appState from '../apps/appState'
import { readData } from '../../handlers/dataHandler'

export const handleClientMessage = async (data: SocketData): Promise<void> => {
  const { type, payload } = data
  const musicHandler = await import('../../handlers/musicHandler')
  switch (type) {
    case 'song':
      musicHandler.default.handleMusicMessage(payload as SongData)
      break
    default:
      sendMessageToClients(data)
  }
}

export const sendMessageToClients = async (data: SocketData): Promise<void> => {
  loggingStore.log(
    MESSAGE_TYPES.LOGGING,
    `Sending message to clients: ${data.payload ? (JSON.stringify(data.payload).length > 1000 ? '[Large Payload]' : JSON.stringify(data.payload)) : 'undefined'}`
  )
  if (server) {
    server.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(data))
      }
    })
  } else {
    loggingStore.log(MESSAGE_TYPES.LOGGING, 'WSOCKET: No server running - setting one up')
  }
}

export const disconnectClient = (connectionId: string): void => {
  const client = Clients.find((c) => c.client.connectionId === connectionId)

  if (client && server) {
    client.socket.terminate()
    Clients.splice(Clients.indexOf(client), 1)
    loggingStore.log(MESSAGE_TYPES.LOGGING, `Forcibly disconnected client: ${connectionId}`)
    connectionsStore.removeClient(connectionId)
  } else {
    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `Client not found or server not running: ${connectionId}`
    )
  }
}

export const sendMessageToClient = (clientId: string | undefined, data: SocketData): void => {
  const client = Clients.find((client) => client.client.connectionId === clientId)
  if (client) {
    client.socket.send(JSON.stringify(data))
  } else if (server && server.clients.size > 0) {
    // Burst the message if there is no client provided
    sendMessageToClients(data)
  } else {
    loggingStore.log(MESSAGE_TYPES.LOGGING, 'WSOCKET: No clients connected or server running')
  }
}

export const sendError = async (clientId: string | undefined, error: string): Promise<void> => {
  try {
    sendMessageToClient(clientId, { app: 'client', type: 'error', payload: error })
  } catch (error) {
    console.error('WSOCKET: Error sending message:', error)
  }
}

export const sendConfigData = async (clientId?: string): Promise<void> => {
  try {
    const appData = await appState.getAllBase()

    const filteredAppData = appData.filter((app) => app.manifest?.isWebApp !== false)

    sendMessageToClient(clientId, { app: 'client', type: 'config', payload: filteredAppData })

    loggingStore.log(MESSAGE_TYPES.LOGGING, 'WSOCKET: Preferences sent!')
  } catch (error) {
    console.error('WSOCKET: Error getting config data:', error)
    sendError(clientId, 'WSOCKET: Error getting config data')
  }
}

export const sendSettingsData = async (clientId?: string): Promise<void> => {
  try {
    const appData = await appState.getAllBase()
    const config = await readData()
    if (!appData) {
      throw new Error('Invalid configuration format')
    }

    const settings = {}

    if (appData && config) {
      appData.map((app) => {
        if (app && app.manifest) {
          const appConfig = config[app.manifest.id]
          if (appConfig?.settings) {
            settings[app.manifest.id] = appConfig.settings
          }
        }
      })
    } else {
      console.error('appData or appData.apps is undefined or null', appData)
    }

    sendMessageToClient(clientId, { app: 'client', type: 'settings', payload: settings })
    loggingStore.log(MESSAGE_TYPES.LOGGING, 'WSOCKET: Preferences sent!')
  } catch (error) {
    console.error('WSOCKET: Error getting config data:', error)
    sendError(clientId, 'WSOCKET: Error getting config data')
  }
}

export const sendMappings = async (clientId?: string): Promise<void> => {
  try {
    const { default: keyMapStore } = await import('../mappings/mappingStore')
    const mappings = keyMapStore.getMapping()
    const actions = keyMapStore.getActions()

    const combinedActions = {
      ...mappings,
      actions: actions
    }

    sendMessageToClient(clientId, {
      app: 'client',
      type: 'button_mappings',
      payload: combinedActions
    })

    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `WEBSOCKET: Client has been sent button map ${mappings.id}!`
    )
  } catch (error) {
    console.error('WSOCKET: Error getting button mappings:', error)
    sendError(clientId, 'WSOCKET: Error getting button mappings')
  }
}
