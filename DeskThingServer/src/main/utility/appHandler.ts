/* eslint-disable no-case-declarations */
import { app, ipcMain } from 'electron'
import { join } from 'path'
import * as fs from 'fs'
import * as unzipper from 'unzipper'
import {
  getAppData,
  setAppData,
  getAppByName,
  addAppManifest,
  getConfig,
  purgeAppConfig
} from './configHandler'
import { getData, setData, addData, purgeData } from './dataHandler'
import { sendIpcMessage, openAuthWindow } from '../index'
import { sendMessageToClients } from './websocketServer'
interface AppInstance {
  start: () => void
  onMessageFromMain: () => void
  stop: () => void
}
type OnMessageFromMainType = (channel: string, ...args: any[]) => void

const runningApps = new Map<string, AppInstance>()

function handleDataFromApp(app: string, type: string, ...args: any[]): void {
  console.log(`SERVER: Received data from main process on channel ${type}:`, args)

  switch (type) {
    case 'message':
      const [message] = args
      console.log(`SERVER: Message from ${app}: ${message}`)
      sendMessageToApp(app, 'message', 'Hello from server!')
      break
    case 'get':
      switch (args[0]) {
        case 'data':
          const value = getData(app)
          sendMessageToApp(app, 'data', value)
          break
        case 'config':
          if (args[1]) {
            const value = getConfig(args[1])
            sendMessageToApp(app, 'config', value)
          } else {
            sendMessageToApp(app, 'error', 'The type of config to retrieve was undefined!')
            console.error(`SERVER: The type of config from ${app} was undefined`)
          }
          break
        case 'auth':
          requestAuthData(app, args[1])
          break
        default:
          break
      }
      break
    case 'set':
    case 'add':
      const [data] = args
      if (type === 'set') {
        setData(app, data)
      } else {
        addData(app, data)
      }
      break
    case 'open':
      const [auth_url] = args
      openAuthWindow(auth_url)
      break
    case 'data':
      if (app && args[0]) {
        sendMessageToClients({ app: app, type: args[0].type, data: args[0].data })
      }
      break
    case 'manifest':
      if (app && args[0]) {
        addAppManifest(args[0], app)
      }
      break
    case 'toApp':
      if (args[1] && args[0]) {
        console.log(`SERVER: Sending data to app ${args[0]}`, ...args.slice(1))
        sendMessageToApp(args[0], args[1], ...args.slice(2))
      }
      break
    default:
      console.log(`Unknown data type from ${app}: ${type}`)
      break
  }
}
async function requestAuthData(appName: string, scope: Array<string>): Promise<void> {
  // Send IPC message to renderer to display the form
  sendIpcMessage('request-user-data', appName, scope)

  ipcMain.once(`user-data-response-${appName}`, async (_event, formData) => {
    sendMessageToApp(appName, 'data', formData)
  })
}

async function runApp(appName: string): Promise<void> {
  try {
    const appEntryPoint = join(app.getPath('userData'), 'apps', appName, `index.js`)
    console.log(appEntryPoint)
    if (fs.existsSync(appEntryPoint)) {
      const { start, onMessageFromMain, stop } = await import('file://' + appEntryPoint)

      console.log(`Running ${appEntryPoint}...`)
      if (typeof start === 'function') {
        const sendDataToMain = (type: string, ...args: any[]): void => {
          handleDataFromApp(appName, type, ...args)
        }

        runningApps.set(appName, { start, onMessageFromMain, stop })
        start({
          sendDataToMain,
          emitToApps: (channel: string, ...args: any[]): void => {
            for (const [otherAppName, appInstance] of runningApps) {
              if (otherAppName !== appName && typeof appInstance.onMessageFromMain === 'function') {
                ;(appInstance.onMessageFromMain as OnMessageFromMainType)(channel, ...args)
              }
            }
          }
        })
        await sendMessageToApp(appName, 'get', 'manifest')
      } else {
        console.error(`App entry point ${appEntryPoint} does not export a start function.`)
      }
    } else {
      console.error(`App entry point ${appEntryPoint} not found.`)
    }
  } catch (error) {
    console.error('Error running app:', error)
  }
}

function sendMessageToApp(appName: string, type: string, ...args: any[]): void {
  try {
    const app = runningApps.get(appName)
    if (app && typeof app.onMessageFromMain === 'function') {
      ;(app.onMessageFromMain as OnMessageFromMainType)(type, ...args)
    } else {
      console.error(`App ${appName} not found or does not have onMessageFromMain function.`)
    }
  } catch (e) {
    console.error(
      `Error attempting to send message to app ${appName} with ${type} and data: `,
      args,
      e
    )
  }
}

function stopApp(appName: string): void {
  try {
    const appInstance = runningApps.get(appName)
    if (appInstance && typeof appInstance.stop === 'function') {
      appInstance.stop()
    }
    runningApps.delete(appName)
    console.log('stopped ', appName)
  } catch (error) {
    console.error(`Error stopping app ${appName}`, error)
  }
}

function disableApp(appName: string): void {
  stopApp(appName)
  try {
    // Load existing apps config
    const appConfig = getAppByName(appName)

    if (!appConfig) {
      console.log('App not found in config, add it')
      // App not found in config, add it
      const newAppConfig = { name: appName, enabled: false, prefIndex: 5 } // You might need to adjust this based on your app structure
      setAppData(newAppConfig)
    } else if (appConfig.enabled) {
      // App found but not enabled, enable it
      appConfig.enabled = false
      // Save updated config file (if enabled changed)
      setAppData(appConfig)
      console.log('Disabled ', appName)
    }

    // Run the app if enabled
  } catch (error) {
    console.error('Error adding app:', error)
  }
}

function stopAllApps(): void {
  try {
    for (const appName of runningApps.keys()) {
      stopApp(appName)
    }
  } catch (error) {
    console.error('Error stopping all apps:', error)
  }
}

/**
 * Inputs a .zip file path of an app and extracts it to the /apps/appId/ folder.
 * Returns metadata about the extracted app.
 *
 * @param {string} zipFilePath - The file path of the .zip file to extract.
 * @returns {Promise<returnData>} An object containing metadata about the extracted app:
 * - {string} appId - The ID of the app extracted.
 * - {string} appName - The name of the app extracted.
 * - {string} appVersion - The version of the app extracted.
 * - {string} author - The author of the app extracted.
 * - {string[]} platforms - The platforms supported by the app extracted.
 * - {string[]} requirements - The requirements needed to run the app extracted.
 * @throws {Error} If there is an error during the extraction process or if the manifest.json file is missing required fields.
 */
interface returnData {
  appId: string
  appName: string
  appVersion: string
  author: string
  platforms: string[]
  requirements: string[]
}
async function handleZip(zipFilePath: string): Promise<returnData> {
  try {
    const extractDir = join(app.getPath('userData'), 'apps') // Extract to user data folder
    console.log('Extracting to: ', extractDir)
    // Create the extraction directory if it doesn't exist
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true })
    }

    // Create the 'temp' file directory for temporary extraction
    const tempDir = join(extractDir, 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    console.log('Temp directory: ', tempDir)

    // Extract the .zip file to a temporary location to get the manifest.json
    await new Promise<void>((resolve, reject) => {
      const extractStream = fs
        .createReadStream(zipFilePath)
        .pipe(unzipper.Extract({ path: tempDir }))

      extractStream.on('error', reject)
      extractStream.on('close', () => {
        console.log('Extraction finished')
        resolve()
      })
    })

    console.log(`Files under ${tempDir}:`)
    fs.readdirSync(tempDir).forEach((file) => {
      console.log(file)
    })

    const manifestPath = join(tempDir, 'manifest.json')
    console.log('Manifest path: ', manifestPath)

    if (!fs.existsSync(manifestPath)) {
      throw new Error('manifest.json not found after extraction')
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    const id = manifest.id
    const requires = manifest.requires
    const label = manifest.label
    const version = manifest.version
    const author = manifest.author
    const platforms = manifest.platforms

    if (!id || !label || !version || !author) {
      throw new Error(
        'manifest.json is missing required fields! Expecting "id", "label", "version", and "author"'
      )
    }
    const returnData = {
      appId: id,
      appName: label,
      appVersion: version,
      author: author,
      platforms: platforms,
      requirements: requires
    }

    // Create the folder where the app will be stored in
    const appDirectory = join(extractDir, id)
    if (fs.existsSync(appDirectory)) {
      fs.rmSync(appDirectory, { recursive: true })
    }
    fs.renameSync(tempDir, appDirectory)

    console.log(`Successfully extracted ${zipFilePath} to ${appDirectory}`)
    return returnData
  } catch (error) {
    console.error('Error handling zip file:', error)
    throw new Error('Error handling zip file')
  }
}

async function loadAndRunEnabledApps(): Promise<void> {
  try {
    const appsConfig = getAppData()
    console.log('Loaded apps config. Running apps...')
    console.log(appsConfig)
    for (const appConfig of appsConfig.apps) {
      if (appConfig.enabled == true) {
        console.log(`Automatically running app ${appConfig.name}`)
        await runApp(appConfig.name)
        await sendMessageToApp(appConfig.name, 'get', 'manifest')
      }
    }
  } catch (error) {
    console.error('Error loading and running enabled apps:', error)
  }
}

async function addApp(_event, appName: string): Promise<void> {
  try {
    // Load existing apps config
    const appConfig = getAppByName(appName)

    if (!appConfig) {
      // App not found in config, add it
      const newAppConfig = { name: appName, enabled: true, prefIndex: 5 } // You might need to adjust this based on your app structure
      setAppData(newAppConfig)
    } else if (!appConfig.enabled) {
      // App found but not enabled, enable it
      appConfig.enabled = true
      // Save updated config file (if enabled changed)
      setAppData(appConfig)
      console.log(`Attempting to run app ${appName}`)
    } else {
      console.log(`App '${appName}' already exists and is enabled.`)
    }
    if (runningApps.has(appName)) {
      console.log('Running app...')
      await stopApp(appName)
    }

    await runApp(appName)

    // Run the app if enabled
  } catch (error) {
    console.error('Error adding app:', error)
  }
}
async function purgeAppData(_event, appName: string): Promise<void> {
  console.log('SERVER: Purging Data...')
  purgeData(appName)
  console.log('SERVER: Purging Config...')
  purgeAppConfig(appName)

  console.log('SERVER: Purging File...')
  const appDirectory = join(app.getPath('userData'), 'apps', appName)
  if (fs.existsSync(appDirectory)) {
    fs.rmSync(appDirectory, { recursive: true })
    console.log(`Deleted app directory: ${appDirectory}`)
  } else {
    console.log(`App directory not found: ${appDirectory}`)
  }
}

export {
  runApp,
  sendMessageToApp,
  stopApp,
  stopAllApps,
  handleZip,
  loadAndRunEnabledApps,
  addApp,
  disableApp,
  purgeAppData
}
