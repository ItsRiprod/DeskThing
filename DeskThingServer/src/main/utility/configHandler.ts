import { app } from 'electron'
import { join } from 'path'
import * as fs from 'fs'

interface App {
  name: string
  enabled: boolean
  prefIndex: number
}
interface AppData {
  [appName: string]: App[]
}

const defaultData: AppData = {
  apps: [
    {
      name: 'utility',
      enabled: true,
      prefIndex: 1
    }
  ]
}

// Helper function to read data
const readData = (): AppData => {
  const dataFilePath = join(app.getPath('userData'), 'apps.json')
  try {
    if (!fs.existsSync(dataFilePath)) {
      // File does not exist, create it with default data
      fs.writeFileSync(dataFilePath, JSON.stringify(defaultData, null, 2))
      return defaultData
    }

    const rawData = fs.readFileSync(dataFilePath)
    return JSON.parse(rawData.toString())
  } catch (err) {
    console.error('Error reading data:', err)
    return defaultData
  }
}

// Helper function to write data
const writeData = (data: AppData): void => {
  try {
    const dataFilePath = join(app.getPath('userData'), 'apps.json')
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('Error writing data:', err)
  }
}

// Set data function
const setAppData = (newApp: App): void => {
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

export { setAppData, getAppData, getAppByName, getAppByIndex }
