console.log('[Data Handler] Starting')
import { AppDataInterface } from '@shared/types'
import { readFromFile, writeToFile } from '../utils/fileHandler'
import { sendMessageToApp } from '../services/apps'

interface Data {
  [appName: string]: AppDataInterface
}

// Default data structure
const defaultData: Data = {}
// Updated function to read Data using the new fileHandler
const readData = (): Data => {
  const dataFilePath = 'data.json'
  try {
    const data = readFromFile<Data>(dataFilePath)
    if (!data) {
      // File does not exist, create it with default data
      writeToFile(defaultData, dataFilePath)
      return defaultData
    }

    // If data is of type Data, return it
    return data as Data
  } catch (err) {
    console.error('Error reading data:', err)
    return defaultData
  }
}

// Updated function to write Data using the new fileHandler
const writeData = (data: Data): void => {
  try {
    const dataFilePath = 'data.json'
    writeToFile<Data>(data, dataFilePath)
  } catch (err) {
    console.error('Error writing data:', err)
  }
}
// Set data function
const setData = (key: string, value: AppDataInterface): void => {
  const data = readData()
  data[key] = value
  // Notify the app
  sendMessageToApp(key, { type: 'data', payload: value })
  writeData(data)
}
// Set data function
const addData = (key: string, value: AppDataInterface): void => {
  const data = readData()
  if (!data[key]) {
    data[key] = value
  } else {
    data[key] = { ...data[key], ...value }
  }
  writeData(data)
}

// Get data function
const getData = (app: string): AppDataInterface => {
  const data = readData()
  return data[app]
}

const purgeAppData = async (appName: string): Promise<void> => {
  const data = readData()
  delete data[appName]
  writeData(data)
}

export { setData, getData, addData, readData, purgeAppData }
