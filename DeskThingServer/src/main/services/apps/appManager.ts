console.log('[AppMangr Service] Starting')
import { rmSync, readdirSync, statSync, existsSync } from 'node:fs'
import Logger from '@server/utils/logger'
import { LOGGING_LEVELS } from '@DeskThing/types'
export async function clearCache(appName: string): Promise<void> {
  try {
    const { join } = await import('path')
    const { getAppFilePath } = await import('./appUtils')
    const dir = getAppFilePath(appName)

    const items = readdirSync(dir)
    if (!items || items.length === 0) {
      Logger.log(LOGGING_LEVELS.WARN, `SERVER: Directory ${dir} is empty`)
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
            Logger.log(LOGGING_LEVELS.ERROR, `SERVER: Error clearing cache for ${itemPath}:`, {
              error,
              function: 'clearCache',
              source: 'clearCache'
            })
          } else {
            Logger.log(LOGGING_LEVELS.ERROR, `SERVER: Error clearing cache for ${itemPath}:`, {
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
        LOGGING_LEVELS.ERROR,
        `SERVER: Error clearing cache for directory ${appName}: ` + error.message
      )
    } else {
      Logger.log(
        LOGGING_LEVELS.ERROR,
        `SERVER: Error clearing cache for directory ${appName}:` + String(error)
      )
    }
  }
}

/**
 * Purges an app by its name, stopping it and removing its configuration and data.
 *
 * @param {string} appName - The name of the app to purge.
 * @throws {Error} If an error occurs during the purge process.
 */
export async function purgeApp(appName: string): Promise<void> {
  const errors: Error[] = []

  try {
    Logger.info(`SERVER: Purging App ${appName}`)

    const { purgeAppData } = await import('../files/dataService')
    const { purgeAppConfig } = await import('../files/appService')
    const { default: keyMapStore } = await import('@server/stores/mappingStore')
    const { default: taskStore } = await import('@server/stores/taskStore')

    // Purge App Data
    try {
      await purgeAppData(appName)
    } catch (e) {
      errors.push(e instanceof Error ? e : new Error(String(e)))
      Logger.error(`Failed to purge app data for ${appName}:`, { error: e as Error })
    }

    // Purge App Config
    try {
      await purgeAppConfig(appName)
    } catch (e) {
      errors.push(e instanceof Error ? e : new Error(String(e)))
      Logger.error(`Failed to purge app config for ${appName}:`, { error: e as Error })
    }

    // Remove buttons / keys associated with app
    try {
      await keyMapStore.removeSource(appName)
    } catch (e) {
      errors.push(e instanceof Error ? e : new Error(String(e)))
      Logger.error(`Failed to remove key mappings for ${appName}:`, { error: e as Error })
    }

    // Remove buttons / keys associated with app
    try {
      await taskStore.removeSource(appName)
    } catch (e) {
      errors.push(e instanceof Error ? e : new Error(String(e)))
      Logger.error(`Failed to remove key mappings for ${appName}:`, { error: e as Error })
    }

    // Clear cache
    try {
      await clearCache(appName)
    } catch (e) {
      errors.push(e instanceof Error ? e : new Error(String(e)))
      Logger.error(`Failed to clear cache for ${appName}:`, { error: e as Error })
    }

    const { getAppFilePath } = await import('./appUtils')
    const dir = getAppFilePath(appName)

    if (appName == 'developer-app') return // Cancel here if it is a developer app

    // Remove the file from filesystem
    try {
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
    } catch (e) {
      errors.push(e instanceof Error ? e : new Error(String(e)))
      Logger.error(`Failed to remove app directory for ${appName}:`, { error: e as Error })
    }

    Logger.info(`SERVER: Purged App ${appName}`)

    if (errors.length > 0) {
      throw new Error(
        `Completed app purge with ${errors.length} errors: ${errors.map((e) => e.message).join(', ')}`
      )
    }
  } catch (error) {
    console.error(`Error purging app data for ${appName}`, error)
    throw error
  }
}
