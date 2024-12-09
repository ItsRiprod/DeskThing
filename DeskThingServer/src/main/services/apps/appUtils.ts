console.log('[AppUtils Service] Starting')
import { Manifest, MESSAGE_TYPES } from '@shared/types'
import { join } from 'path'
import { existsSync, promises } from 'node:fs'
import loggingStore from '../../stores/loggingStore'
import { app } from 'electron'

let devAppPath: string

/**
 * Retrieves and parses the manifest file for an app.
 * This function should be used when loading or updating app information.
 * It reads the manifest file from the specified location and returns the parsed JSON data.
 *
 * @param fileLocation The file path of the manifest file to be read and parsed
 * @returns The parsed manifest data as a JavaScript object
 */
export async function getManifest(fileLocation: string): Promise<Manifest | undefined> {
  try {
    loggingStore.log(MESSAGE_TYPES.LOGGING, '[getManifest] Getting manifest for app')
    const manifestPath = join(fileLocation, 'manifest.json')
    if (!existsSync(manifestPath)) {
      throw new Error('manifest.json not found after extraction')
    }

    const manifest = await promises.readFile(manifestPath, 'utf8')
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
    loggingStore.log(MESSAGE_TYPES.LOGGING, '[getManifest] Successfully got manifest for app')
    return returnData
  } catch (error) {
    console.error('Error getting manifest:', error)
    return undefined
  }
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
      loggingStore.log(MESSAGE_TYPES.ERROR, 'Developer app path not set! (Expected if on startup)')
    }
  } else {
    path = join(app.getPath('userData'), 'apps', appName, fileName)
  }
  return path
}
