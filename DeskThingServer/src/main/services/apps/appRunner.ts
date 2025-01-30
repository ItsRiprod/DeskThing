console.log('[AppRnr Service] Starting')
import Logger from '@server/utils/logger'
import { MESSAGE_TYPES } from '@shared/types'

/**
 * Loads and runs all enabled apps from appData.json
 * This will also get the manifest data of each app and update that in case of there being any changes
 *
 * @returns {Promise<void>}
 */
export async function loadAndRunEnabledApps(): Promise<void> {
  const { appStore } = await import('@server/stores')

  try {
    const appInstances = appStore.getAll()
    Logger.info('Loaded apps config. Running apps...', {
      source: 'loadAndRunEnabledApps'
    })

    // Only include enabled apps
    const enabledApps = appInstances.filter((appConfig) => appConfig.enabled === true)

    // Run all of the enabled apps
    await Promise.all(
      enabledApps.map(async (appConfig) => {
        Logger.info(`Automatically running app ${appConfig.name}`, {
          source: 'loadAndRunEnabledApps'
        })
        await appStore.run(appConfig.name)
      })
    )
    const failedApps = enabledApps.filter((enabledApps) => enabledApps.running === false)
    if (!failedApps) return

    await Promise.all(
      failedApps.map(async (failedApp) => {
        Logger.info(`SERVER: Attempting to run ${failedApp.name} again`, {
          source: 'loadAndRunEnabledApps'
        })
        await appStore.run(failedApp.name)
      })
    )
  } catch (error) {
    Logger.log(MESSAGE_TYPES.ERROR, `SERVER: Error loading and running enabled apps`, {
      source: 'loadAndRunEnabledApps',
      error: error as Error
    })
  }
}
