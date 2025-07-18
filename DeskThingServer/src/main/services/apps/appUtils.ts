import { access, readFile } from 'node:fs/promises'
import { join } from 'path'
import { constructManifest } from './appValidator'
import Logger from '@server/utils/logger'
import { AppManifest, LOGGING_LEVELS } from '@deskthing/types'
import { existsSync } from 'node:fs'
import { app } from 'electron'

/**
 * Retrieves and parses the manifest file for an app.
 * This function should be used when loading or updating app information.
 * It reads the manifest file from the specified location and returns the parsed JSON data.
 *
 * @param fileLocation The file path of the manifest file to be read and parsed
 * @returns The parsed manifest data as a JavaScript object
 */
export const getManifest = async (fileLocation: string): Promise<AppManifest | undefined> => {
  try {
    Logger.debug('[getManifest] Getting manifest for app')
    const manifestPath = join(fileLocation, 'manifest.json')
    if (!existsSync(manifestPath)) {
      throw new Error('manifest.json not found after extraction')
    }

    const manifest = await readFile(manifestPath, 'utf8')
    const parsedManifest = JSON.parse(manifest)

    const returnData: AppManifest = constructManifest(parsedManifest)
    Logger.info('[getManifest] Successfully got manifest for app')
    return returnData
  } catch (error) {
    console.error(`Error getting manifest from ${fileLocation}`, error)
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
    Logger.log(LOGGING_LEVELS.ERROR, 'Developer app does not exist!')
  } else {
    path = join(app.getPath('userData'), 'apps', appName, fileName)
  }
  return path
}

export const getStandardizedFilename = (appId: string, version: string): string => {
  return `${appId}-v${version}.zip`
}

export const getIcon = async (appName: string, icon?: string): Promise<string | null> => {
  const iconPath = join(getAppFilePath(appName), 'icons', icon || `${appName}.svg`)
  try {
    const exists = await access(iconPath)
      .catch(() => false)
      .then(() => true)

    if (exists) {
      const svgContent = await readFile(iconPath, 'utf-8')
      // Return file protocol URL that Electron can load directly
      return svgContent
    } else {
      Logger.debug(`Attempted to access icon for ${appName} but it does not exist`, {
        source: 'appUtils',
        function: 'getIcon'
      })
      return null
    }
  } catch (error) {
    Logger.warn(`Error accessing icon for ${appName}:`, {
      source: 'getIcon',
      error: error as Error
    })
    return null
  }
}
