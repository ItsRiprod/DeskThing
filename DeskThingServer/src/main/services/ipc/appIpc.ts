/**
 * Handles various app-related actions and data management.
 *
 * This module exports an `appHandler` object that contains functions for handling different types of app-related IPC (Inter-Process Communication) data.
 * The functions in this object are mapped to specific `AppIPCData` types, and they handle tasks such as getting and setting app data, starting/stopping/disabling/enabling apps, and managing zipped app files.
 *
 * The module also exports helper functions like `getApps`, `setAppData`, and `getAppData` that are used internally by the `appHandler` functions.
 */
console.log('[App Handler] Starting')
import path from 'path'
import { App, LOGGING_LEVELS, AppSettings, SavedData } from '@DeskThing/types'
import { IPC_APP_TYPES, AppHandlerReturnType, AppIPCData, ProgressChannel } from '@shared/types'
import { storeProvider } from '@server/stores/storeProvider'
import Logger from '@server/utils/logger'
import { dialog, BrowserWindow } from 'electron'
import { progressBus } from '@server/services/events/progressBus'

/**
 * The `appHandler` object contains functions for handling different types of app-related IPC (Inter-Process Communication) data.
 * These functions are mapped to specific `AppIPCData` types and handle tasks such as getting and setting app data, starting/stopping/disabling/enabling apps, and managing zipped app files.
 *
 * The `app` function handles the 'app' IPC data request, returning the list of available apps when the 'get' request is made.
 *
 * The `data` function handles various app-related data requests, including getting and setting app data. It calls `getAppData` and `setAppData` to retrieve and update the app data, respectively.
 *
 * The `stop`, `disable`, `enable`, `run`, and `purge` functions handle the corresponding actions for the app with the provided payload data.
 *
 * The `zip` function handles the processing of a zipped app, extracting and processing the app using the `appStore.addZIP` method.
 *
 * The `url` function handles the processing of an app from a URL, extracting and processing the app using the `appStore.addURL` method.
 */
export const appHandler: {
  [K in IPC_APP_TYPES]: (
    data: Extract<AppIPCData, { type: K }>
  ) => Promise<AppHandlerReturnType<K> | undefined>
} = {
  /**
   * Handles the 'app' IPC data request, returning the list of available apps when the 'get' request is made.
   *
   * @param data - The IPC data object, containing the 'request' property set to 'get'.
   * @param replyFn - The function to call to send a response back to the client.
   * @returns The list of available apps, or undefined if the request is not 'get'.
   */
  app: async (data) => {
    if (data.request === 'get') {
      return getApps()
    }
    return undefined
  },

  /**
   * Handles various app-related data requests, including getting and setting app data.
   *
   * This function is part of the `appHandler` object, which is responsible for handling different types of app-related IPC (Inter-Process Communication) data.
   *
   * When the `data.request` is 'get', this function calls `getAppData` to retrieve the app data for the specified `data.payload`.
   * When the `data.request` is 'set', this function calls `setAppData` to update the app data for the specified `data.payload.appId` with the new `data.payload.data`.
   * If the `data.request` is neither 'get' nor 'set', this function returns `undefined`.
   *
   * @param data - The IPC data object, containing the 'request' property and optional 'payload' object.
   * @param replyFn - The function to call to send a response back to the client.
   * @returns The app data if the 'request' is 'get', the result of setting the app data if the 'request' is 'set', or `undefined` if the 'request' is neither 'get' nor 'set'.
   */
  data: async (data) => {
    switch (data.request) {
      case 'get':
        return await getAppData(data.payload)
      case 'set':
        await setAppData(data.payload.appId, data.payload.data)
        return
      default:
        return
    }
  },
  settings: async (data) => {
    switch (data.request) {
      case 'get':
        return await getAppSettings(data.payload)
      case 'set':
        await setAppSettings(data.payload.appId, data.payload.settings)
        return
      default:
        return
    }
  },
  /**
   * Stops the app with the provided payload data.
   *
   * @param data - The payload data for the app to be stopped.
   * @param replyFn - The function to call to send a response back to the client.
   * @returns `true` if the app was successfully stopped, `false` otherwise.
   */
  stop: async (data) => {
    progressBus.startOperation(ProgressChannel.IPC_APPS, 'Stop App', 'Stopping App')
    const appStore = await storeProvider.getStore('appStore')
    await appStore.stop(data.payload)
    progressBus.complete(ProgressChannel.IPC_APPS, 'App Stopped', 'App Stopped Successfully')
    return true
  },
  /**
   * Disables the app with the provided payload data.
   *
   * @param data - The payload data for the app to be disabled.
   * @param replyFn - The function to call to send a response back to the client.
   * @returns `true` if the app was successfully disabled, `false` otherwise.
   */
  disable: async (data) => {
    progressBus.startOperation(ProgressChannel.IPC_APPS, 'Disable App', 'Disabling App')
    const appStore = await storeProvider.getStore('appStore')
    await appStore.disable(data.payload)
    progressBus.complete(ProgressChannel.IPC_APPS, 'App Disabled', 'App Disabled Successfully')
    return true
  },
  /**
   * Enables the app with the provided payload data.
   *
   * @param data - The payload data for the app to be enabled.
   * @param replyFn - The function to call to send a response back to the client.
   * @returns `true` if the app was successfully enabled, `false` otherwise.
   */
  enable: async (data) => {
    progressBus.startOperation(ProgressChannel.IPC_APPS, 'Enable App', 'Enabling App')
    const appStore = await storeProvider.getStore('appStore')
    await appStore.enable(data.payload)
    progressBus.complete(ProgressChannel.IPC_APPS, 'App Enabled', 'App Enabled Successfully')
    return true
  },
  /**
   * Runs the app with the provided payload data.
   *
   * @param data - The payload data for the app to be run.
   * @param replyFn - The function to call to send a response back to the client.
   * @returns `true` if the app was successfully run, `false` otherwise.
   */
  run: async (data) => {
    progressBus.startOperation(ProgressChannel.IPC_APPS, 'Run App', 'Running App')
    const appStore = await storeProvider.getStore('appStore')
    await appStore.start(data.payload)
    progressBus.complete(ProgressChannel.IPC_APPS, 'App Running', 'App Running Successfully')
    return true
  },
  /**
   * Purges the app with the provided payload data.
   *
   * @param data - The payload data for the app to be purged.
   * @param replyFn - The function to call to send a response back to the client.
   * @returns `true` if the app was successfully purged, `false` otherwise.
   */
  purge: async (data) => {
    progressBus.startOperation(ProgressChannel.IPC_APPS, 'Purge App', 'Purging App')
    const appStore = await storeProvider.getStore('appStore')
    await appStore.purge(data.payload)
    progressBus.complete(ProgressChannel.IPC_APPS, 'App Purged', 'App Purged Successfully')
    return true
  },

  /**
   * Handles the processing of a zipped app.
   *
   * This function is responsible for extracting and processing a zipped app. It
   * first logs the start of the handling process, then calls the `addZIP` method
   * of the `appStore` to extract and process the zipped app. If the processing is
   * successful, it logs the completion of the process and returns the processed
   * data. If there is an error, it logs the error and returns the error data.
   *
   * @depreciated - use add() instead
   * @param data - The payload data for the zipped app to be processed.
   * @param replyFn - The function to call to send a response back to the client.
   * @returns The processed data from the zipped app, or `null` if there was an error.
   */
  zip: async (_data) => {
    Logger.fatal('appHandler.zip() is depreciated, use add() instead')
    return null
  },
  /**
   * Handles the processing of an app from a URL.
   *
   * This function is responsible for extracting and processing an app from a URL.
   * It first logs the start of the handling process, then calls the `addURL` method
   * of the `appStore` to extract and process the app from the URL. If the processing
   * is successful, it logs the completion of the process and returns the processed
   * data. If there is an error, it logs the error and returns the error data.
   *
   * @depreciated - use add() instead
   * @param data - The payload data for the app to be processed from a URL.
   * @param replyFn - The function to call to send a response back to the client.
   * @returns The processed data from the app, or `null` if there was an error.
   */
  url: async (_data) => {
    Logger.fatal('appHandler.zip() is depreciated, use add() instead')
    return null
  },

  add: async (data) => {
    progressBus.startOperation(ProgressChannel.IPC_APPS, 'Installing App', 'Installing App', [
      {
        channel: ProgressChannel.ST_APP_INSTALL,
        weight: 100
      }
    ])
    const appStore = await storeProvider.getStore('appStore')

    const stagedAppManifest = await appStore.addApp({
      filePath: data.payload.filePath,
      releaseMeta: data.payload.meta
    })

    if (!stagedAppManifest) {
      progressBus.error(
        ProgressChannel.ST_APP_INSTALL,
        'Check logs for details',
        'Something went wrong during the download process',
        'Error Installing App'
      )
      return null
    }

    progressBus.complete(ProgressChannel.ST_APP_INSTALL, 'App Installed', 'App Installed')

    return stagedAppManifest
  },

  staged: async (data) => {
    const appStore = await storeProvider.getStore('appStore')
    Logger.log(
      LOGGING_LEVELS.LOG,
      `Handling staged app with id "${data.payload.appId || 'Unknwon'}" and overwrite set to ${data.payload.overwrite ? 'true' : 'false'}...`
    )
    return await appStore.runStagedApp({ ...data.payload })
  },

  'user-data-response': async (data) => {
    const appStore = await storeProvider.getStore('appStore')
    appStore.sendDataToApp(data.payload.requestId, data.payload.response)
  },
  'select-zip-file': async () => {
    const mainWindow = BrowserWindow.getFocusedWindow()
    if (!mainWindow) return null

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'ZIP Files', extensions: ['zip'] }]
    })
    if (result.canceled) return null

    const filePath = result.filePaths[0]
    return { path: filePath, name: path.basename(filePath) }
  },
  'dev-add-app': async (data) => {
    Logger.error('Developer App Not implemented Yet ' + data.payload.appPath, {
      function: 'dev-add-app',
      source: 'appHandler'
    })
    // await appStore.run('developer-app', appPath)
  },
  'send-to-app': async (data) => {
    const appStore = await storeProvider.getStore('appStore')
    Logger.debug('Sending data to app', {
      source: 'AppHandler',
      domain: data.payload?.app || 'unknown',
      function: 'send-to-app'
    })
    await appStore.sendDataToApp(data.payload.app, data.payload)
  },
  'app-order': async (data) => {
    const appStore = await storeProvider.getStore('appStore')
    appStore.reorder(data.payload)
  },

  icon: async (data) => {
    const appStore = await storeProvider.getStore('appStore')
    const { appId, icon } = data.payload
    return appStore.getIcon(appId, icon)
  }
}

/**
 * Retrieves all the apps from the app store and sends the data to the reply function.
 *
 * @param replyFn - A function to send the app data to a client.
 * @returns An array of all the apps in the app store.
 */
const getApps = async (): Promise<App[]> => {
  const appStore = await storeProvider.getStore('appStore')
  const data = appStore.getAllBase()
  return data
}

/**
 * Saves the provided app data to the data store.
 *
 * @param replyFn - A function to send a response back to the client.
 * @param id - The ID of the app whose data is being saved.
 * @param settings - The app settings.
 * @returns A Promise that resolves when the data has been saved.
 */
const setAppSettings = async (appId: string, settings: AppSettings): Promise<void> => {
  const appDataStore = await storeProvider.getStore('appDataStore')
  Logger.debug('[setAppSettings]: Saving ' + appId + "'s data " + settings)
  appDataStore.addSettings(appId, settings)
}

const setAppData = async (appId: string, appData: SavedData): Promise<void> => {
  const appDataStore = await storeProvider.getStore('appDataStore')
  Logger.debug('[setAppData]: Saving ' + appId + "'s data " + appData)
  appDataStore.addData(appId, appData)
}

/**
 * Retrieves the app data for the specified payload.
 *
 * @param replyFn - A function to send a response back to the client.
 * @param payload - The payload containing the data needed to retrieve the app settings.
 * @returns A Promise that resolves to the app settings, or null if an error occurs.
 */
const getAppSettings = async (payload: string): Promise<AppSettings | null> => {
  try {
    const appDataStore = await storeProvider.getStore('appDataStore')
    const data = await appDataStore.getSettings(payload)

    return data || null
  } catch (error) {
    Logger.log(LOGGING_LEVELS.ERROR, '[getAppSettings]: Error getting settings' + error)
    console.error('Error setting app settings:', error)
    return null
  }
}
/**
 * Retrieves the app data for the specified payload.
 *
 * @param replyFn - A function to send a response back to the client.
 * @param payload - The payload containing the data needed to retrieve the app data.
 * @returns A Promise that resolves to the app data, or null if an error occurs.
 */
const getAppData = async (payload: string): Promise<SavedData | null> => {
  try {
    const appDataStore = await storeProvider.getStore('appDataStore')
    const data = await appDataStore.getSavedData(payload)

    return data || null
  } catch (error) {
    Logger.log(LOGGING_LEVELS.ERROR, '[getAppData]: Error getting app data', {
      error: error as Error,
      function: 'getAppData',
      source: 'AppHandler'
    })
    return null
  }
}
