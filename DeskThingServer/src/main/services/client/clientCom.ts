import { FromDeskthingToDeviceEvents, FromDeviceDataEvents } from '@DeskThing/types'
import Logger from '@server/utils/logger'
import { storeProvider } from '@server/stores/storeProvider'

/**
 * Sends an error message to the specified client.
 *
 * @param clientId - The connection ID of the client to send the error message to. If not provided, the error message will be logged but not sent to any client.
 * @param error - The error message to be sent to the client.
 * @returns - A Promise that resolves when the error message has been sent.
 */
export const sendError = async (clientId: string | undefined, error: string): Promise<void> => {
  try {
    const platformStore = await storeProvider.getStore('platformStore')
    if (clientId) {
      platformStore.sendDataToClient(clientId, {
        app: 'client',
        type: FromDeskthingToDeviceEvents.ERROR,
        payload: error
      })
    } else {
      platformStore.broadcastToClients({
        app: 'client',
        type: FromDeskthingToDeviceEvents.ERROR,
        payload: error
      })
    }
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
    const appStore = await storeProvider.getStore('appStore')
    const appData = await appStore.getAll()

    const filteredAppData = appData.filter((app) => app.manifest?.isWebApp !== false)

    const platformStore = await storeProvider.getStore('platformStore')
    if (clientId) {
      platformStore.sendDataToClient(clientId, {
        app: 'client',
        type: FromDeviceDataEvents.APPS,
        payload: filteredAppData
      })
    } else {
      platformStore.broadcastToClients({
        app: 'client',
        type: FromDeviceDataEvents.APPS,
        payload: filteredAppData
      })
    }

    Logger.debug('WSOCKET: Preferences sent!', {
      source: 'clientCom',
      function: 'sendSettingsData'
    })
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
    const appStore = await storeProvider.getStore('appStore')
    const appDataStore = await storeProvider.getStore('appDataStore')
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

    const platformStore = await storeProvider.getStore('platformStore')
    if (clientId) {
      platformStore.sendDataToClient(clientId, {
        app: 'client',
        type: FromDeviceDataEvents.SETTINGS,
        payload: settings
      })
    } else {
      platformStore.broadcastToClients({
        app: 'client',
        type: FromDeviceDataEvents.SETTINGS,
        payload: settings
      })
    }
    Logger.debug('WSOCKET: Preferences sent!', { source: 'clientCom', function: 'sendSettingData' })
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
 * Sends the button mappings data to the specified client or all connected clients.
 *
 * @param clientId - The connection ID of the client to send the button mappings data to. If not provided, the data will be sent to all connected clients.
 * @returns - A Promise that resolves when the button mappings data has been sent.
 */
export const sendMappings = async (clientId?: string): Promise<void> => {
  try {
    const mappingStore = await storeProvider.getStore('mappingStore')
    const platformStore = await storeProvider.getStore('platformStore')
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

    if (clientId) {
      platformStore.sendDataToClient(clientId, {
        app: 'client',
        type: FromDeskthingToDeviceEvents.MAPPINGS,
        payload: combinedActions
      })
    } else {
      platformStore.broadcastToClients({
        app: 'client',
        type: FromDeskthingToDeviceEvents.MAPPINGS,
        payload: combinedActions
      })
    }

    Logger.debug('Button mappings sent', {
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
