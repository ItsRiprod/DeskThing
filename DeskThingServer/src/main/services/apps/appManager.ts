console.log('[AppMangr Service] Starting')
import { rmSync, readdirSync, statSync, existsSync } from 'node:fs'
import loggingStore from '../../stores/loggingStore'
import { MESSAGE_TYPES } from '@shared/types'
export async function clearCache(appName: string): Promise<void> {
  try {
    const { join } = await import('path')
    const { getAppFilePath } = await import('./appUtils')
    const dir = getAppFilePath(appName)

    const items = readdirSync(dir)
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
            loggingStore.log(MESSAGE_TYPES.LOGGING, `SERVER: Removed ${resolvedPath} from cache`)
          } else {
            loggingStore.log(MESSAGE_TYPES.LOGGING, `SERVER: ${resolvedPath} not in cache!`)
          }
        } catch (error) {
          if (error instanceof Error) {
            loggingStore.log(
              MESSAGE_TYPES.ERROR,
              `SERVER: Error clearing cache for ${itemPath}:`,
              error.message
            )
          } else {
            loggingStore.log(
              MESSAGE_TYPES.ERROR,
              `SERVER: Error clearing cache for ${itemPath}:`,
              String(error)
            )
          }
        }
      }
    })
  } catch (error) {
    if (error instanceof Error) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `SERVER: Error clearing cache for directory ${appName}:`,
        error.message
      )
    } else {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `SERVER: Error clearing cache for directory ${appName}:`,
        String(error)
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
    loggingStore.log(MESSAGE_TYPES.LOGGING, `SERVER: Purging App ${appName}`)

    const { purgeAppData } = await import('../../handlers/dataHandler')
    const { purgeAppConfig } = await import('../../handlers/configHandler')
    const keyMapStore = (await import('../mappings/mappingStore')).default

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
    if (existsSync(dir)) {
      await rmSync(dir, { recursive: true, force: true })
      loggingStore.log(MESSAGE_TYPES.LOGGING, `Purged all data for app ${appName}`)
    }
    loggingStore.log(MESSAGE_TYPES.LOGGING, `SERVER: Purged App ${appName}`)
  } catch (error) {
    console.error(`Error purging app data for ${appName}`, error)
  }
}
