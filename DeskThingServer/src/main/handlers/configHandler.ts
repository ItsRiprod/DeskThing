console.log('[Config Handler] Starting')
import { sendIpcData } from '..'
import { AppData, App, MESSAGE_TYPES, Manifest, ButtonMapping } from '@shared/types'
import loggingStore from '../stores/loggingStore'
import { readFromFile, writeToFile } from '../utils/fileHandler'

const defaultData: AppData = {
  apps: [],
  config: {
    testData: 'thisisastring'
  }
}

// Helper function to read data
const readData = (): AppData => {
  const dataFilePath = 'apps.json'
  try {
    const data = readFromFile<AppData>(dataFilePath)
    if (!data) {
      // File does not exist, create it with default data
      writeToFile(defaultData, dataFilePath)
      return defaultData
    }
    // If data is of type AppData, return it
    return data as AppData
  } catch (err) {
    console.error('Error reading data:', err)
    return defaultData
  }
}

// Helper function to write data
const writeData = (data: AppData): void => {
  try {
    const result = writeToFile<AppData>(data, 'apps.json')
    if (!result) {
      loggingStore.log(MESSAGE_TYPES.ERROR, 'Error writing data')
    }
    sendIpcData('app-data', data) // Send data to the web UI
  } catch (err) {
    loggingStore.log(MESSAGE_TYPES.ERROR, 'Error writing data' + err)
    console.error('Error writing data:', err)
  }
}

// Set data function
const setAppData = async (newApp: App): Promise<void> => {
  const data = readData()

  // Find existing app by name
  const existingAppIndex = data.apps.findIndex((app: App) => app.name === newApp.name)

  if (existingAppIndex !== -1) {
    // Update existing app
    data.apps[existingAppIndex] = newApp
  } else {
    // Add new app
    data.apps.push(newApp)
  }
  writeData(data)
}

// Set data function
const setAppsData = async (appsList: App[]): Promise<void> => {
  const data = readData()
  data.apps = appsList
  writeData(data)
}

const addAppManifest = (manifest: Manifest, appName: string): void => {
  const data = readData()

  // Find existing app by name
  const existingAppIndex = data.apps.findIndex((app: App) => app.name === appName)

  if (existingAppIndex !== -1) {
    // Update existing app
    data.apps[existingAppIndex].manifest = manifest
  } else {
    // Add new app
    console.error(`${appName} does not exist!`)
  }
  writeData(data)
}

const addConfig = (configName: string, config: string | Array<string>, data = readData()): void => {
  if (!data.config) {
    const val = {}
    val[configName] = config
    data.config = val
  } else if (Array.isArray(data.config[configName])) {
    const existingArray = data.config[configName] as string[]
    if (Array.isArray(config)) {
      config.forEach((item) => {
        if (!existingArray.includes(item)) {
          existingArray.push(item)
        }
      })
    } else {
      if (!existingArray.includes(config)) {
        existingArray.push(config)
      }
    }
  } else {
    data.config[configName] = config
  }
  // loggingStore.log(MESSAGE_TYPES.CONFIG, {
  //   app: 'server',
  //   type: 'config',
  //   payload: data.config
  // })
  writeData(data)
}
const getConfig = (
  configName: string
): { [app: string]: string | Array<string> | ButtonMapping | undefined } => {
  const data = readData()

  if (!data.config) {
    const val = {}
    data.config = val
    writeData(data)
  }

  return { [configName]: data.config[configName] }
}

// Get data function
const getAppData = (): AppData => {
  const data = readData()
  return data
}

const getAppByName = (appName: string): App | undefined => {
  const data = readData()

  // Find the app by name in the apps array
  const foundApp = data.apps.find((app: App) => app.name === appName)

  return foundApp
}
const getAppByIndex = (index: number): App | undefined => {
  const data = readData()

  // Find the app by name in the apps array
  const foundApp = data.apps.find((app: App) => app.prefIndex === index)

  return foundApp
}

const purgeAppConfig = async (appName: string): Promise<void> => {
  loggingStore.log(MESSAGE_TYPES.LOGGING, `Purging app: ${appName}`)
  const data = readData()

  // Filter out the app to be purged
  const filteredApps = data.apps.filter((app: App) => app.name !== appName)
  data.apps = filteredApps

  writeData(data)
  // loggingStore.log(MESSAGE_TYPES.CONFIG, {
  //   app: 'server',
  //   type: 'config',
  //   payload: data.config
  // })
}

export {
  setAppData,
  setAppsData,
  getAppData,
  getAppByName,
  getAppByIndex,
  addAppManifest,
  addConfig,
  getConfig,
  purgeAppConfig
}
