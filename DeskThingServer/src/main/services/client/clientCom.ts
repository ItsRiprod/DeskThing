console.log('[ClientCom Service] Starting')
import { SocketData, MESSAGE_TYPES, SongData, AppSettings } from '@shared/types'
import { server, Clients } from './websocket'
import { loggingStore, connectionStore, appStore } from '@server/stores/'

/**
 * Handles a client message by dispatching the message to the appropriate handler based on the message type.
 * If the message type is 'song', it calls the `handleMusicMessage` function from the `musicHandler` module.
 * If the message type is anything else, it calls the `sendMessageToClients` function to broadcast the message to all connected clients.
 *
 * @param data - The incoming socket data, which contains the message type and payload.
 * @returns - A Promise that resolves when the message has been handled.
 */
export const handleClientMessage = async (data: SocketData): Promise<void> => {
  const { type, payload } = data
  const musicHandler = await import('../../stores/musicStore')
  switch (type) {
    case 'song':
      musicHandler.default.handleMusicMessage(payload as SongData)
      break
    default:
      sendMessageToClients(data)
  }
}

/**
 * Sends a message to all connected clients.
 *
 * @param data - The socket data to be sent to the clients.
 * @returns - A Promise that resolves when the message has been sent to all clients.
 */
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

/**
 * Forcibly disconnects a client from the WebSocket server.
 *
 * @param connectionId - The connection ID of the client to be disconnected.
 * @returns - Void.
 */
export const disconnectClient = (connectionId: string): void => {
  const client = Clients.find((c) => c.client.connectionId === connectionId)

  if (client && server) {
    client.socket.terminate()
    Clients.splice(Clients.indexOf(client), 1)
    loggingStore.log(MESSAGE_TYPES.LOGGING, `Forcibly disconnected client: ${connectionId}`)
    connectionStore.removeClient(connectionId)
  } else {
    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `Client not found or server not running: ${connectionId}`
    )
  }
}

/**
 * Sends a message to a specific client identified by the provided `clientId`.
 * If no `clientId` is provided, the message is broadcasted to all connected clients.
 *
 * @param clientId - The connection ID of the client to send the message to. If not provided, the message will be sent to all connected clients.
 * @param data - The socket data to be sent to the client(s).
 * @returns - Void.
 */
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

/**
 * Sends an error message to the specified client.
 *
 * @param clientId - The connection ID of the client to send the error message to. If not provided, the error message will be logged but not sent to any client.
 * @param error - The error message to be sent to the client.
 * @returns - A Promise that resolves when the error message has been sent.
 */
export const sendError = async (clientId: string | undefined, error: string): Promise<void> => {
  try {
    sendMessageToClient(clientId, { app: 'client', type: 'error', payload: error })
  } catch (error) {
    console.error('WSOCKET: Error sending message:', error)
  }
}

/**
 * Sends the configuration data to the specified client or all connected clients.
 *
 * @param clientId - The connection ID of the client to send the configuration data to. If not provided, the data will be sent to all connected clients.
 * @returns - A Promise that resolves when the configuration data has been sent.
 */
export const sendConfigData = async (clientId?: string): Promise<void> => {
  try {
    const appData = await appStore.getAllBase()

    const filteredAppData = appData.filter((app) => app.manifest?.isWebApp !== false)

    sendMessageToClient(clientId, { app: 'client', type: 'config', payload: filteredAppData })

    loggingStore.log(MESSAGE_TYPES.LOGGING, 'WSOCKET: Preferences sent!')
  } catch (error) {
    console.error('WSOCKET: Error getting config data:', error)
    sendError(clientId, 'WSOCKET: Error getting config data')
  }
}

/**
 * Sends the settings data to the specified client or all connected clients.
 *
 * @param clientId - The connection ID of the client to send the settings data to. If not provided, the data will be sent to all connected clients.
 * @returns - A Promise that resolves when the settings data has been sent.
 */
export const sendSettingsData = async (clientId?: string): Promise<void> => {
  try {
    const appData = appStore.getAllBase()

    if (!appData) {
      throw new Error('Invalid configuration format')
    }
    const settings = {}

    if (appData) {
      await Promise.all(
        appData.map(async (app) => {
          if (app) {
            const appSettings = await appStore.getSettings(app.name)
            if (appSettings) {
              settings[app.name] = appSettings
            }
          }
        })
      )
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

/**
 * Sends the setting data to the specified client or all connected clients.
 *
 * @param clientId - The connection ID of the client to send the settings data to. If not provided, the data will be sent to all connected clients.
 * @returns - A Promise that resolves when the settings data has been sent.
 */
export const sendSettingData = async (app: string, setting: AppSettings): Promise<void> => {
  try {
    sendMessageToClient(undefined, { app: 'client', type: 'setting', payload: { app, setting } })
    loggingStore.log(MESSAGE_TYPES.LOGGING, 'WSOCKET: Preferences sent!')
  } catch (error) {
    console.error('WSOCKET: Error getting config data:', error)
    sendError(undefined, 'WSOCKET: Error getting config data')
  }
}

/**
 * Sends the button mappings data to the specified client or all connected clients.
 *
 * @param clientId - The connection ID of the client to send the button mappings data to. If not provided, the data will be sent to all connected clients.
 * @returns - A Promise that resolves when the button mappings data has been sent.
 */
export const sendMappings = async (clientId?: string): Promise<void> => {
  try {
    const { default: keyMapStore } = await import('@server/stores/mappingStore')
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
