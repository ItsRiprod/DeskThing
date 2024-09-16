import dataListener, { MESSAGE_TYPES } from '../../utils/events'

/**
 * Loads and runs all enabled apps from appData.json
 * This will also get the manifest data of each app and update that in case of there being any changes
 *
 * @returns {Promise<void>}
 */
export async function loadAndRunEnabledApps(): Promise<void> {
  const { AppHandler } = await import('./appState')
  const appHandler = AppHandler.getInstance()

  try {
    const appInstances = appHandler.getAll()
    dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, 'SERVER: Loaded apps config. Running apps...')
    const enabledApps = appInstances.filter((appConfig) => appConfig.enabled === true)

    await Promise.all(
      enabledApps.map(async (appConfig) => {
        dataListener.asyncEmit(
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
        dataListener.asyncEmit(
          MESSAGE_TYPES.LOGGING,
          `SERVER: Attempting to run ${failedApp.name} again`
        )
        await appHandler.run(failedApp.name)
      })
    )
  } catch (error) {
    dataListener.asyncEmit(
      MESSAGE_TYPES.ERROR,
      `SERVER: Error loading and running enabled apps: ${error}`
    )
  }
}
