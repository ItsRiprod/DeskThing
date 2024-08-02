/* eslint-disable no-case-declarations */

/**
 * The AppHandler handles all app-related functions. This includes
 * - Running Apps
 * - Stopping Apps
 * - Handling Messages from Apps
 * - Keeping track of which apps are running or not
 * - Decompiling apps from a .zip folder
 * - Handling messages to apps
 *
 * For the purposes of convention, the 'name' of an app refers to the ID of the app.
 * This may be changed. When this code was written, they were the same
 *
 */
import { app, ipcMain, net } from 'electron'
import { join, resolve } from 'path'
import * as fs from 'fs'
import * as unzipper from 'unzipper'
import {
  getAppData,
  setAppData,
  getAppByName,
  addAppManifest,
  getConfig,
  purgeAppConfig,
  Manifest
} from './configHandler'
import { getData, setData, addData, purgeData } from './dataHandler'
import { sendIpcAuthMessage, openAuthWindow } from '../index'
import { sendMessageToClients, sendPrefData } from './websocketServer'
import dataListener, { MESSAGE_TYPES } from '../utils/events'

interface AppInstance {
  start: () => void
  onMessageFromMain: OnMessageFromMainType
  stop: () => void
}

// Type that setups up the expected format for data sent to and from main
type OnMessageFromMainType = (channel: string, ...args: any[]) => void

export interface AuthScopes {
  [key: string]: {
    instructions: string
    label: string
    value?: string
  }
}

// A map of all running apps
const runningApps = new Map<string, AppInstance>()

let devAppPath: string
/**
 * Handles data received from an app.
 *
 * @param {string} app - The name of the app sending the data.
 * @param {string} type - The type of data or action requested.
 * @param {...any[]} args - Additional arguments related to the data or action.
 */
async function handleDataFromApp(app: string, type: string, ...args: any[]): Promise<void> {
  console.log(`SERVER: Received data from main process on channel ${app}`, args)
  switch (type) {
    case 'message':
      const [message] = args
      console.log(`SERVER: Message from ${app}: ${message}`)
      dataListener.asyncEmit(MESSAGE_TYPES.MESSAGE, message)
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
          requestAuthData(app, args[1] as AuthScopes)
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
        sendMessageToClients({ app: args[0].app || app, type: args[0].type, data: args[0].data })
      }
      break
    case 'toApp':
      if (args[1] && args[0]) {
        console.log(`SERVER: Sending data to app ${args[0]}`, ...args.slice(1))
        sendMessageToApp(args[0], args[1], ...args.slice(2))
      }
      break
    case 'error':
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `${app.toUpperCase()}: ${args[0]}`)
      break
    case 'log':
      dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, `${app.toUpperCase()}: ${args[0]}`)
      break
    default:
      console.log(`Unknown data type from ${app}: ${type}`)
      break
  }
}

/**
 * Handles a request for authentication data from an app.
 *
 * @param {string} appName - The name of the app requesting authentication data.
 * @param {string[]} scope - The scope of the authentication request (This is also what the user will be prompted with and how it will be saved in the file).
 */
async function requestAuthData(appName: string, scope: AuthScopes): Promise<void> {
  // Send IPC message to renderer to display the form
  sendIpcAuthMessage('request-user-data', appName, scope)

  ipcMain.once(`user-data-response-${appName}`, async (_event, formData) => {
    sendMessageToApp(appName, 'data', formData)
  })
}

/**
 * Retrieves the file path of a specified app.
 *
 * @param {string} appName - The name of the app.
 * @param {string} fileName - The name of the file to retrieve.
 * @returns {string} - The full file path of the specified file within the app's directory.
 */
export function getAppFilePath(appName: string, fileName: string = '/'): string {
  let path
  if (appName == 'developer-app') {
    if (devAppPath) {
      path = join(devAppPath, fileName)
    } else {
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, 'Developer app path not set!')
    }
  } else {
    path = join(app.getPath('userData'), 'apps', appName, fileName)
  }
  return path
}

/**
 * Runs an app by its name.
 *
 * This portion of code will run the /appName/index.js of the provided app, save the app to the list of running apps, and setup any listeners/callback functions the apps will use.
 *
 * @param {string} appName - The name of the app to run.
 */
async function runApp(appName: string): Promise<void> {
  try {
    const appEntryPointJs = getAppFilePath(appName, 'index.js')
    const appEntryPointMjs = getAppFilePath(appName, 'index.mjs')
    const appEntryPointCjs = getAppFilePath(appName, 'index.cjs')
    let appEntryPoint: string | undefined
    if (fs.existsSync(appEntryPointJs)) {
      appEntryPoint = appEntryPointJs
    } else if (fs.existsSync(appEntryPointMjs)) {
      appEntryPoint = appEntryPointMjs
    } else if (fs.existsSync(appEntryPointCjs)) {
      appEntryPoint = appEntryPointCjs
    } else {
      console.error(`Entry point for app ${appName} not found.`)
      return
    }
    console.log(appEntryPoint)
    if (fs.existsSync(appEntryPoint)) {
      const { start, onMessageFromMain, stop } = await import(`file://${resolve(appEntryPoint)}`)

      const manifestPath = getAppFilePath(appName, 'manifest.json')
      if (!fs.existsSync(manifestPath)) {
        console.error(`Manifest for app ${appName} not found at ${manifestPath}`)
        return
      }
      const manifest = await getManifest(getAppFilePath(appName))
      if (manifest == undefined) {
        console.error(`Manifest for app ${appName} is invalid!`)
        return
      }
      // Check if all required apps are running
      if (manifest?.requires) {
        const requiredApps = manifest.requires || []
        for (const requiredApp of requiredApps) {
          if (!runningApps.has(requiredApp)) {
            console.error(
              `Unable to run ${appName}! This app requires '${requiredApp}' to be enabled and running.`
            )
            dataListener.asyncEmit(
              MESSAGE_TYPES.ERROR,
              `Unable to run ${appName}! This app requires '${requiredApp}' to be enabled and running.`
            )
            const appConfig = getAppByName(appName)
            if (appConfig) {
              appConfig.running = false
              setAppData(appConfig)
            }
            return
          }
        }
      }

      dataListener.asyncEmit(MESSAGE_TYPES.MESSAGE, `Running app ${appName}!`)
      console.log(`Running ${appEntryPoint}...`)
      if (typeof start === 'function') {
        const sendDataToMain = (type: string, ...args: any[]): void => {
          handleDataFromApp(appName, type, ...args)
        }

        const listeners: OnMessageFromMainType[] = []

        const appInstance: AppInstance = {
          start,
          onMessageFromMain: (channel, ...args) => {
            onMessageFromMain(channel, ...args)
            listeners.forEach((listener) => listener(channel, ...args))
          },
          stop
        }

        runningApps.set(appName, appInstance)
        start({
          sendDataToMain,
          sysEvents: (event: string, listener: (...args: any[]) => void) => {
            dataListener.on(event, listener) // Add event listener
            return () => dataListener.removeListener(event, listener)
          }
        })
        addAppManifest(manifest, appName)
        sendPrefData()
      } else {
        console.error(`App entry point ${appEntryPoint} does not export a start function.`)
        dataListener.asyncEmit(
          MESSAGE_TYPES.ERROR,
          `App entry point ${appEntryPoint} does not export a start function.`
        )
      }
    } else {
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `App entry point ${appEntryPoint} not found.`)
      console.error(`App entry point ${appEntryPoint} not found.`)
    }
  } catch (error) {
    dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `Error running app ${error}`)
    console.error('Error running app:', error)
  }
}

/**
 * Sends a message to an app.
 *
 * @param {string} appName - The name of the app to send the message to.
 * @param {string} type - The type of message being sent.
 * @param {...any[]} args - Additional arguments for the message.
 */
async function sendMessageToApp(appName: string, type: string, ...args: any[]): Promise<void> {
  try {
    const app = runningApps.get(appName)
    if (app && typeof app.onMessageFromMain === 'function') {
      ;(app.onMessageFromMain as OnMessageFromMainType)(type, ...args)
    } else {
      dataListener.asyncEmit(
        MESSAGE_TYPES.ERROR,
        `SERVER: App ${appName} not found or does not have onMessageFromMain function.`
      )
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

/**
 * Stops a running app by its name. This will prompt the app to stop with the "stop" function
 *
 * @param {string} appName - The name of the app to stop.
 */

async function stopApp(appName: string): Promise<void> {
  try {
    const appConfig = await getAppByName(appName)
    if (!appConfig) {
      console.log(`App ${appName} not found in config, adding it`)
      // App not found in config, add it
      const newAppConfig = { name: appName, enabled: false, running: false, prefIndex: 5 } // 5 is the default index
      await setAppData(newAppConfig)
    } else if (appConfig.running) {
      // App found but not enabled, enable it
      appConfig.running = false
      // Save updated config file (if enabled changed)
      await setAppData(appConfig)
      console.log('Stopped ', appName)
    } else {
      console.log(`App ${appName} is already stopped!`)
    }

    const appInstance = runningApps.get(appName)
    if (appInstance && typeof appInstance.stop === 'function') {
      appInstance.stop()
    }
    runningApps.delete(appName)
    console.log('stopped ', appName)
    dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, `SERVER: Stopped ${appName}.`)
    sendPrefData()
  } catch (error) {
    console.error(`Error stopping app ${appName}`, error)
  }
}

/**
 * Disables an app by its name. This will simply disable the app inside the data.json file and also stop it from running.
 *
 * @param {string} appName - The name of the app to disable.
 */
async function disableApp(appName: string): Promise<void> {
  try {
    await stopApp(appName)
    // Load existing apps config
    const appConfig = await getAppByName(appName)

    if (!appConfig) {
      console.log('App not found in config, add it')
      // App not found in config, add it
      const newAppConfig = { name: appName, enabled: false, running: false, prefIndex: 5 } // 5 is the default index
      await setAppData(newAppConfig)
    } else if (appConfig.enabled) {
      // App found but not enabled, enable it
      appConfig.enabled = false
      // Save updated config file (if enabled changed)
      await setAppData(appConfig)
      console.log('Disabled ', appName)
    } else {
      console.log(`App ${appName} is already disabled`)
    }

    // Remove the app from memory cache
    const appDirectory = getAppFilePath(appName)
    clearCache(appDirectory)

    sendPrefData()
  } catch (error) {
    console.error('Error disabling app:', error)
    dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `SERVER: Error disabling app ${error}.`)
  }
}

async function clearCache(dir: string): Promise<void> {
  try {
    const items = fs.readdirSync(dir)
    items.forEach((item) => {
      const itemPath = join(dir, item)
      const stats = fs.statSync(itemPath)

      if (stats.isDirectory()) {
        // Recursively clear directories
        //clearCache(itemPath)
      } else if (stats.isFile()) {
        // Resolve and clear file from cache
        const resolvedPath = require.resolve(itemPath)
        if (require.cache[resolvedPath]) {
          delete require.cache[resolvedPath]
          console.log(`Removed ${resolvedPath} from cache`)
          dataListener.asyncEmit(
            MESSAGE_TYPES.LOGGING,
            `SERVER: Removed ${resolvedPath} from cache`
          )
        } else {
          console.log(`${resolvedPath} not in cache`)
          dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, `SERVER: ${resolvedPath} not in cache!`)
        }
      }
    })
  } catch (error) {
    console.error(`Error clearing cache for directory ${dir}:`, error)
    dataListener.asyncEmit(
      MESSAGE_TYPES.LOGGING,
      `SERVER: Error clearing cache for directory ${dir}: ${error}`
    )
  }
}

/**
 * Stops all running apps.
 */
async function stopAllApps(): Promise<void> {
  try {
    for (const appName of runningApps.keys()) {
      await stopApp(appName) // The stopApp function will remove it from the runningApps map
    }
  } catch (error) {
    console.error('Error stopping all apps:', error)
  }
}

async function getManifest(fileLocation: string): Promise<Manifest | undefined> {
  try {
    const manifestPath = join(fileLocation, 'manifest.json')
    if (!fs.existsSync(manifestPath)) {
      throw new Error('manifest.json not found after extraction')
    }

    const manifest = await fs.promises.readFile(manifestPath, 'utf8')
    const parsedManifest = JSON.parse(manifest)

    const returnData = {
      isAudioSource: parsedManifest.isAudioSource,
      requires: parsedManifest.requires,
      label: parsedManifest.label,
      version: parsedManifest.version,
      description: parsedManifest.description || undefined,
      author: parsedManifest.author || undefined,
      id: parsedManifest.id,
      isWebApp: parsedManifest.isWebApp,
      isLocalApp: parsedManifest.isLocalApp,
      platforms: parsedManifest.platforms,
      homepage: parsedManifest.homepage || undefined,
      repository: parsedManifest.repository || undefined
    }
    return returnData
  } catch (error) {
    console.error('Error getting manifest:', error)
    return undefined
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
 * - {boolean} success - Whether the extraction was successful.
 * - {string} message - A message about the extraction process.
 */
interface returnData {
  appId: string
  appName: string
  appVersion: string
  author: string
  platforms: string[]
  requirements: string[]
}
async function handleZip(zipFilePath: string, event?): Promise<returnData> {
  try {
    const extractDir = join(app.getPath('userData'), 'apps') // Extract to user data folder
    // Create the extraction directory if it doesn't exist
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true })
    }

    // Create the 'temp' file directory for temporary extraction
    const tempDir = join(extractDir, 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    event && event.reply('logging', { status: true, data: 'Extracting App', final: false })

    // Extract the .zip file to a temporary location to get the manifest.json
    await new Promise<void>((resolve, reject) => {
      const extractStream = fs
        .createReadStream(zipFilePath)
        .pipe(unzipper.Extract({ path: tempDir }))

      extractStream.on('error', () => {
        event && event.reply('logging', { status: false, data: 'Extraction failed!', final: true })
        reject()
      })
      extractStream.on('close', () => {
        console.log('Extraction finished')
        resolve()
      })
    })

    fs.readdirSync(tempDir).forEach((file) => {
      console.log(file)
    })

    event && event.reply('logging', { status: true, data: 'Getting Manifest', final: false })
    const manifestData = await getManifest(tempDir)
    let returnData

    if (!manifestData) {
      dataListener.asyncEmit(
        MESSAGE_TYPES.ERROR,
        `SERVER: Error getting manifest from ${zipFilePath}`
      )
      returnData = {
        appId: '',
        appName: '',
        appVersion: '',
        author: '',
        platforms: [],
        requirements: []
      }
    } else {
      returnData = {
        appId: manifestData.id,
        appName: manifestData.label,
        appVersion: manifestData.version,
        author: manifestData.author,
        platforms: manifestData.platforms,
        requirements: manifestData.requires
      }
    }

    event &&
      event.reply('logging', { status: true, data: 'Disabling and purging app', final: false })
    await disableApp(returnData.appId)

    await purgeAppData(returnData.appId)

    // Create the folder where the app will be stored in
    const appDirectory = join(extractDir, returnData.appId)
    if (fs.existsSync(appDirectory)) {
      fs.rmSync(appDirectory, { recursive: true })
    }
    fs.renameSync(tempDir, appDirectory)
    dataListener.asyncEmit(
      MESSAGE_TYPES.LOGGING,
      `SERVER: Successfully extracted ${zipFilePath} to ${appDirectory}`
    )
    console.log(`Successfully extracted ${zipFilePath} to ${appDirectory}`)
    return returnData
  } catch (error) {
    console.error('Error handling zip file:', error)
    throw new Error('Error handling zip file')
  }
}

async function handleZipFromUrl(zipUrlPath: string, event): Promise<void> {
  const tempZipPath = getAppFilePath('apps', 'temp')
  let returnData: returnData | undefined
  try {
    if (!fs.existsSync(getAppFilePath('apps', 'temp'))) {
      fs.mkdirSync(getAppFilePath('apps', 'temp'), { recursive: true })
    }
    const writeStream = fs.createWriteStream(join(tempZipPath, 'temp.zip'))
    writeStream.on('error', (error) => {
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `Error writing to temp file: ${error.message}`)
      throw new Error(`Error writing to temp file: ${error.message}`)
    })

    event.reply('logging', { status: true, data: 'Making Request...', final: false })
    const request = net.request(zipUrlPath)
    request.on('response', (response) => {
      if (response.statusCode !== 200) {
        dataListener.asyncEmit(
          MESSAGE_TYPES.ERROR,
          `Failed to download zip file: ${response.statusCode}`
        )
        event.reply('logging', {
          status: false,
          data: 'Encountered an error',
          final: true,
          error: `Failed to download zip file: ${response.statusCode}`
        })
        return
      }

      response.on('data', (chunk) => {
        writeStream.write(chunk)
      })

      response.on('end', async () => {
        writeStream.end()
        try {
          event.reply('logging', { status: true, data: 'Extracting zip file...', final: false })
          // Run file like a normal zip file
          returnData = await handleZip(join(tempZipPath, 'temp.zip'), event)
          console.log(`Successfully processed and deleted ${tempZipPath}`)
          event.reply('zip-name', { status: true, data: returnData, final: true })
        } catch (error) {
          dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `Error processing zip file: ${error}`)
        } finally {
          // Clean up the temporary zip file
          try {
            fs.unlinkSync(tempZipPath)
            console.log(`Successfully deleted ${tempZipPath}`)
          } catch (cleanupError) {
            console.error(`Error deleting temp file: ${cleanupError}`)
          }
        }
      })
    })

    request.on('error', (error) =>
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `Error sending request: ${error}`)
    )
    request.end()
  } catch (error) {
    dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `Error handling zip file: ${error}`)
    throw new Error('Error handling zip file')
  }
}

/**
 * Loads and runs all enabled apps from appData.json
 * This will also get the manifest data of each app and update that in case of there being any changes
 *
 * @returns {Promise<void>}
 */
async function loadAndRunEnabledApps(): Promise<void> {
  try {
    const appsConfig = getAppData()
    console.log('Loaded apps config. Running apps...')
    dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, 'SERVER: Loaded apps config. Running apps...')
    console.log(appsConfig)
    for (const appConfig of appsConfig.apps) {
      if (appConfig.enabled == true) {
        console.log(`Automatically running app ${appConfig.name}`)
        dataListener.asyncEmit(
          MESSAGE_TYPES.LOGGING,
          `SERVER: Automatically running app ${appConfig.name}`
        )
        await runApp(appConfig.name)
        await sendMessageToApp(appConfig.name, 'get', 'manifest')
      }
    }
  } catch (error) {
    dataListener.asyncEmit(
      MESSAGE_TYPES.ERROR,
      `SERVER: Error loading and running enabled apps: ${error}`
    )
    console.error('Error loading and running enabled apps:', error)
  }
}

/**
 * Adds an app to the program. This will check the config for if the app exists already or not, and update accordingly
 * This will also enable the app and then run the app
 *
 * @param event
 * @param appName
 */
async function addApp(event, appName: string, appPath?: string): Promise<void> {
  try {
    // Load existing apps config
    event.reply('logging', { status: true, data: 'Loading apps config', final: false })
    if (appPath != undefined) {
      console.log('Developer app detected: Purging old app...')
      await purgeAppData(appName)
      devAppPath = appPath
    }
    const appConfig = getAppByName(appName)

    if (!appConfig) {
      // App not found in config, add it
      const newAppConfig = { name: appName, running: true, enabled: true, prefIndex: 5 } // You might need to adjust this based on your app structure
      setAppData(newAppConfig)
    } else if (!appConfig.enabled || !appConfig.running) {
      // App found but not enabled, enable it
      appConfig.enabled = true
      appConfig.running = true
      // Save updated config file (if enabled changed)
      setAppData(appConfig)
      console.log(`Attempting to run app ${appName}`)
    } else {
      console.log(`App '${appName}' already exists and is enabled.`)
    }
    event.reply('logging', { status: true, data: 'Running App', final: false })
    console.log('Running app...')
    if (runningApps.has(appName)) {
      await stopApp(appName)
    }
    await runApp(appName)
  } catch (error) {
    console.error('Error adding app:', error)
  }
}

/**
 * Purges an app by its name, stopping it and removing its configuration and data.
 *
 * @param {string} appName - The name of the app to purge.
 */
async function purgeAppData(appName: string): Promise<void> {
  try {
    dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, `SERVER: Purging App ${appName}`)
    // Ensure that the app is not running
    if (runningApps.has(appName)) {
      await disableApp(appName) // Ensure the app has stopped
    }

    // Purge App Data
    await purgeData(appName)

    // Purge App Config
    await purgeAppConfig(appName)

    // Get path to file
    const appDirectory = getAppFilePath(appName)
    clearCache(appDirectory)

    if (appName == 'developer-app') return // Cancel here if it is a developer app
    // Remove the file from filesystem
    if (fs.existsSync(appDirectory)) {
      const fsExtra = require('fs-extra')
      await fsExtra.remove(appDirectory)
      console.log(`Purged all data for app ${appName}`)
    }

    console.log(`Purged all data for app ${appName}`)
  } catch (error) {
    console.error(`Error purging app data for ${appName}`, error)
  }
}

export {
  runApp,
  sendMessageToApp,
  stopApp,
  stopAllApps,
  handleZipFromUrl,
  handleZip,
  loadAndRunEnabledApps,
  addApp,
  disableApp,
  purgeAppData
}
