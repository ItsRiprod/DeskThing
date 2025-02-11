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

console.log('[Data Handler] Starting')
import { AppDataInterface } from '@DeskThing/types'
import { deleteFile, readFromFile, writeToFile } from '../../utils/fileHandler'
import { join } from 'path'
import logger from '@server/utils/logger'

// Updated function to read Data using the new fileHandler
const readAppData = async (name: string): Promise<AppDataInterface | undefined> => {
  const dataFilePath = join('data', `${name}.json`)
  try {
    const data = await readFromFile<AppDataInterface>(dataFilePath)
    return data || undefined
  } catch (err) {
    logger.error('Error reading data:', {
      error: err as Error,
      function: 'readAppData',
      source: 'DataService'
    })
    throw err
  }
}

/**
 * Updated function to write Data using the new fileHandler
 * @throws {Error} If there is an error writing the data.
 */
const writeAppData = async (name: string, data: AppDataInterface): Promise<void> => {
  const dataFilePath = join('data', `${name}.json`)
  try {
    await writeToFile<AppDataInterface>(data, dataFilePath)
  } catch (error) {
    logger.error('Error writing data:', {
      error: error as Error,
      function: 'writeAppData',
      source: 'DataService'
    })
    throw error
  }
}

export const overwriteData = async (name: string, data: AppDataInterface): Promise<void> => {
  try {
    await writeAppData(name, data)
  } catch (err) {
    logger.error('Error overwriting data:', {
      error: err as Error,
      function: 'overwriteData',
      source: 'DataService'
    })
  }
}
// Set data function
export const setData = async (
  appName: string,
  value: Partial<AppDataInterface>
): Promise<AppDataInterface | undefined> => {
  try {
    const data = await readAppData(appName)
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
    logger.error('Error setting data:', {
      error: err as Error,
      function: 'setData',
      source: 'DataService'
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
        logger.error('Error writing default data:', {
          error: error as Error,
          function: 'writeAppData',
          source: 'DataService'
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
    return await readAppData(app)
  } catch (err) {
    logger.error('Error getting data:', {
      error: err as Error,
      function: 'getData',
      source: 'DataService'
    })
    return
  }
}

export const purgeAppData = async (appName: string): Promise<void> => {
  try {
    await deleteFile(join('data', `${appName}.json`))
  } catch (error) {
    logger.error('Error deleting app data:', {
      error: error as Error,
      function: 'purgeAppData',
      source: 'dataService'
    })
  }
}
