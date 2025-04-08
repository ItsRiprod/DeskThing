console.log('[AppRnr Service] Starting')
import Logger from '@server/utils/logger'
import { LOGGING_LEVELS } from '@deskthing/types'
import { storeProvider } from '@server/stores/storeProvider'

/**
 * Loads and runs all enabled apps from appData.json
 * This will also get the manifest data of each app and update that in case of there being any changes
 *
 * @returns {Promise<void>}
 */
export async function loadAndRunEnabledApps(): Promise<void> {
  const appStore = await storeProvider.getStore('appStore')

  try {
    const appInstances = appStore.getAll()
    Logger.debug('Loaded apps config. Running apps...', {
      source: 'loadAndRunEnabledApps'
    })

    // Only include enabled apps
    const enabledApps = appInstances.filter((appConfig) => appConfig.enabled === true)

    // Run all of the enabled apps
    await Promise.all(
      enabledApps.map(async (appConfig) => {
        Logger.debug(`Automatically running app ${appConfig.name}`, {
          source: 'loadAndRunEnabledApps'
        })
        await appStore.run(appConfig.name)
      })
    )
    const failedApps = enabledApps.filter((enabledApps) => enabledApps.running === false)
    if (!failedApps) return

    await Promise.all(
      failedApps.map(async (failedApp) => {
        Logger.debug(`SERVER: Attempting to run ${failedApp.name} again`, {
          source: 'loadAndRunEnabledApps'
        })
        await appStore.run(failedApp.name)
      })
    )
  } catch (error) {
    Logger.log(LOGGING_LEVELS.ERROR, `SERVER: Error loading and running enabled apps`, {
      source: 'loadAndRunEnabledApps',
      error: error as Error
    })
  }
}
