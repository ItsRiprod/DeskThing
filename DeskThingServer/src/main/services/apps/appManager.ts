console.log('[AppMangr Service] Starting')
import { rmSync, readdirSync, statSync, existsSync } from 'node:fs'
import Logger from '@server/utils/logger'
import { MESSAGE_TYPES } from '@shared/types'
export async function clearCache(appName: string): Promise<void> {
  try {
    const { join } = await import('path')
    const { getAppFilePath } = await import('./appUtils')
    const dir = getAppFilePath(appName)

    const items = readdirSync(dir)
    if (!items || items.length === 0) {
      Logger.log(MESSAGE_TYPES.WARNING, `SERVER: Directory ${dir} is empty`)
      return
    }

    items.forEach((item) => {
      const itemPath = join(dir, item)
      const stats = statSync(itemPath)

      if (stats.isDirectory()) {
        // Recursively clear directories
        clearCache(itemPath)
      } else if (stats.isFile()) {
        try {
          // Resolve and clear file from cache
          const resolvedPath = require.resolve(itemPath)
          if (require.cache[resolvedPath]) {
            delete require.cache[resolvedPath]
            Logger.info(`SERVER: Removed ${resolvedPath} from cache`)
          } else {
            Logger.info(`SERVER: ${resolvedPath} not in cache!`)
          }
        } catch (error) {
          if (error instanceof Error) {
            Logger.log(MESSAGE_TYPES.ERROR, `SERVER: Error clearing cache for ${itemPath}:`, {
              error,
              function: 'clearCache',
              source: 'clearCache'
            })
          } else {
            Logger.log(MESSAGE_TYPES.ERROR, `SERVER: Error clearing cache for ${itemPath}:`, {
              error: new Error(String(error)),
              function: 'clearCache',
              source: 'clearCache'
            })
          }
        }
      }
    })
  } catch (error) {
    if (error instanceof Error) {
      Logger.log(
        MESSAGE_TYPES.ERROR,
        `SERVER: Error clearing cache for directory ${appName}: ` + error.message
      )
    } else {
      Logger.log(
        MESSAGE_TYPES.ERROR,
        `SERVER: Error clearing cache for directory ${appName}:` + String(error)
      )
    }
  }
}

/**
 * Purges an app by its name, stopping it and removing its configuration and data.
 *
 * @param {string} appName - The name of the app to purge.
 */
export async function purgeApp(appName: string): Promise<void> {
  try {
    Logger.info(`SERVER: Purging App ${appName}`)

    const { purgeAppData } = await import('../files/dataService')
    const { purgeAppConfig } = await import('../files/appService')
    const keyMapStore = (await import('@server/stores/mappingStore')).default

    // Purge App Data
    await purgeAppData(appName)

    // Purge App Config
    await purgeAppConfig(appName)

    // Remove buttons / keys associated with app
    await keyMapStore.removeSource(appName)

    // Get path to file
    await clearCache(appName)

    const { getAppFilePath } = await import('./appUtils')
    const dir = getAppFilePath(appName)

    if (appName == 'developer-app') return // Cancel here if it is a developer app
    // Remove the file from filesystem
    console.log('Removing file:', appName)
    const appExists = existsSync(dir)
    console.log('App exists:', appExists)
    if (appExists) {
      console.log('Removing directory:', dir)
      await rmSync(dir, { recursive: true, force: true })
      Logger.info(`Purged all data for app ${appName}`)
    } else {
      console.log('Directory does not exist:', dir)
    }
    Logger.info(`SERVER: Purged App ${appName}`)
  } catch (error) {
    console.error(`Error purging app data for ${appName}`, error)
  }
}
