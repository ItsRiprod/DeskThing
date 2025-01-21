console.log('[AppInst Service] Starting')
import { join, resolve } from 'path'
import { app } from 'electron'
import { loggingStore } from '@server/stores/'
import {
  ToAppData,
  ToClientType,
  Response,
  AppManifest,
  DeskThing,
  AppReturnData,
  MESSAGE_TYPES,
  ReplyFn,
  TagTypes
} from '@shared/types'
import { getAppFilePath, getManifest } from './appUtils'
import { mkdirSync, existsSync, rmSync, promises } from 'node:fs'
import { handleDataFromApp } from './appCommunication'

/**
 * Inputs a .zip file path of an app and extracts it to the /apps/appId/ folder.
 * Returns metadata about the extracted app.
 *
 * @param {string} zipFilePath - The file path of the .zip file to extract.
 * @depreciated
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
      const { default: appHandler } = await import('@server/stores/appStore')

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

interface ExecuteStagedFileType {
  reply?: ReplyFn
  overwrite?: boolean
  appId?: string
  run?: boolean
}

export const executeStagedFile = async ({
  reply,
  overwrite,
  appId,
  run = false
}: ExecuteStagedFileType): Promise<void> => {
  const tempPath = getAppFilePath('staged')
  const tempZipPath = getAppFilePath('staged', 'temp.zip')

  // get the app id
  if (!appId) {
    const manifestData = await getManifest(tempPath)
    if (!manifestData) {
      loggingStore.log(MESSAGE_TYPES.ERROR, `SERVER: Error getting manifest from ${tempPath}`)
      reply && reply('logging', { status: false, data: 'Error getting manifest', final: true })
      return
    }
    appId = manifestData.id
  }

  const appPath = getAppFilePath(appId)

  // Delete the app directory if it exists
  if (existsSync(appPath)) {
    reply &&
      reply('logging', {
        status: true,
        data: '[executeStagedFile] Deleting existing app directory...',
        final: false
      })
    await promises.rm(appPath, { recursive: true })
    reply &&
      reply('logging', { status: true, data: 'Deleted existing app directory', final: false })
  }

  // Purge the app if it exists
  const { appStore } = await import('@server/stores')
  if (overwrite) {
    await appStore.purge(appId)
  } else {
    // Check if the app exists and disable it if it does
    const app = appStore.get(appId)
    if (app?.enabled || app?.running) {
      await appStore.disable(appId)
    }
  }

  // Delete temp.zip if it exists
  if (existsSync(tempZipPath)) {
    await promises.unlink(tempZipPath)
  }

  // Rename staged directory to appId
  await promises.rename(tempPath, appPath)

  if (run) {
    const { default: appHandler } = await import('@server/stores/appStore')
    await appHandler.run(appId)
  }
}

/**
 * Stages all of the app's files to the staging directory.
 * @param path
 * @param reply
 * @returns
 */
export const stageAppFile = async (path: string, reply: ReplyFn): Promise<AppManifest | void> => {
  const tempPath = getAppFilePath('staged')
  const tempZipPath = getAppFilePath('staged', 'temp.zip')
  if (existsSync(tempPath)) {
    loggingStore.log(MESSAGE_TYPES.LOGGING, `[handleZipFromUrl] Deleting old directory...`)
    try {
      await promises.unlink(tempPath)
      if (existsSync(getAppFilePath('staged', 'extracted'))) {
        await promises.rm(getAppFilePath('staged'), { recursive: true })
      }
    } catch (error) {
      if (error instanceof Error) {
        loggingStore.log(MESSAGE_TYPES.ERROR, `[handleZipFromUrl] ${error.message}`)
        reply('logging', { status: true, data: 'Failed to clear old app files', final: false })
      } else {
        loggingStore.log(MESSAGE_TYPES.ERROR, `[handleZipFromUrl] ${error}`)
        reply('logging', { status: true, data: 'Failed to clear old app files', final: false })
      }
    }
  }
  loggingStore.log(MESSAGE_TYPES.LOGGING, `[handleZipFromUrl] Creating downloads directory...`)
  mkdirSync(getAppFilePath('staged'), { recursive: true })

  // Check if the path is a URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    reply('logging', { status: true, data: 'Fetching...', final: false })

    const response = await fetch(path)

    // Check if error
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
      loggingStore.log(MESSAGE_TYPES.LOGGING, `[handleZipFromUrl] Downloading ${path}...`)
      reply('logging', { status: true, data: 'Downloading... 0%', final: false })
    }

    const chunks: Uint8Array[] = []
    const contentLength = Number(response.headers.get('content-length'))
    let receivedLength = 0
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Failed to get reader from response body')
    }

    // Read chunks and track progress
    let done = false
    while (!done) {
      const result = await reader.read()
      done = result.done
      if (!done && result.value) {
        chunks.push(result.value)
        receivedLength += result.value?.length || 0
        const progress = Math.round((receivedLength / contentLength) * 100)
        reply('logging', { status: true, data: `Downloading... ${progress}%`, final: false })
      }
    }

    // Combine chunks and save file
    const buffer = Buffer.concat(chunks)
    await promises.writeFile(tempZipPath, buffer)
  } else {
    // Handle case where it's a local file upload
    try {
      if (!existsSync(path)) {
        throw new Error(`Local file not found: ${path}`)
      }
      await promises.copyFile(path, tempZipPath)
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = `Failed to copy local file: ${error.message}`
        console.error(`[handleZipFromFile] Error copying local file: ${error.message}`)
        loggingStore.log(MESSAGE_TYPES.ERROR, errorMessage)
        reply('logging', {
          status: false,
          data: 'Encountered an error',
          final: true,
          error: errorMessage
        })
      } else {
        console.error(`[handleZipFromFile] Unknown error copying local file: ${error}`)
        reply('logging', {
          status: false,
          data: 'Encountered an error',
          final: true,
          error: 'Unknown error copying file'
        })
      }
      return
    }
  }

  reply('logging', { status: true, data: 'Getting Manifest...', final: false })

  // Extract the zip file to a known location for staging
  const { getManifest } = await import('./appUtils')

  const AdmZip = await import('adm-zip')
  await new Promise<void>((resolve, reject) => {
    try {
      loggingStore.log(MESSAGE_TYPES.LOGGING, `[handleZip] Extracting app...`)
      const zip = new AdmZip.default(tempZipPath)

      reply('logging', { status: true, data: 'Extracting files...', final: false })
      zip.extractAllTo(tempPath, true)

      reply('logging', { status: true, data: `App extracted to ${tempPath}`, final: false })
      resolve()
    } catch (error) {
      loggingStore.log(MESSAGE_TYPES.ERROR, `SERVER: Error extracting ${tempPath}`)
      reply && reply('logging', { status: false, data: 'Extraction failed!', final: true })
      reject(error)
    }
  })

  // Get the manifest file to setup the details of the app
  const manifestData = await getManifest(tempPath)

  let returnData: AppManifest

  // Getting the return data
  loggingStore.log(MESSAGE_TYPES.LOGGING, `[handleZip] Fetching manifest...`)
  if (!manifestData) {
    loggingStore.log(MESSAGE_TYPES.ERROR, `SERVER: Error getting manifest from ${tempPath}`)
    returnData = {
      id: '',
      tags: [],
      requiredVersions: {
        client: '>=0.0.0',
        server: '>=0.0.0'
      },
      requires: [],
      label: 'Unknown',
      version: '0.0.0',
      description: '',
      author: '',
      platforms: [],
      homepage: '',
      repository: '',
      compatible_server: [0],
      compatible_client: [0],
      isWebApp: false,
      isScreenSaver: false,
      isLocalApp: false,
      isAudioSource: false
    }
  } else {
    returnData = {
      id: manifestData.id,
      requires: manifestData.requires,
      label: manifestData.label,
      version: manifestData.version,
      description: manifestData.description,
      author: manifestData.author,
      platforms: manifestData.platforms,
      tags: manifestData.tags || [
        manifestData.isAudioSource && TagTypes.AUDIO_SOURCE,
        manifestData.isScreenSaver && TagTypes.SCREEN_SAVER
      ],
      requiredVersions: {
        client: manifestData.requiredVersions.client || '>=0.0.0',
        server: manifestData.requiredVersions.server || '>=0.0.0'
      },
      homepage: manifestData.homepage,
      repository: manifestData.repository,
      updateUrl: manifestData.updateUrl || manifestData.repository,
      // Depreciated but here for backwards compatibility
      version_code: manifestData.version_code,
      compatible_server: manifestData.compatible_server,
      compatible_client: manifestData.compatible_client,
      isWebApp: manifestData.isWebApp,
      isAudioSource: manifestData.isAudioSource,
      isScreenSaver: manifestData.isScreenSaver,
      isLocalApp: manifestData.isLocalApp
    }
  }

  return returnData
}

/**
 * Downloads a .zip file from a URL and extracts it to the /apps/appId/ folder.
 * @depreciated
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
    const AppState = await import('../../stores/appStore')
    const appState = AppState.default

    const app = appState.get(appName)

    if (app && typeof app.func.start === 'function') {
      app.func.start()
    } else {
      loggingStore.log(MESSAGE_TYPES.LOGGING, `App ${appName} not started. Running.`)
    }

    const DeskThing = await getDeskThing(appName)

    if (!DeskThing) {
      loggingStore.error(`[AppRunner] App ${appName} does not export the DeskThing object!`)
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
  const AppState = await import('../../stores/appStore')
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
  const AppState = await import('@server/stores/appStore')
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

    appInstance.func.toClient = async (data: ToAppData): Promise<void> => {
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
): Promise<AppManifest | void> => {
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
const getDeskThing = async (appName: string): Promise<DeskThing | void> => {
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
    // TODO: Should verify the deskthing structure to ensure it is from the connector
    const { DeskThing } = await import(`file://${resolve(appEntryPoint)}?cacheBust=${Date.now()}`)
    return DeskThing as DeskThing
  }
  return
}
