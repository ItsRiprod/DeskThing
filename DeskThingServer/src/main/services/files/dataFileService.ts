/**
 * Provides functions to read, write, and manage application data stored in a JSON file.
 *
 * The `readData` function reads the data from the JSON file, creating a default data structure if the file does not exist.
 * The `writeData` function writes the provided data to the JSON file.
 * The `setData` function updates the data for a specific application, notifying the application of the change.
 * The `addData` function adds or merges data for a specific application.
 * The `getData` function retrieves the data for a specific application.
 * The `purgeAppData` function removes the data for a specific application.
 */

import { AppDataInterface } from '@DeskThing/types'
import { deleteFile, readFromFile, writeToFile } from './fileService'
import { join } from 'path'
import logger from '@server/utils/logger'
import { isValidAppDataInterface } from '../apps/appValidator'

// Updated function to read Data using the new FileService
const readAppData = async (name: string): Promise<AppDataInterface | undefined> => {
  const dataFilePath = join('data', `${name}.json`)
  try {
    const data = await readFromFile<AppDataInterface>(dataFilePath)
    if (!data) return
    isValidAppDataInterface(data)
    return data
  } catch (err) {
    logger.error(`Error reading data for ${name}:`, {
      error: err as Error,
      function: 'readAppData',
      source: 'DataFileService'
    })
    throw err
  }
}

/**
 * Updated function to write Data using the new FileService
 * @throws {Error} If there is an error writing the data.
 */
const writeAppData = async (name: string, data: AppDataInterface): Promise<void> => {
  const dataFilePath = join('data', `${name}.json`)
  try {
    logger.debug('[writeAppData] Saving app data', {
      source: 'DataFileService',
      function: 'writeAppData',
      domain: 'SERVER.' + name
    })
    await writeToFile<AppDataInterface>(data, dataFilePath)
  } catch (error) {
    logger.error(`Error writing data for ${name}:`, {
      error: error as Error,
      function: 'writeAppData',
      source: 'DataFileService'
    })
    throw error
  }
}

export const overwriteData = async (name: string, data: AppDataInterface): Promise<void> => {
  try {
    logger.debug('[overwriteData] Overwriting app data', {
      source: 'DataFileService',
      function: 'overwriteData',
      domain: 'SERVER.' + name
    })
    await writeAppData(name, data)
  } catch (err) {
    logger.error(`Error overwriting data for ${name}:`, {
      error: err as Error,
      function: 'overwriteData',
      source: 'DataFileService'
    })
  }
}
// Set data function
export const setData = async (
  appName: string,
  value: Partial<AppDataInterface>
): Promise<AppDataInterface | undefined> => {
  logger.debug('[setData] Saving app data', {
    source: 'DataFileService',
    function: 'setData',
    domain: 'SERVER.' + appName
  })
  try {
    const data = await readAppData(appName).catch(() => undefined)
    if (data) {
      // Merge the new data with the existing data
      const mergedData: AppDataInterface = {
        version: value.version ?? data.version,
        data: { ...data.data, ...value.data },
        settings: { ...data.settings, ...value.settings },
        tasks: { ...data.tasks, ...value.tasks }
      }

      await writeAppData(appName, mergedData)
      // return merged data
      return mergedData
    } else {
      if (value?.version != undefined) {
        const appData: AppDataInterface = {
          data: value.data || {},
          settings: value.settings || {},
          version: value.version,
          tasks: value.tasks || {}
        }

        await writeAppData(appName, appData)
        return appData
      }
      return
    }
  } catch (err) {
    logger.error(`Error setting data for ${appName}:`, {
      error: err as Error,
      function: 'setData',
      source: 'DataFileService'
    })
    if (value?.version != undefined) {
      const appData: AppDataInterface = {
        data: value.data,
        settings: value.settings,
        version: value.version,
        tasks: value.tasks
      }
      try {
        await writeAppData(appName, appData)
      } catch (error) {
        logger.error(`Error writing default data for ${appName}:`, {
          error: error as Error,
          function: 'writeAppData',
          source: 'DataFileService'
        })
      }
      return appData
    }
    return
  }
}

/**
 * Returns all of the data in relation to a specific app
 * @param app
 * @returns
 */
export const getData = async (app: string): Promise<AppDataInterface | undefined> => {
  try {
    const data = await readAppData(app)
    return data
  } catch (err) {
    logger.error(`Error getting data for ${app}:`, {
      error: err as Error,
      function: 'getData',
      source: 'DataFileService'
    })
    return
  }
}

export const purgeAppData = async (appName: string): Promise<void> => {
  try {
    await deleteFile(join('data', `${appName}.json`))
  } catch (error) {
    logger.error(`Error deleting app data for ${appName}:`, {
      error: error as Error,
      function: 'purgeAppData',
      source: 'DataFileService'
    })
  }
}
