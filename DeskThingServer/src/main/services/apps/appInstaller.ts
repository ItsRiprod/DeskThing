console.log('[AppInst Service] Starting')
import { join, resolve } from 'path'
import { app } from 'electron'
import loggingStore from '../../stores/loggingStore'
import {
  IncomingData,
  ToClientType,
  Response,
  Manifest,
  DeskThing,
  AppReturnData,
  MESSAGE_TYPES
} from '@shared/types'
import { getAppFilePath, getManifest } from './appUtils'
import { mkdirSync, existsSync, rmSync, promises } from 'node:fs'
import { handleDataFromApp } from './appCommunication'

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
export async function handleZip(zipFilePath: string, reply?): Promise<AppReturnData> {
  const { getManifest } = await import('./appUtils')
  try {
    loggingStore.log(MESSAGE_TYPES.LOGGING, `[handleZip] Extracting ${zipFilePath}...`)
    const appPath = join(app.getPath('userData'), 'apps') // Extract to user data folder
    // Create the extraction directory if it doesn't exist
    if (!existsSync(appPath)) {
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `[handleZip] Creating extraction directory at ${appPath}...`
      )
      mkdirSync(appPath, { recursive: true })
    }

    // Create the 'temp' file directory for temporary extraction
    const tempDir = join(appPath, 'temp')

    // Delete the temp directory if it exists
    if (existsSync(tempDir)) {
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `[handleZip] Removing temporary directory at ${tempDir}...`
      )
      rmSync(tempDir, { recursive: true, force: true })
    }
    mkdirSync(tempDir, { recursive: true })

    reply && reply('logging', { status: true, data: 'Extracting App', final: false })

    // Extract the .zip file to a temporary location to get the manifest.json
    const AdmZip = await import('adm-zip')
    await new Promise<void>((resolve, reject) => {
      try {
        loggingStore.log(MESSAGE_TYPES.LOGGING, `[handleZip] Extracting app...`)
        const zip = new AdmZip.default(zipFilePath)

        zip.getEntries().forEach((entry) => {
          if (entry.isDirectory) {
            loggingStore.log(
              MESSAGE_TYPES.LOGGING,
              `[handleZip] Skipping directory ${entry.entryName}`
            )
          } else {
            loggingStore.log(
              MESSAGE_TYPES.LOGGING,
              `[handleZip] Extracting file ${entry.entryName}`
            )
            zip.extractEntryTo(entry, tempDir, true, true)
          }
        })

        zip.extractAllTo(tempDir, true)
        loggingStore.log(MESSAGE_TYPES.LOGGING, `[handleZip] App extracted to ${tempDir}`)
        resolve()
      } catch (error) {
        loggingStore.log(MESSAGE_TYPES.ERROR, `SERVER: Error extracting ${zipFilePath}`)
        reply && reply('logging', { status: false, data: 'Extraction failed!', final: true })
        reject(error)
      }
    })

    reply && reply('logging', { status: true, data: 'Getting Manifest', final: false })

    const manifestData = await getManifest(tempDir)
    let returnData

    loggingStore.log(MESSAGE_TYPES.LOGGING, `[handleZip] Fetching manifest...`)
    if (!manifestData) {
      loggingStore.log(MESSAGE_TYPES.ERROR, `SERVER: Error getting manifest from ${zipFilePath}`)
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

    reply && reply('logging', { status: true, data: 'Disabling and purging app', final: false })

    // Create the folder where the app will be stored in
    const appDirectory = join(appPath, returnData.appId)
    if (existsSync(appDirectory)) {
      loggingStore.log(MESSAGE_TYPES.LOGGING, `[handleZip] Old app detected, purging...`)
      const { AppHandler } = await import('./appState')
      const appHandler = AppHandler.getInstance()

      await appHandler.disable(returnData.appId)

      await appHandler.purge(returnData.appId)
      rmSync(appDirectory, { recursive: true })
    }

    loggingStore.log(MESSAGE_TYPES.LOGGING, `[handleZip] Moving files to ${appDirectory}...`)
    // Move the extracted files from tempDir to appDirectory
    await promises.rename(tempDir, appDirectory)

    reply && reply('logging', { status: true, data: 'App files moved successfully', final: false })

    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `SERVER: Successfully extracted ${zipFilePath} to ${appDirectory}`
    )
    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `Successfully extracted ${zipFilePath} to ${appDirectory}`
    )
    return returnData
  } catch (error) {
    console.error('[handleZIP] Error handling zip file:', error)
    throw new Error('[handleZIP] Error handling zip file')
  }
}

/**
 * Downloads a .zip file from a URL and extracts it to the /apps/appId/ folder.
 * @param zipUrlPath
 * @param event
 * @returns
 */
export async function handleZipFromUrl(zipUrlPath: string, reply): Promise<AppReturnData | void> {
  const tempZipPath = getAppFilePath('downloads', 'temp.zip')
  let returnData: AppReturnData | undefined
  try {
    loggingStore.log(MESSAGE_TYPES.LOGGING, `[handleZipFromUrl] Downloading ${zipUrlPath}...`)
    if (!existsSync(getAppFilePath('downloads'))) {
      loggingStore.log(MESSAGE_TYPES.LOGGING, `[handleZipFromUrl] Creating downloads directory...`)
      mkdirSync(getAppFilePath('downloads'), { recursive: true })
    }

    reply('logging', { status: true, data: 'Fetching...', final: false })

    const response = await fetch(zipUrlPath)

    if (!response.ok) {
      console.error(`[handleZipFromFile] Failed to download zip file: ${response.status}`)
      const errorMessage = `Failed to download zip file: ${response.status}`
      loggingStore.log(MESSAGE_TYPES.ERROR, errorMessage)
      reply('logging', {
        status: false,
        data: 'Encountered an error',
        final: true,
        error: errorMessage
      })
      return
    } else {
      loggingStore.log(MESSAGE_TYPES.LOGGING, `[handleZipFromUrl] Downloading ${zipUrlPath}`)
      reply('logging', { status: true, data: 'Downloading... 0%', final: false })
    }

    const response2 = response.clone()
    const contentLength = Number(response.headers.get('content-length'))
    let receivedLength = 0
    const reader = response2.body?.getReader()
    if (!reader) {
      throw new Error('Failed to get reader from response body')
    }
    const chunks: Uint8Array[] = []
    let lastProgress = 0

    let done = false
    while (!done) {
      const result = await reader.read()
      done = result.done
      if (!done) {
        chunks.push(result.value as Uint8Array)
        receivedLength += result.value?.length || 0
        const progress = Math.round((receivedLength / contentLength) * 100)
        if (progress > lastProgress) {
          reply('logging', { status: true, data: `Downloading... ${progress}%`, final: false })
          lastProgress = progress
        }
      }
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    loggingStore.log(MESSAGE_TYPES.LOGGING, `[handleZipFromUrl] Writing to ${tempZipPath}...`)
    await promises.writeFile(tempZipPath, buffer)

    reply('logging', { status: true, data: 'Extracting...', final: false })

    returnData = await handleZip(tempZipPath, reply)
    loggingStore.log(MESSAGE_TYPES.LOGGING, `Successfully processed and deleted ${tempZipPath}`)
    reply('zip-name', { status: true, data: returnData, final: true })
    return returnData
  } catch (error) {
    loggingStore.log(MESSAGE_TYPES.ERROR, `[handleZIPfromURL] Error handling zip file: ${error}`)
    throw new Error('[handleZIPfromURL] Error handling zip file' + error)
  } finally {
    // Clean up the temporary zip file and extracted directory
    try {
      if (existsSync(tempZipPath)) {
        await promises.unlink(tempZipPath)
      }
      if (existsSync(getAppFilePath('downloads', 'extracted'))) {
        await promises.rm(getAppFilePath('downloads', 'extracted'), { recursive: true })
      }
      loggingStore.log(MESSAGE_TYPES.LOGGING, `Successfully deleted temporary files`)
    } catch (cleanupError) {
      console.error(`Error deleting temp files: ${cleanupError}`)
    }
  }
}
/**
 * Runs an app by its name.
 *
 * This portion of code will run the /appName/index.js of the provided app, save the app to the list of running apps, and setup any listeners/callback functions the apps will use.
 *
 * If the app already exists, it just initializes the app and runs it
 * @param {string} appName - The name of the app to run.
 */
export async function run(appName: string): Promise<void> {
  try {
    const AppState = await import('./appState')
    const appState = AppState.default

    const app = appState.get(appName)

    if (app && typeof app.func.start === 'function') {
      app.func.start()
    } else {
      loggingStore.log(MESSAGE_TYPES.LOGGING, `App ${appName} not found.`)
    }

    const DeskThing = await getDeskThing(appName)

    if (!DeskThing) {
      console.error(`App ${appName} not found.`)
      return
    }

    const manifestResponse: Response = await DeskThing.getManifest()

    const manifest = await handleManifest(appName, manifestResponse)

    if (!manifest) {
      console.error(`App ${appName} not found.`)
      return
    } else {
      appState.appendManifest(manifest, appName)
    }

    loggingStore.log(MESSAGE_TYPES.LOGGING, `Configuring ${appName}!`)

    await setupFunctions(appName, DeskThing)

    loggingStore.log(MESSAGE_TYPES.LOGGING, `Running ${appName}!`)
    const result = await start(appName)
    if (!result) {
      loggingStore.log(MESSAGE_TYPES.ERROR, `App ${appName} failed to start!`)
    }
  } catch (error) {
    loggingStore.log(MESSAGE_TYPES.ERROR, `Error running app ${error}`)
    console.error('Error running app:', error)
  }
}

/**
 * Starts the app assuming it exists in appState
 * @param appName
 * @returns
 */
export const start = async (appName: string): Promise<boolean> => {
  const AppState = await import('./appState')
  const appState = AppState.default
  const appInstance = appState.get(appName)

  if (!appInstance || !appInstance.func.start || appInstance.func.start === undefined) {
    loggingStore.log(MESSAGE_TYPES.ERROR, `App ${appName} not found. or not started correctly`)
    return false
  }
  // Check if all required apps are running
  const manifest = appInstance.manifest

  if (!manifest) {
    loggingStore.log(MESSAGE_TYPES.ERROR, `App ${appName} not found.`)
    return false
  }

  if (manifest.requires) {
    const requiredApps = manifest.requires || []
    for (const requiredApp of requiredApps) {
      if (!appState.getOrder().includes(requiredApp) && requiredApp.length > 2) {
        loggingStore.log(
          MESSAGE_TYPES.ERROR,
          `Unable to run ${appName}! This app requires '${requiredApp}' to be enabled and running.`
        )
        appState.stop(appName)
        return false
      }
    }
  }

  try {
    const startResponse: Response = await appInstance.func.start()
    if (startResponse.status == 200) {
      loggingStore.log(
        MESSAGE_TYPES.MESSAGE,
        `App ${appName} started successfully with response ${startResponse.data.message}`
      )
      return true
    } else {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `App ${appName} failed to start with response ${startResponse.data.message}`
      )
      return false
    }
  } catch (error) {
    loggingStore.log(MESSAGE_TYPES.ERROR, `Error starting app ${error}`)
    console.error('Error starting app:', error)
  }
  return false
}

/**
 * Sets up the functions in the appState from the DeskThing object
 * @param appName
 * @param DeskThing
 * @returns
 */
const setupFunctions = async (appName: string, DeskThing: DeskThing): Promise<void> => {
  const AppState = await import('./appState')
  const appState = AppState.default
  const appInstance = appState.get(appName)
  // Currently does nothing
  const listeners: ToClientType[] = []

  if (!appInstance) {
    loggingStore.log(MESSAGE_TYPES.ERROR, `App ${appName} not found.`)
    return
  }

  try {
    appInstance.func.purge = async (): Promise<Response> => DeskThing.purge()

    appInstance.func.start = async (): Promise<Response> => {
      return DeskThing.start({
        toServer: (data) => handleDataFromApp(appName, data),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        SysEvents: (_event: string, _listener: (...args: string[]) => void) => {
          return () => {
            /* do something with this to let apps listen for server events like apps being added or settings being changed */
          }
        }
      })
    }

    appInstance.func.stop = async (): Promise<Response> => DeskThing.stop()

    appInstance.func.toClient = async (data: IncomingData): Promise<void> => {
      listeners.forEach((listener) => listener(data))
      DeskThing.toClient(data)
    }

    appState.add(appInstance)
  } catch (error) {
    loggingStore.log(MESSAGE_TYPES.ERROR, `Error running app ${error}`)
  }
}

/**
 * Attempts to get the manifest from the DeskThing object and resorts to manually searching
 * @param appName The name of the app
 * @param manifestResponse The response from the DeskThing object
 * @returns
 */
const handleManifest = async (
  appName: string,
  manifestResponse: Response
): Promise<Manifest | void> => {
  if (manifestResponse.status == 200) {
    // Manifest returned correctly
    return manifestResponse.data
  } else if (manifestResponse.status == 500) {
    // Manifest not found, searching manually
    const manifestPath = getAppFilePath(appName, 'manifest.json')
    if (!existsSync(manifestPath)) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `Manifest for app ${appName} not found at ${manifestPath}`
      )
      return
    }

    const manifest = await getManifest(getAppFilePath(appName))
    if (manifest == undefined) {
      console.error(`Manifest for app ${appName} is invalid!`)
      return
    }

    return manifest
  } else {
    // Critical error
    console.error(
      `Unable to get manifest for ${appName}! Response message: ${manifestResponse.data.message}`
    )
    loggingStore.log(
      MESSAGE_TYPES.ERROR,
      `Unable to get manifest for ${appName}!  Response message: ${manifestResponse.data.message}`
    )
    return
  }
}

/**
 * Gets the DeskThing object from the appEntryPoint
 * @param appName
 * @returns
 */
const getDeskThing = async (appName): Promise<DeskThing | void> => {
  const appEntryPointJs = getAppFilePath(appName, 'index.js')
  const appEntryPointMjs = getAppFilePath(appName, 'index.mjs')
  const appEntryPointCjs = getAppFilePath(appName, 'index.cjs')
  let appEntryPoint: string | undefined
  if (existsSync(appEntryPointJs)) {
    appEntryPoint = appEntryPointJs
  } else if (existsSync(appEntryPointMjs)) {
    appEntryPoint = appEntryPointMjs
  } else if (existsSync(appEntryPointCjs)) {
    appEntryPoint = appEntryPointCjs
  } else {
    loggingStore.log(
      MESSAGE_TYPES.ERROR,
      `Entry point for app ${appName} not found. (Does it have an index.js file?)`
    )
    return
  }
  if (existsSync(appEntryPoint)) {
    const { DeskThing } = await import(`file://${resolve(appEntryPoint)}?cacheBust=${Date.now()}`)
    return DeskThing
  }
  return
}
