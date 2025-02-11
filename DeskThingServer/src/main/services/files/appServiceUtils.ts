import Logger from '@server/utils/logger'
import {
  App,
  AppDataInterface,
  AppManifest,
  LOGGING_LEVELS,
  PlatformTypes,
  TagTypes
} from '@DeskThing/types'
import { AppData, LegacyAppData } from '@shared/types'
import { isValidTask } from '../task'
import { isValidAppSettings } from '../apps'
import { isValidAction, isValidKey } from '../mappings/utilsMaps'
/**
 * @throws Error when not a structure
 * @param apps - The AppData
 * */
export const verifyAppDataStructure: (
  apps?: unknown | AppData | LegacyAppData
) => asserts apps is AppData = (apps) => {
  if (!apps) throw new Error('[verifyAppDataStructure] Apps do not exist')
  if (typeof apps != 'object') throw new Error('[verifyAppStructure] Apps is not an object')

  // Only old structures should have apps and config
  if ('apps' in apps && 'config' in apps) {
    Logger.log(LOGGING_LEVELS.WARN, 'App Data outdated. Updating...')
    const oldApps = apps as LegacyAppData
    oldApps.apps.forEach((app) => {
      try {
        sanitizeAppStructure(app)
        apps[app.name] = app
      } catch (error) {
        handleError(
          error,
          `[verifyAppDataStructure]: App ${app?.name || 'unknown'} had issue being verified`
        )
      }
    })
    delete apps.apps
    delete apps.config
  } else {
    Object.entries(apps).forEach(([appId, app]) => {
      try {
        sanitizeAppStructure(app as Partial<App>)
        apps[appId] = app
      } catch (error) {
        handleError(
          error,
          `[verifyAppDataStructure]: App ${app || 'unknown'} had issue being verified`
        )
      }
    })
  }
}

const handleError = (error: unknown | Error, message: string): void => {
  if (error instanceof Error) {
    Logger.log(LOGGING_LEVELS.ERROR, message + ' ' + error.message)
  } else {
    Logger.log(LOGGING_LEVELS.ERROR, message + ' ' + error)
    console.error(error)
  }
}

/**
 * Verifies that the app is a valid AppDataInterface.
 * @throws  Error if the app is not a valid AppDataInterface
 * @param app - The app to verify
 */
export const isValidAppDataInterface: (
  app: Partial<AppDataInterface>
) => asserts app is AppDataInterface = (app) => {
  if (!app) {
    throw new Error('App data interface is undefined')
  }
  if (typeof app !== 'object') {
    throw new Error('App data interface is not an object')
  }
  if (!app.version) {
    throw new Error('App data interface version is undefined')
  }
  if (app.settings) {
    isValidAppSettings(app.settings)
  }
  if (app.tasks) {
    Object.values(app.tasks).forEach((task) => {
      isValidTask(task)
    })
  }
  if (app.actions) {
    Object.values(app.actions).forEach((action) => {
      isValidAction(action)
    })
  }
  if (app.keys) {
    Object.values(app.keys).forEach((key) => {
      isValidKey(key)
    })
  }
}

export const sanitizeAppDataInterface: (
  app: Partial<AppDataInterface>
) => asserts app is AppDataInterface = (app) => {
  if (!app.version) {
    app.version = '1.0.0'
  }

  app.settings = app.settings ?? {}
  app.data = app.data ?? {}
  app.tasks = app.tasks ?? {}
  app.keys = app.keys ?? {}
  app.actions = app.actions ?? {}
}

/**
 * @throws - If the app is not an App
 * @param app Potentially partial app
 */
export const sanitizeAppStructure: (app: Partial<App>) => asserts app is App = (app) => {
  if (typeof app != 'object') {
    throw new Error('App is not an object!')
  }

  if (!app.name) {
    if (app.manifest) {
      app.name = app.manifest.id
    } else {
      throw new Error('App does not have a name!' + JSON.stringify(app))
    }
  }

  app.name = app.name || ''
  app.enabled = app.enabled ?? false
  app.running = app.running ?? false
  app.prefIndex = app.prefIndex ?? 1

  sanitizeAppMeta(app as Partial<App>)
}
/**
 * verify app meta information and return the properly constructed one
 * Modifies the app directly
 * Also verifies the manifest data if it needs to be verified
 * @asserts app is Required<Pick<App, 'meta'>>
 */
export const sanitizeAppMeta: (
  app: Partial<App>
) => asserts app is Required<Pick<App, 'meta' | 'manifest'>> = (app) => {
  const currentMetaVersion = '0.10.4' // find a better way to do this

  if (!app.meta) {
    app.manifest = constructManifest(app.manifest)
    app.meta = {
      version: currentMetaVersion,
      verified: true,
      verifiedManifest: true,
      updateAvailable: false,
      updateChecked: false
    }
  }

  if (!app.meta.verifiedManifest) {
    app.manifest = constructManifest(app.manifest)
    app.meta.verifiedManifest = true
  }

  if (app.meta.version != currentMetaVersion) {
    app.meta.version = currentMetaVersion
    app.meta.verified = true
  }

  if (!app.meta.verified) {
    app.meta.verified = true
  }
}

/**
 * Constructs the app's manifest and fills in any information that may be missing
 */
export const constructManifest = (manifestData?: Partial<AppManifest>): AppManifest => {
  const returnData: AppManifest = {
    id: manifestData?.id || 'unknown',
    requires: manifestData?.requires || [],
    label: manifestData?.label || 'Unknown App',
    version: manifestData?.version || '0.0.0',
    description: manifestData?.description || 'No description available',
    author: manifestData?.author || 'Unknown Author',
    platforms: manifestData?.platforms || Object.values(PlatformTypes),
    homepage: manifestData?.homepage || '',
    repository: manifestData?.repository || '',
    updateUrl: manifestData?.updateUrl || manifestData?.repository || '',
    tags:
      manifestData?.tags ||
      ([] as TagTypes[]).concat(
        manifestData?.isAudioSource ? [TagTypes.AUDIO_SOURCE] : [],
        manifestData?.isScreenSaver ? [TagTypes.SCREEN_SAVER] : [],
        manifestData?.isWebApp ? [TagTypes.WEB_APP_ONLY] : [],
        manifestData?.isLocalApp ? [TagTypes.UTILITY_ONLY] : []
      ),
    requiredVersions: {
      client: manifestData?.requiredVersions?.client || '>=0.0.0',
      server: manifestData?.requiredVersions?.server || '>=0.0.0'
    },
    template: manifestData?.template || 'default',
    version_code: manifestData?.version_code || 0,
    compatible_server: manifestData?.compatible_server || [0],
    compatible_client: manifestData?.compatible_client || [0],
    isWebApp: manifestData?.isWebApp || false,
    isAudioSource: manifestData?.isAudioSource || false,
    isScreenSaver: manifestData?.isScreenSaver || false,
    isLocalApp: manifestData?.isLocalApp || false
  }
  return returnData
}
