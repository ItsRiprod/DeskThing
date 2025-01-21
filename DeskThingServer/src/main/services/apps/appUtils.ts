console.log('[AppUtils Service] Starting')
import { AppManifest, MESSAGE_TYPES, TagTypes } from '@shared/types'
import { join } from 'path'
import { existsSync, promises } from 'node:fs'
import { loggingStore } from '@server/stores/'
import { app } from 'electron'

/**
 * Retrieves and parses the manifest file for an app.
 * This function should be used when loading or updating app information.
 * It reads the manifest file from the specified location and returns the parsed JSON data.
 *
 * @param fileLocation The file path of the manifest file to be read and parsed
 * @returns The parsed manifest data as a JavaScript object
 */
export async function getManifest(fileLocation: string): Promise<AppManifest | undefined> {
  try {
    loggingStore.log(MESSAGE_TYPES.LOGGING, '[getManifest] Getting manifest for app')
    const manifestPath = join(fileLocation, 'manifest.json')
    if (!existsSync(manifestPath)) {
      throw new Error('manifest.json not found after extraction')
    }

    const manifest = await promises.readFile(manifestPath, 'utf8')
    const parsedManifest = JSON.parse(manifest)

    const returnData: AppManifest = {
      id: parsedManifest.id,
      requires: parsedManifest.requires,
      label: parsedManifest.label,
      version: parsedManifest.version,
      description: parsedManifest.description,
      author: parsedManifest.author,
      platforms: parsedManifest.platforms,
      tags: parsedManifest.tags || [
        parsedManifest.isAudioSource && TagTypes.AUDIO_SOURCE,
        parsedManifest.isScreenSaver && TagTypes.SCREEN_SAVER
      ],
      requiredVersions: {
        client: parsedManifest.requiredVersions.client || '>=0.0.0',
        server: parsedManifest.requiredVersions.server || '>=0.0.0'
      },
      homepage: parsedManifest.homepage,
      repository: parsedManifest.repository,
      updateUrl: parsedManifest.updateUrl || parsedManifest.repository || undefined,
      version_code: parsedManifest.version_code || undefined,
      compatible_server: parsedManifest.compatible_server || undefined,
      compatible_client: parsedManifest.compatible_client || undefined,
      isWebApp: parsedManifest.isWebApp || undefined,
      isAudioSource: parsedManifest.isAudioSource || undefined,
      isScreenSaver: parsedManifest.isScreenSaver || undefined,
      isLocalApp: parsedManifest.isLocalApp || undefined
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
    loggingStore.log(MESSAGE_TYPES.ERROR, 'Developer app does not exist!')
  } else {
    path = join(app.getPath('userData'), 'apps', appName, fileName)
  }
  return path
}
