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
import { AppDataInterface } from '@shared/types'
import { deleteFile, readFromFile, writeToFile } from '../../utils/fileHandler'
import { join } from 'path'

// Updated function to read Data using the new fileHandler
const readAppData = async (name: string): Promise<AppDataInterface | undefined> => {
  const dataFilePath = join('data', `${name}.json`)
  try {
    const data = readFromFile<AppDataInterface>(dataFilePath)
    return data || undefined
  } catch (err) {
    console.error('Error reading data:', err)
    return
  }
}

// Updated function to write Data using the new fileHandler
const writeAppData = async (name: string, data: AppDataInterface): Promise<void> => {
  const dataFilePath = join('data', `${name}.json`)
  writeToFile<AppDataInterface>(data, dataFilePath)
}

// Set data function
export const setData = async (
  appName: string,
  value: Partial<AppDataInterface>
): Promise<AppDataInterface | undefined> => {
  const data = await readAppData(appName)
  if (data) {
    // Merge the new data with the existing data
    const mergedData: AppDataInterface = {
      version: value.version ?? data.version,
      data: { ...data.data, ...value.data },
      settings: { ...data.settings, ...value.settings }
    }

    writeAppData(appName, mergedData)
    // return merged data
    return mergedData
  } else {
    if (value?.version != undefined) {
      const appData: AppDataInterface = {
        data: value.data,
        settings: value.settings,
        version: value.version
      }

      writeAppData(appName, appData)
      return appData
    }
    return
  }
}

// Get data function
export const getData = async (app: string): Promise<AppDataInterface | undefined> => {
  return await readAppData(app)
}

export const purgeAppData = async (appName: string): Promise<void> => {
  await deleteFile(join('data', `${appName}.json`))
}