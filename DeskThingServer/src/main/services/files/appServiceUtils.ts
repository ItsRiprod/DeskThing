import loggingStore from '@server/stores/loggingStore'
import { App, AppData, LegacyAppData, MESSAGE_TYPES } from '@shared/types'

/**
 * @throws Error when not a structure
 * @param apps - The AppData
 */
export const verifyAppDataStructure = (apps?: AppData | LegacyAppData): AppData => {
  if (!apps) return {}
  if (typeof apps != 'object') throw new Error('[verifyAppStructure] Apps is not an object')

  // Only old structures should have apps and config
  if (apps.apps && apps.config) {
    loggingStore.log(MESSAGE_TYPES.WARNING, 'App Data outdated. Updating...')
    const oldApps = apps as unknown as LegacyAppData
    const newApps: AppData = {}
    oldApps.apps.map((app) => {
      newApps[app.name] = verifyAppStructure(app)
    })

    return newApps
  } else {
    const newApps: AppData = {}
    Object.entries(apps).map(([appId, app]) => {
      newApps[appId] = verifyAppStructure(app)
    })
    return newApps
  }
}

/**
 * @throws - If the app is not an App
 * @param app Potentially partial app
 */
export const verifyAppStructure = (app: Partial<App>): App => {
  if (typeof app != 'object') {
    throw new Error('App is not an object!')
  }

  if (!app.name || typeof app.name != 'string') {
    throw new Error('App does not have a name!')
  }

  if (app.enabled == undefined) {
    app.enabled = false
  }
  if (app.running == undefined) {
    app.running = false
  }
  if (app.prefIndex == undefined) {
    app.prefIndex = 1
  }

  return app as App
}
