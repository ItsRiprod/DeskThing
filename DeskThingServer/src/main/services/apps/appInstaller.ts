console.log('[AppInst Service] Starting')
// Types
import { LOGGING_LEVELS, AppReleaseSingleMeta, App } from '@DeskThing/types'
import { ReplyFn, StagedAppManifest } from '@shared/types'

// Utils
import Logger from '@server/utils/logger'
import { existsSync, promises } from 'node:fs'
import path from 'node:path'
import { getAppFilePath, getManifest, getStandardizedFilename } from './appUtils'

// Validation
import { validateSha512 } from './appValidator'
import { overwriteData } from '../files/dataFileService'

// Stores
import { storeProvider } from '@server/stores/storeProvider'

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
  const appStore = await storeProvider.getStore('appStore')
  try {
    const tempZipPath = getAppFilePath('staged', 'temp.zip')
    const extractedPath = getAppFilePath('staged', 'extracted')
    const appManifestData = await getManifest(extractedPath)
    // get the app id
    if (!appManifestData) {
      Logger.error(`SERVER: Error getting manifest from ${extractedPath}`, {
        function: 'executeStagedFile',
        source: 'executeStagedFile',
        error: new Error('Error getting manifest from tempPath')
      })
      reply && reply('logging', { status: false, data: 'Error getting manifest', final: true })
      return
    }

    if (!appId) {
      appId = appManifestData.id
    }
    if (overwrite) {
      Logger.debug(`[executeStagedFile] Overwriting existing app (overwrite is enabled)...`)
      await appStore.purge(appId)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await overwriteData(appId, { version: appManifestData.version })
    }

    const appPath = getAppFilePath(appId)

    // Delete the app directory if it exists
    if (existsSync(appPath)) {
      reply &&
        reply('logging', {
          status: true,
          data: 'Deleting existing app directory...',
          final: false
        })
      await promises.rm(appPath, { recursive: true })
      reply &&
        reply('logging', { status: true, data: 'Deleted existing app directory', final: false })
      Logger.debug(`[executeStagedFile] Deleting existing app directory... ${appPath}`, {
        function: 'executeStagedFile',
        source: 'executeStagedFile'
      })
    }

    // Get the app store

    const app = appStore.get(appId)

    if (app && !overwrite) {
      // If the app already exists in the app store
      Logger.debug(`[executeStagedFile] Disabling existing app (Overwrite is disabled)...`)
      // Check if the app exists and disable it if it does
      if (app?.enabled || app?.running) {
        await appStore.disable(appId)
      }
    } else {
      const manifest = await getManifest(extractedPath)
      // If the app is new
      Logger.debug(`[executeStagedFile] Adding app to store...`)
      const newApp: App = {
        name: appId,
        enabled: false,
        running: false,
        timeStarted: 0,
        prefIndex: 10,
        meta: {
          version: '0.0.0',
          verified: false,
          verifiedManifest: false,
          updateAvailable: false,
          updateChecked: false
        },
        manifest: manifest
      }
      appStore.add(newApp)
    }

    Logger.debug(`[executeStagedFile] Deleting temp zip path...`)
    // Delete temp.zip if it exists
    try {
      await promises.stat(tempZipPath)
      await promises.unlink(tempZipPath)
    } catch {
      // File doesn't exist, no need to delete
      Logger.warn(`[executeStagedFile] No temp zip file to delete`)
    }

    Logger.debug(`[executeStagedFile] Renaming the staged directory to app id...`)
    // Rename staged directory to appId
    try {
      await promises.rename(extractedPath, appPath)
    } catch (error) {
      if (error instanceof Error) {
        Logger.error(`[executeStagedFile] Failed to rename directory: ${error.message}`, {
          function: 'executeStagedFile',
          source: 'executeStagedFile',
          error
        })
        throw new Error(`Failed to rename staged directory to app directory: ${error.message}`)
      }
      throw error
    }

    if (run) {
      Logger.debug(`[executeStagedFile] Running app automatically...`)
      await appStore.run(appId)
    }
  } catch (error) {
    Logger.error(`Error executing staged file: ${error}`, {
      function: 'executeStagedFile',
      source: 'appInstaller',
      error: error as Error
    })

    throw error
  }
}

/**
 * @depreciated - This is not needed as the run staged will use the already-extracted data
 */
export const findTempZipPath = async (
  tempPath: string,
  { releaseMeta, appId }: { releaseMeta?: AppReleaseSingleMeta; appId?: string }
): Promise<string> => {
  if (releaseMeta) {
    Logger.debug(`Using releaseMeta to find temp zip path...`, {
      function: 'findTempZipPath',
      source: 'appInstaller'
    })
    const standardizedFileName = getStandardizedFilename(releaseMeta.id, releaseMeta.version)
    const standardizedPath = path.join(tempPath, standardizedFileName)
    if (
      await promises
        .access(standardizedPath)
        .then(() => true)
        .catch(() => false)
    )
      return standardizedPath
  }

  if (appId) {
    Logger.debug(`Using appId to find temp zip path...`, {
      function: 'findTempZipPath',
      source: 'appInstaller'
    })
    const files = await promises.readdir(tempPath)
    const appZip = files.find((file) => file.includes(appId) && file.endsWith('.zip'))
    if (appZip) return path.join(tempPath, appZip)
  }

  Logger.debug(`Using default temp zip path...`, {
    function: 'findTempZipPath',
    source: 'appInstaller'
  })
  const tempZipPath = path.join(tempPath, 'temp.zip')
  if (
    await promises
      .access(tempZipPath)
      .then(() => true)
      .catch(() => false)
  )
    return tempZipPath

  throw new Error('No matching zip file found in temp directory')
}

const getTempZipPath = (tempPath, releaseMeta?: AppReleaseSingleMeta): string => {
  if (releaseMeta) {
    const standardizedFileName = getStandardizedFilename(releaseMeta.id, releaseMeta.version)
    return path.join(tempPath, standardizedFileName)
  }
  return path.join(tempPath, 'temp.zip')
}

export interface stageAppFileType {
  filePath?: string
  releaseMeta?: AppReleaseSingleMeta
  reply: ReplyFn
}

/**
 * Stages all of the app's files to the staging directory.
 * @param path
 * @param reply
 * @returns
 */
export const stageAppFile = async ({
  filePath,
  releaseMeta,
  reply
}: stageAppFileType): Promise<StagedAppManifest | void> => {
  if (!filePath && !releaseMeta) {
    reply('logging', { status: false, data: 'No file path or release meta provided', final: true })
    return
  } else if (!filePath && releaseMeta) {
    filePath = releaseMeta.updateUrl
  } else {
    // filePath exists. This asserts that
    filePath = filePath as string
  }
  const tempPath = getAppFilePath('staged')
  const tempZipPath = getTempZipPath(tempPath, releaseMeta)
  const extractedPath = getAppFilePath('staged', 'extracted')

  // Check if the path exists
  if (existsSync(tempPath)) {
    Logger.debug(`[handleZipFromUrl] Deleting old temp path directory...`)
    try {
      // Check if directories exist using stat
      await promises.stat(tempPath)
      // Remove the directory
      await promises.rm(tempPath, { recursive: true })

      try {
        await promises.stat(extractedPath)
        await promises.rm(extractedPath, { recursive: true })
      } catch {
        Logger.debug(`[handleZipFromUrl] extracted path doesnt exist`)
        reply('logging', { status: true, data: 'Failed to clear extracted path', final: false })
      }
    } catch (error) {
      if (error instanceof Error) {
        Logger.error(`[handleZipFromUrl] ${error.name}: ${error.message}`, {
          function: 'stageAppFile',
          source: 'stageAppFile',
          error
        })
        reply('logging', { status: true, data: 'Failed to clear old app files', final: false })
      } else {
        Logger.error(`[handleZipFromUrl] ${error}`, {
          function: 'stageAppFile',
          source: 'stageAppFile',
          error: new Error(String(error))
        })
        reply('logging', { status: true, data: 'Failed to clear old app files', final: false })
      }
    }
  }
  Logger.debug(`[handleZipFromUrl] Creating downloads directory...`)
  await promises.mkdir(tempPath, { recursive: true })

  // Check if the path is a URL
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    Logger.debug(`[handleZipFromUrl] URL Detected!`)

    reply('logging', { status: true, data: 'Fetching...', final: false })

    const response = await fetch(filePath)

    let prevPercentage = 0

    const trackDownloadProgress = async (received: number, total: number): Promise<void> => {
      const progress = Math.round((received / total) * 100)
      if (progress > prevPercentage) {
        prevPercentage = progress
        reply('logging', { status: true, data: `Downloading... ${progress}%`, final: false })
      }
    }

    // Check if error
    if (!response.ok) {
      const errorMessage = `Failed to download zip file: ${response.status}`
      Logger.error(errorMessage, {
        function: 'stageAppFile',
        source: 'stageAppFile'
      })
      reply('logging', {
        status: false,
        data: 'Encountered an error',
        final: true,
        error: errorMessage
      })
      return
    } else {
      Logger.debug(`[handleZipFromUrl] Downloading ${path}...`)
      trackDownloadProgress(0, 100)
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
        trackDownloadProgress(receivedLength, contentLength)
      }
    }
    // Combine chunks and save file
    const buffer = Buffer.concat(chunks)
    await promises.writeFile(tempZipPath, buffer)
  } else {
    Logger.debug(`[handleZipFromUrl] Local File Detected!`)
    // Handle case where it's a local file upload
    try {
      if (!existsSync(filePath)) {
        reply('logging', {
          status: false,
          data: 'File not found!',
          error: filePath,
          final: true
        })
        throw new Error(`Local file not found: ${path}`)
      }
      if (!filePath.toLowerCase().endsWith('.zip')) {
        reply('logging', {
          status: false,
          data: 'File must be a .zip file',
          final: true
        })
        throw new Error(`File must be a .zip file: ${path}`)
      }
      // Copy the zip file to the extractedPath from the provided path
      Logger.debug(`[handleZipFromUrl] Copying ${path} to ${extractedPath}!`)
      await promises.copyFile(filePath, tempZipPath)
    } catch (error) {
      // handle errors
      if (error instanceof Error) {
        const errorMessage = `Failed to copy local file: ${error.message}`
        console.error(`[handleZipFromFile] Error copying local file: ${error.message}`)
        Logger.log(LOGGING_LEVELS.ERROR, errorMessage)
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

  const AdmZip = await import('adm-zip')
  // Try extracting the zip file and reading the manifest
  await new Promise<void>((resolve, reject) => {
    try {
      Logger.debug(`[handleZipFromFile] Extracting app...`)
      if (!existsSync(tempZipPath)) {
        Logger.log(
          LOGGING_LEVELS.ERROR,
          `[handleZipFromFile] Temporary zip path at ${tempZipPath} does not exist!`
        )
        reply('logging', { status: false, data: 'Temp path does not exist!', final: false })
        return
      }
      const zip = new AdmZip.default(tempZipPath)

      reply('logging', { status: true, data: 'Extracting files...', final: false })
      zip.extractAllTo(extractedPath, true)

      reply('logging', { status: true, data: `App extracted to ${extractedPath}`, final: false })
      resolve()
    } catch (error) {
      Logger.log(LOGGING_LEVELS.ERROR, `[handleZipFromFile]: Error extracting ${extractedPath}`)
      reply && reply('logging', { status: false, data: 'Extraction failed!', final: true })
      reject(error)
    }
  })

  reply('logging', { status: true, data: 'Getting Manifest...', final: false })

  const manifestData = await getManifest(extractedPath)

  // Getting the return data
  Logger.debug(`[handleZip] Fetching manifest...`)
  if (!manifestData) {
    Logger.log(
      LOGGING_LEVELS.ERROR,
      `[handleZip] Error getting manifest from ${extractedPath}. Returning placeholder data...`
    )
    reply && reply('logging', { status: true, data: 'Error getting manifest!', final: false })
    return
  }

  const isValidated = await validateSha512(tempZipPath, releaseMeta)

  return { checksumValidated: isValidated, ...manifestData }
}

/**
 * Runs an app by its name.
 *
 * This portion of code will run the /appName/index.js of the provided app, save the app to the list of running apps, and setup any listeners/callback functions the apps will use.
 *
 * If the app already exists, it just initializes the app and runs it
 * @param {AppInstance} app - The name of the app to run.
 * @deprecated - use appStore instead
 */

/*
export const run = async (app: AppInstance): Promise<void> => {
  try {
    if (
      app &&
      typeof app.func?.start === 'function' &&
      app.meta?.verified &&
      app.meta.verifiedManifest
    ) {
      app.func.start({
        toServer: (data) => handleDataFromApp(app.name, data),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        SysEvents: (_event: string, _listener: (...args: string[]) => void) => {
          return () => {
            // do something with this to let apps listen for server events like apps being added or settings being changed
          }
        }
      })
      return // the app has already been verified
    } else {
      Logger.debug(`App ${app.name} has never been started. Running.`, {
        source: 'appInstaller',
        function: 'AppRunner'
      })
    }

    const DeskThing = await getDeskThing(app.name)

    if (!DeskThing) {
      Logger.error(`App ${app.name} does not export the DeskThing object!`, {
        source: 'appInstaller',
        function: 'AppRunner'
      })
      return
    }

    Logger.debug(`Configuring ${app.name}!`, {
      source: 'appInstaller',
      function: 'AppRunner'
    })

    // changes the reference for functions
    await setupFunctions(app, DeskThing)
    appStore.add(app)
    if (!app.manifest) {
      Logger.debug(`Getting ${app.name}'s manifest file!`, {
        source: 'appInstaller',
        function: 'AppRunner'
      })
      const manifestResponse: Response = await DeskThing.getManifest()

      // Handle the manifest response. Returns the manually searched manifest if the deskthing object returns something wrong.
      const manifest = await handleManifest(app.name, manifestResponse)

      if (!manifest) {
        Logger.error(`App ${app.name}'s manifest was not found.`, {
          source: 'appInstaller',
          function: 'AppRunner'
        })
        return
      } else {
        appStore.appendManifest(manifest, app.name)
      }
    }

    Logger.debug(`Running ${app.name}!`, {
      source: 'appInstaller',
      function: 'AppRunner'
    })
    const result = await start(app)
    if (!result) {
      Logger.error(`App ${app.name} failed to start!`, {
        source: 'appInstaller',
        function: 'AppRunner'
      })
    } else {
      Logger.debug(`App ${app.name} started successfully!`, {
        source: 'appInstaller',
        function: 'AppRunner'
      })
    }
  } catch (error) {
    Logger.error(`Error running app ${error}`, {
      source: 'appInstaller',
      function: 'AppRunner',
      error: error as Error
    })
  }
}
*/

/**
 * Starts the app assuming it exists in appState
 * @param appName
 * @returns
 * @deprecated - use appStore instead
 */
/*
export const start = async (appInstance: string | AppInstance): Promise<boolean> => {
  if (typeof appInstance == 'string') {
    appInstance = appStore.get(appInstance) as AppInstance
  }
  Logger.debug(`[start(${appInstance.name})]: Attempting to start app.`)

  if (!appInstance || !appInstance.func?.start || appInstance.func.start === undefined) {
    Logger.warn(`App ${appInstance.name} not found or not started correctly!`, {
      source: 'appInstaller',
      function: 'AppRunner'
    })
    return false
  }
  // Check if all required apps are running
  const appPath = getAppFilePath(appInstance.name)
  const manifest = appInstance.manifest || (await getManifest(appPath))

  if (!manifest) {
    Logger.warn(`[start(${appInstance.name})]: App ${appInstance.name}'s manifest not found.`, {
      function: 'start',
      source: 'appInstaller'
    })
    return false
  }

  if (manifest.requires) {
    const requiredApps = manifest.requires || []
    for (const requiredApp of requiredApps) {
      if (!appStore.getOrder().includes(requiredApp) && requiredApp.length > 2) {
        Logger.log(
          LOGGING_LEVELS.ERROR,
          `[start(${appInstance.name})]: Unable to run ${appInstance.name}! This app requires '${requiredApp}' to be enabled and running.`
        )
        appStore.stop(appInstance.name)
        return false
      }
    }
  }

  try {
    if (appInstance.func?.start) {
      const startResponse: Response = await appInstance.func.start({
        toServer: (data) => handleDataFromApp(appInstance.name, data),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        SysEvents: (_event: string, _listener: (...args: string[]) => void) => {
          return () => {
            // do something with this to let apps listen for server events like apps being added or settings being changed
          }
        }
      })
      if (startResponse.status == 200) {
        Logger.log(
          LOGGING_LEVELS.MESSAGE,
          `[start(${appInstance.name})]: App ${appInstance.name} started successfully with response ${startResponse.data.message}`
        )
        return true
      } else {
        Logger.log(
          LOGGING_LEVELS.ERROR,
          `[start(${appInstance.name})]: App ${appInstance.name} failed to start with response ${startResponse.data.message}`
        )
        return false
      }
    }
  } catch (error) {
    Logger.log(LOGGING_LEVELS.ERROR, `[start(${appInstance.name})]: Error starting app ${error}`, {
      source: 'appInstaller',
      function: 'AppRunner',
      error: error as Error
    })
  }
  return false
}
*/

/**
 * Sets up the functions in the appState from the DeskThing object
 * @param appName
 * @param DeskThing
 * @deprecated - use appStore instead
 * @returns
 */
/*
const setupFunctions = async (
  appInstance: AppInstance,
  DeskThing: DeskThingType
): Promise<void> => {
  const listeners: ((data: EventPayload) => Promise<void>)[] = []
  await Logger.debug(`Configuring functions for ${appInstance.name}.`, {
    source: 'appInstaller',
    function: 'setupFunctions'
  })

  try {
    if (!appInstance.func) {
      appInstance.func = {} as DeskThingType
    }
    appInstance.func.purge = async (): Promise<Response> => DeskThing.purge()

    appInstance.func.start = async (): Promise<Response> => {
      return DeskThing.start({
        toServer: (data) => handleDataFromApp(appInstance.name, data),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        SysEvents: (_event: string, _listener: (...args: string[]) => void) => {
          return () => {
            // do something with this to let apps listen for server events like apps being added or settings being changed
          }
        }
      })
    }

    appInstance.func.stop = async (): Promise<Response> => DeskThing.stop()

    appInstance.func.toClient = async (data: EventPayload): Promise<void> => {
      listeners.forEach((listener) => listener(data))
      DeskThing.toClient(data)
    }
  } catch (error) {
    Logger.error(`Error configuring app functions`, {
      source: 'appInstaller',
      function: 'setupFunctions',
      error: error as Error
    })
  }
}
*/

/**
 * Attempts to get the manifest from the DeskThing object and resorts to manually searching
 * @param appName The name of the app
 * @param manifestResponse The response from the DeskThing object
 * @deprecated - use appStore instead
 * @returns
 */
/*
const handleManifest = async (
  appName: string,
  manifestResponse: Response
): Promise<AppManifest | void> => {
  if (manifestResponse.status == 200) {
    // Manifest returned correctly
    return constructManifest(manifestResponse.data)
  } else if (manifestResponse.status == 500) {
    // Manifest not found, searching manually
    Logger.log(LOGGING_LEVELS.ERROR, `Manifest for app ${appName} not found! Searching manually`)

    const manifest = await getManifest(getAppFilePath(appName))
    if (manifest == undefined) {
      Logger.log(LOGGING_LEVELS.ERROR, `Manifest for app ${appName} not found!`, {
        source: 'appInstaller',
        function: 'handleManifest',
        error: new Error(`Manifest for app ${appName} not found!`)
      })
    }

    return manifest
  } else {
    // Critical error
    Logger.error(
      `Error getting manifest for ${appName}! Response message: ${manifestResponse.data.message}`,
      {
        source: 'appInstaller',
        function: 'handleManifest',
        error: new Error(`Error getting manifest for ${appName}`)
      }
    )
    return
  }
}
*/

/**
 * Gets the DeskThing object from the appEntryPoint
 * @param appName
 * @deprecated - use AppStore
 * @returns
 */
/*
const getDeskThing = async (appName: string): Promise<DeskThingType | void> => {
  const appEntryPointJs = getAppFilePath(appName, 'index.js')
  const appEntryPointMjs = getAppFilePath(appName, 'index.mjs')
  const appEntryPointCjs = getAppFilePath(appName, 'index.cjs')
  const serverEntryPointJs = getAppFilePath(appName, 'server/index.js')
  const serverEntryPointMjs = getAppFilePath(appName, 'server/index.mjs')
  const serverEntryPointCjs = getAppFilePath(appName, 'server/index.cjs')
  let appEntryPoint: string | undefined
  if (existsSync(appEntryPointJs)) {
    appEntryPoint = appEntryPointJs
  } else if (existsSync(appEntryPointMjs)) {
    appEntryPoint = appEntryPointMjs
  } else if (existsSync(appEntryPointCjs)) {
    appEntryPoint = appEntryPointCjs
  } else if (existsSync(serverEntryPointJs)) {
    appEntryPoint = serverEntryPointJs
  } else if (existsSync(serverEntryPointMjs)) {
    appEntryPoint = serverEntryPointMjs
  } else if (existsSync(serverEntryPointCjs)) {
    appEntryPoint = serverEntryPointCjs
  } else {
    Logger.log(
      LOGGING_LEVELS.ERROR,
      `Entry point for app ${appName} not found. (Does it have an index.js file in root or server directory?)`
    )
    return
  }
  if (existsSync(appEntryPoint)) {
    // TODO: Should verify the deskthing structure to ensure it is from the connector
    const { DeskThing } = await import(`file://${appEntryPoint}?cacheBust=${Date.now()}`)
    return DeskThing as DeskThingType
  }
  return
}
*/
