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
import {
  App,
  AppDataInterface,
  AppReturnData,
  AppIPCData,
  ReplyFn,
  MESSAGE_TYPES
} from '@shared/types'
import loggingStore from '../stores/loggingStore'
import { getData, setData } from '../services/files/dataService'
import { dialog, BrowserWindow } from 'electron'
import { sendMessageToApp, AppHandler } from '../services/apps'
const appStore = AppHandler.getInstance()

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
export const appHandler: Record<
  AppIPCData['type'],
  (
    data: AppIPCData,
    replyFn: ReplyFn
  ) => Promise<
    AppDataInterface | boolean | App[] | undefined | void | null | App | string | AppReturnData
  >
> = {
  /**
   * Handles the 'app' IPC data request, returning the list of available apps when the 'get' request is made.
   *
   * @param data - The IPC data object, containing the 'request' property set to 'get'.
   * @param replyFn - The function to call to send a response back to the client.
   * @returns The list of available apps, or undefined if the request is not 'get'.
   */
  app: async (data, replyFn) => {
    if (data.request == 'get') {
      return await getApps(replyFn)
    }
    return
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
  data: async (data, replyFn) => {
    switch (data.request) {
      case 'get':
        return await getAppData(replyFn, data.payload)
      case 'set':
        return await setAppData(replyFn, data.payload.appId, data.payload.data)
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
  stop: async (data, replyFn) => {
    await appStore.stop(data.payload)
    replyFn('logging', { status: true, data: 'Finished', final: true })
    return true
  },
  /**
   * Disables the app with the provided payload data.
   *
   * @param data - The payload data for the app to be disabled.
   * @param replyFn - The function to call to send a response back to the client.
   * @returns `true` if the app was successfully disabled, `false` otherwise.
   */
  disable: async (data, replyFn) => {
    await appStore.disable(data.payload)
    replyFn('logging', { status: true, data: 'Finished', final: true })
    return true
  },
  /**
   * Enables the app with the provided payload data.
   *
   * @param data - The payload data for the app to be enabled.
   * @param replyFn - The function to call to send a response back to the client.
   * @returns `true` if the app was successfully enabled, `false` otherwise.
   */
  enable: async (data, replyFn) => {
    await appStore.enable(data.payload)
    replyFn('logging', { status: true, data: 'Finished', final: true })
    return true
  },
  /**
   * Runs the app with the provided payload data.
   *
   * @param data - The payload data for the app to be run.
   * @param replyFn - The function to call to send a response back to the client.
   * @returns `true` if the app was successfully run, `false` otherwise.
   */
  run: async (data, replyFn) => {
    await appStore.run(data.payload)
    replyFn('logging', { status: true, data: 'Finished', final: true })
    return true
  },
  /**
   * Purges the app with the provided payload data.
   *
   * @param data - The payload data for the app to be purged.
   * @param replyFn - The function to call to send a response back to the client.
   * @returns `true` if the app was successfully purged, `false` otherwise.
   */
  purge: async (data, replyFn) => {
    await appStore.purge(data.payload)
    replyFn('logging', { status: true, data: 'Finished', final: true })
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
   * @param data - The payload data for the zipped app to be processed.
   * @param replyFn - The function to call to send a response back to the client.
   * @returns The processed data from the zipped app, or `null` if there was an error.
   */
  zip: async (data, replyFn) => {
    /**
     * This needs to be reworked to make a pre-run state and a post-run state
     */
    replyFn('logging', { status: true, data: 'Handling zipped app', final: false })

    const returnData = await appStore.addZIP(data.payload, replyFn) // Extract to user data folder

    if (!returnData) {
      replyFn('logging', {
        status: false,
        data: returnData,
        error: '[handleZip] No data returned!',
        final: true
      })
      return returnData
    }

    replyFn('logging', { status: true, data: 'Finished', final: true })
    replyFn('zip-name', { status: true, data: returnData, final: true })
    return returnData
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
   * @param data - The payload data for the app to be processed from a URL.
   * @param replyFn - The function to call to send a response back to the client.
   * @returns The processed data from the app, or `null` if there was an error.
   */
  url: async (data, replyFn) => {
    replyFn('logging', { status: true, data: 'Handling app from URL...', final: false })

    const reply = async (channel: string, data): Promise<void> => {
      replyFn(channel, data)
    }

    const returnData = await appStore.addURL(data.payload, reply) // Extract to user data folder
    replyFn('logging', { status: true, data: 'Finished', final: true })
    replyFn('zip-name', { status: true, data: returnData, final: true })
    return returnData
  },

  'user-data-response': async (data) => {
    sendMessageToApp(data.payload.requestId, data.payload.response)
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
  'dev-add-app': async (data, replyFn) => {
    loggingStore.log(
      MESSAGE_TYPES.ERROR,
      'Developer App Not implemented Yet ',
      data.payload.appPath
    )
    // await appStore.run('developer-app', appPath)
    replyFn('logging', { status: true, data: 'Finished', final: true })
  },
  'send-to-app': async (data, replyFn) => {
    await sendMessageToApp(data.payload.app, data.payload)
    replyFn('logging', { status: true, data: 'Finished', final: true })
  },
  'app-order': async (data, replyFn) => {
    appStore.reorder(data.payload)
    replyFn('logging', { status: true, data: 'Finished', final: true })
  }
}

/**
 * Retrieves all the apps from the app store and sends the data to the reply function.
 *
 * @param replyFn - A function to send the app data to a client.
 * @returns An array of all the apps in the app store.
 */
const getApps = (replyFn: ReplyFn): App[] => {
  replyFn('logging', { status: true, data: 'Getting data', final: false })
  const data = appStore.getAllBase()
  replyFn('logging', { status: true, data: 'Finished', final: true })
  replyFn('app-data', { status: true, data: data, final: true })
  return data
}

/**
 * Saves the provided app data to the data store.
 *
 * @param replyFn - A function to send a response back to the client.
 * @param id - The ID of the app whose data is being saved.
 * @param data - The app data to be saved.
 * @returns A Promise that resolves when the data has been saved.
 */
const setAppData = async (replyFn: ReplyFn, id, data: AppDataInterface): Promise<void> => {
  loggingStore.log(MESSAGE_TYPES.LOGGING, 'SERVER: Saving ' + id + "'s data " + data)
  await setData(id, data)
  replyFn('logging', { status: true, data: 'Finished', final: true })
}

/**
 * Retrieves the app data for the specified payload.
 *
 * @param replyFn - A function to send a response back to the client.
 * @param payload - The payload containing the data needed to retrieve the app data.
 * @returns A Promise that resolves to the app data, or null if an error occurs.
 */
const getAppData = async (replyFn, payload): Promise<AppDataInterface | null> => {
  try {
    const data = await getData(payload)
    replyFn('logging', { status: true, data: 'Finished', final: true })
    return data
  } catch (error) {
    loggingStore.log(MESSAGE_TYPES.ERROR, 'SERVER: Error saving manifest' + error)
    console.error('Error setting client manifest:', error)
    replyFn('logging', { status: false, data: 'Unfinished', error: error, final: true })
    return null
  }
}
