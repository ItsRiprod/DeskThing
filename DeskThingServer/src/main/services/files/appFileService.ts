/**
 * Configuration Handler Module
 *
 * This module handles reading and writing application configuration data to/from files.
 * It provides functionality to manage the application's data persistence layer, including:
 * - Reading app configuration from JSON files
 * - Writing app configuration to JSON files
 * - Maintaining default configuration values
 * - Error handling for file operations
 * - IPC communication for configuration updates
 *
 * The configuration data follows the AppData interface structure and is stored in 'apps.json'.
 * If the configuration file doesn't exist, it will be created with default values.
 */

import { App, LOGGING_LEVELS, AppManifest } from '@DeskThing/types'
import Logger from '@server/utils/logger'
import { AppData } from '@shared/types'
import { readFromFile, writeToFile } from './fileService'
import { verifyAppInstanceStructure, sanitizeAppStructure } from '../apps/appValidator'

const defaultData: AppData = {}

/**
 * Reads the application data from a file and returns it as an `AppData` object.
 * If the file does not exist, it creates a new file with the default data and returns it.
 * If there is an error reading the file, it returns the default data.
 *
 * @returns {AppData} The application data read from the file, or the default data if the file does not exist or there is an error.
 */
const readData = async (): Promise<AppData> => {
  const dataFilePath = 'apps.json'
  try {
    const data = (await readFromFile<AppData>(dataFilePath)) || undefined
    verifyAppInstanceStructure(data)
    // If data is of type AppData, return it
    return data
  } catch (err) {
    if (err instanceof Error) {
      Logger.log(LOGGING_LEVELS.WARN, '[ReadData] Failed with ' + err.message)
    } else {
      Logger.log(
        LOGGING_LEVELS.WARN,
        '[ReadData] Failed with unknown error. See full logs for details'
      )
      console.error('Error reading data:', err)
    }
    return defaultData
  }
}

/**
 * Writes the provided `AppData` object to a file named 'apps.json'. If the write is successful, it also sends the data to the web UI via the `sendIpcData` function. If there is an error writing the data, it logs the error to the `Logger`.
 *
 * @param {AppData} data - The `AppData` object to be written to the file.
 * @returns {void}
 */
const writeData = async (data: AppData): Promise<void> => {
  try {
    Logger.info('Writing App data', {
      source: 'AppFileService',
      function: 'writeData'
    })

    verifyAppInstanceStructure(data)

    await writeToFile<AppData>(data, 'apps.json')
  } catch (err) {
    Logger.error('[writeData] Error writing data' + err)
    console.error('Error writing data:', err)
  }
}

/**
 * Updates the application data by either adding a new app or updating an existing one.
 *
 * @param {App} newApp - The new app to be added or updated.
 * @returns {Promise<void>} - A Promise that resolves when the data has been written to the file.
 */
export const setAppData = async (newApp: Partial<App>): Promise<void> => {
  const data = await readData()

  if (!newApp.name) {
    Logger.log(LOGGING_LEVELS.WARN, 'Unable to save app. Missing name!')
    return
  }

  Logger.debug('[setAppData] Saving app', {
    source: 'AppFileService',
    function: 'setAppData',
    domain: 'SERVER.' + newApp.name
  })

  // Find existing app by name
  const existingApp = data[newApp.name]

  if (existingApp) {
    // Update existing app
    data[newApp.name] = { ...existingApp, ...newApp }
  } else {
    // Add new app
    try {
      sanitizeAppStructure(newApp)
      data[newApp.name] = newApp
    } catch (error) {
      if (error instanceof Error) {
        Logger.log(LOGGING_LEVELS.ERROR, `Failed to save app: ${error.message}`)
        console.error('App save error:', error.stack)
      } else {
        Logger.log(LOGGING_LEVELS.ERROR, 'Failed to save app: Unknown error occurred')
        console.error('Unexpected app save error:', error)
      }
      return
    }
  }
  await writeData(data)
}

/**
 * Updates the application data by setting the `apps` property of the `AppData` object to the provided `appsList` array.
 *
 * @param {App[]} appsList - The new list of apps to be set in the `AppData` object.
 * @returns {Promise<void>} - A Promise that resolves when the data has been written to the file.
 */
export const setAppsData = async (appsList: App[]): Promise<void> => {
  const newAppData: AppData = {}

  appsList.map((app) => {
    newAppData[app.name] = app
  })

  await writeData(newAppData)
}

/**
 * Adds or updates the manifest for an existing application.
 *
 * @param {AppManifest} manifest - The new manifest to be added or updated.
 * @param {string} appName - The name of the application to update.
 * @returns {void}
 */
export const addAppManifest = async (manifest: AppManifest, appName: string): Promise<void> => {
  const data = await readData()

  Logger.log(LOGGING_LEVELS.LOG, `Adding manifest for ${appName} in the config file`)
  // Find existing app by name
  if (data[appName]) {
    // Update existing app
    data[appName].manifest = manifest
  } else {
    // Add new app
    Logger.log(LOGGING_LEVELS.ERROR, `Adding manifest for ${appName} failed! App does not exist!`)
  }
  await writeData(data)
}

/**
 * Retrieves the application data.
 *
 * @returns {AppData} The application data.
 */
export const getAppData = async (): Promise<AppData> => {
  const data = await readData()
  return data
}

/**
 * Retrieves an application by its name.
 *
 * @param appName - The name of the application to retrieve.
 * @returns The application if found, or `undefined` if not found.
 */
export const getAppByName = async (appName: string): Promise<App | undefined> => {
  const data = await getAppData()

  // Find the app by name in the apps array
  const foundApp = data[appName]

  return foundApp
}

/**
 * Purges the app data from file.
 *
 * @param appName - The name of the application to purge the configuration for.
 * @returns A Promise that resolves when the configuration has been purged.
 */
export const purgeAppConfig = async (appName: string): Promise<void> => {
  try {
    Logger.log(LOGGING_LEVELS.LOG, `Purging app: ${appName}`)
    const data = await readData()

    if (!data[appName]) {
      throw new Error(`App ${appName} not found`)
    }

    delete data[appName]
    await writeData(data)
  } catch (error) {
    Logger.log(LOGGING_LEVELS.ERROR, `Failed to purge app ${appName}: ${error}`)
    throw error
  }
}
