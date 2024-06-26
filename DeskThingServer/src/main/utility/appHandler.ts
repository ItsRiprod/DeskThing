/* eslint-disable no-case-declarations */
import { app, ipcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { join, basename } from 'path'
import * as fs from 'fs'
import * as unzipper from 'unzipper'
import { getAppData, setAppData, getAppByName } from './configHandler'
import { getData, setData, addData } from './dataHandler'
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
    default:
      console.log(`Unknown data type from ${app}: ${type}`)
      break
  }
}
async function requestAuthData(appName: string, scope: Array<string>): Promise<void> {
  const requestId = uuidv4()

  // Send IPC message to renderer to display the form
  sendIpcMessage('request-user-data', requestId, scope)

  ipcMain.once(`user-data-response-${requestId}`, async (event, formData) => {
    console.log(event)
    sendMessageToApp(appName, 'data', formData)
  })
}

async function runApp(appName: string): Promise<void> {
  try {
    const appEntryPoint = join(app.getPath('userData'), 'extracted_apps', appName, `index.js`)
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
  const app = runningApps.get(appName)
  if (app && typeof app.onMessageFromMain === 'function') {
    ;(app.onMessageFromMain as OnMessageFromMainType)(type, ...args)
  } else {
    console.error(`App ${appName} not found or does not have onMessageFromMain function.`)
  }
}

function stopApp(appName: string): void {
  try {
    const appInstance = runningApps.get(appName)
    if (appInstance && typeof appInstance.stop === 'function') {
      appInstance.stop()
    }
    runningApps.delete(appName)
  } catch (error) {
    console.error(`Error stopping app ${appName}`, error)
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

function handleZip(zipFilePath: string, appPath: string): void {
  try {
    const extractDir = join(appPath, 'extracted_apps') // Extract to user data folder

    // Create the extraction directory if it doesn't exist
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true })
    }

    const appName = basename(zipFilePath).replace('.zip', '')
    const appDirectory = join(extractDir, appName)
    if (!fs.existsSync(appDirectory)) {
      fs.mkdirSync(appDirectory, { recursive: true })
    }

    // Extract the .zip file
    fs.createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: appDirectory }))
      .promise()
      .then(() => {
        console.log(`Successfully extracted ${zipFilePath} to ${appDirectory}`)
      })
      .catch((error) => {
        console.error('Error handling zip file:', error)
      })
  } catch (error) {
    console.error('Error handling zip file:', error)
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
      }
    }
  } catch (error) {
    console.error('Error loading and running enabled apps:', error)
  }
}

async function addApp(event, appName: string): Promise<void> {
  console.log(event)
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

export { runApp, sendMessageToApp, stopApp, stopAllApps, handleZip, loadAndRunEnabledApps, addApp }
