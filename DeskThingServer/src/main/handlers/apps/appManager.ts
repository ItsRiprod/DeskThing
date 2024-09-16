import { rmSync, readdirSync, statSync, existsSync } from 'node:fs'
import dataListener, { MESSAGE_TYPES } from '../../utils/events'

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
            dataListener.asyncEmit(
              MESSAGE_TYPES.LOGGING,
              `SERVER: Removed ${resolvedPath} from cache`
            )
          } else {
            dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, `SERVER: ${resolvedPath} not in cache!`)
          }
        } catch (e) {
          dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, `SERVER: clearCache Error`, e)
        }
      }
    })
  } catch (error) {
    dataListener.asyncEmit(
      MESSAGE_TYPES.LOGGING,
      `SERVER: Error clearing cache for directory ${appName}:`,
      error
    )
  }
}

/**
 * Purges an app by its name, stopping it and removing its configuration and data.
 *
 * @param {string} appName - The name of the app to purge.
 */
export async function purgeApp(appName: string): Promise<void> {
  try {
    dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, `SERVER: Purging App ${appName}`)

    const { purgeAppData } = await import('../dataHandler')
    const { purgeAppConfig } = await import('../configHandler')
    const { removeAppData } = await import('../keyMapHandler')

    // Purge App Data
    await purgeAppData(appName)

    // Purge App Config
    await purgeAppConfig(appName)

    // Remove buttons / keys associated with app
    await removeAppData(appName)

    // Get path to file
    await clearCache(appName)

    const { getAppFilePath } = await import('./appUtils')
    const dir = getAppFilePath(appName)

    if (appName == 'developer-app') return // Cancel here if it is a developer app
    // Remove the file from filesystem
    if (existsSync(dir)) {
      await rmSync(dir)
      console.log(`Purged all data for app ${appName}`)
    }
    dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, `SERVER: Purged App ${appName}`)
  } catch (error) {
    console.error(`Error purging app data for ${appName}`, error)
  }
}
