import { readFromFile, writeToFile } from '../utils/fileHandler'

interface Data {
  [appName: string]: {
    [key: string]: string
  }
}

// Default data structure
const defaultData: Data = {}
// Updated function to read Data using the new fileHandler
const readData = (): Data => {
  const dataFilePath = 'data.json'
  try {
    const data = readFromFile(dataFilePath)
    if (!data) {
      // File does not exist, create it with default data
      writeToFile(defaultData, dataFilePath)
      return defaultData
    }

    // If data is of type Data, return it
    if (isData(data)) {
      return data as Data
    } else {
      // Handle case where data is not of type Data
      console.error('Data format is incorrect')
      return defaultData
    }
  } catch (err) {
    console.error('Error reading data:', err)
    return defaultData
  }
}

// Type guard to check if data is of type Data
const isData = (data: any): data is Data => {
  // Simple check to verify if data conforms to the Data interface
  return (
    typeof data === 'object' &&
    data !== null &&
    Object.values(data).every(
      (value) =>
        typeof value === 'object' &&
        value !== null &&
        Object.values(value).every((val) => typeof val === 'string')
    )
  )
}

// Updated function to write Data using the new fileHandler
const writeData = (data: Data): void => {
  try {
    const dataFilePath = 'data.json'
    writeToFile(data, dataFilePath)
  } catch (err) {
    console.error('Error writing data:', err)
  }
}
// Set data function
const setData = (key: string, value: { [key: string]: string }): void => {
  const data = readData()
  data[key] = value
  writeData(data)
}
// Set data function
const addData = (key: string, value: { [key: string]: string }): void => {
  const data = readData()
  if (!data[key]) {
    data[key] = value
  } else {
    data[key] = { ...data[key], ...value }
  }
  writeData(data)
}

// Get data function
const getData = (key): { [key: string]: string } => {
  const data = readData()
  return data[key]
}

const purgeData = async (appName: string): Promise<void> => {
  console.log('SERVER: Deleting app data...')
  const data = readData()
  delete data[appName]
  writeData(data)
}

export { setData, getData, addData, readData, purgeData }
