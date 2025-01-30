console.log('[AppRnr Service] Starting')
import loggingStore from '@server/stores/loggingStore.ts'
import { MESSAGE_TYPES } from '@shared/types/index.ts'

/**
 * Loads and runs all enabled apps from appData.json
 * This will also get the manifest data of each app and update that in case of there being any changes
 */
export async function loadAndRunEnabledApps(): Promise<void> {
  const { AppHandler } = await import('./appState.ts')
  const appHandler = AppHandler.getInstance()

  try {
    const appInstances = appHandler.getAll()
    loggingStore.log(MESSAGE_TYPES.LOGGING, 'SERVER: Loaded apps config. Running apps...')
    const enabledApps = appInstances.filter((appConfig) => appConfig.enabled === true)

    await Promise.all(
      enabledApps.map(async (appConfig) => {
        loggingStore.log(
          MESSAGE_TYPES.LOGGING,
          `SERVER: Automatically running app ${appConfig.name}`
        )
        await appHandler.run(appConfig.name)
      })
    )
    const failedApps = enabledApps.filter((enabledApps) => enabledApps.running === false)
    if (!failedApps) return

    await Promise.all(
      failedApps.map(async (failedApp) => {
        loggingStore.log(MESSAGE_TYPES.LOGGING, `SERVER: Attempting to run ${failedApp.name} again`)
        await appHandler.run(failedApp.name)
      })
    )
  } catch (error) {
    loggingStore.log(
      MESSAGE_TYPES.ERROR,
      `SERVER: Error loading and running enabled apps: ${error}`
    )
  }
}
