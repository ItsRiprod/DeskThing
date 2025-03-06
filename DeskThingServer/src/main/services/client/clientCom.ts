console.log('[ClientCom Service] Starting')
import { SocketData, SongData, AppSettings } from '@DeskThing/types'
import Logger from '@server/utils/logger'
import { storeProvider } from '@server/stores'
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
  const musicStore = storeProvider.getStore('musicStore')
  switch (type) {
    case 'song':
      musicStore.handleMusicMessage(payload as SongData)
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
 * @depreciated - use broadcastToClients instead
 */
export const sendMessageToClients = async (data: SocketData): Promise<void> => {
  const platformStore = storeProvider.getStore('platformStore')
  platformStore.broadcastToClients(data)
}

/**
 * Forcibly disconnects a client from the WebSocket server.
 *
 * @param connectionId - The connection ID of the client to be disconnected.
 * @returns - Void.
 * @depreciated - use connectionStore.removeClient instead
 */
export const disconnectClient = (connectionId: string): void => {
  const connectionStore = storeProvider.getStore('connectionsStore')
  connectionStore.removeClient(connectionId)
}

/**
 * Sends a message to a specific client identified by the provided `clientId`.
 * If no `clientId` is provided, the message is broadcasted to all connected clients.
 *
 * @param clientId - The connection ID of the client to send the message to. If not provided, the message will be sent to all connected clients.
 * @param data - The socket data to be sent to the client(s).
 * @deprecated - use broadcastToClients instead
 * @returns - Void.
 */
export const sendMessageToClient = (clientId: string | undefined, data: SocketData): void => {
  const platformStore = storeProvider.getStore('platformStore')

  if (clientId) {
    platformStore.sendDataToClient(clientId, data)
  } else {
    platformStore.broadcastToClients(data)
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
    Logger.error('Error sending message', {
      source: 'clientCom',
      function: 'sendError',
      error: error as Error
    })
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
    const appStore = storeProvider.getStore('appStore')
    const appData = await appStore.getAllBase()

    const filteredAppData = appData.filter((app) => app.manifest?.isWebApp !== false)

    sendMessageToClient(clientId, { app: 'client', type: 'config', payload: filteredAppData })
    Logger.info('WSOCKET: Preferences sent!', { source: 'clientCom', function: 'sendSettingsData' })
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
    const appStore = storeProvider.getStore('appStore')
    const appDataStore = storeProvider.getStore('appDataStore')
    const appData = appStore.getAllBase()

    if (!appData) {
      throw new Error('Invalid configuration format')
    }
    const settings = {}

    if (appData) {
      await Promise.all(
        appData.map(async (app) => {
          if (app) {
            const appSettings = await appDataStore.getSettings(app.name)
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
    Logger.info('WSOCKET: Preferences sent!', { source: 'clientCom', function: 'sendSettingData' })
  } catch (error) {
    Logger.error('WSOCKET: Error getting config data', {
      source: 'clientCom',
      function: 'sendConfigData',
      error: error as Error
    })
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
    Logger.info('WSOCKET: Preferences sent!', { source: 'clientCom', function: 'sendSettingData' })
  } catch (error) {
    Logger.error('WSOCKET: Error getting config data', {
      source: 'clientCom',
      function: 'sendSettingData',
      error: error as Error
    })
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
    const mappingStore = storeProvider.getStore('mappingStore')
    const mappings = await mappingStore.getMapping()
    const actions = await mappingStore.getActions()

    if (!mappings) {
      Logger.warn('No mappings found!', {
        source: 'clientCom',
        function: 'sendMappings'
      })
      return
    }

    const combinedActions = {
      ...mappings,
      actions: actions
    }

    sendMessageToClient(clientId, {
      app: 'client',
      type: 'button_mappings',
      payload: combinedActions
    })

    Logger.info('Button mappings sent', {
      source: 'clientCom',
      function: 'sendMappings'
    })
  } catch (error) {
    Logger.error('WSOCKET: Error getting button mappings', {
      source: 'clientCom',
      function: 'sendMappings',
      error: error as Error
    })
    sendError(clientId, 'WSOCKET: Error getting button mappings')
  }
}
