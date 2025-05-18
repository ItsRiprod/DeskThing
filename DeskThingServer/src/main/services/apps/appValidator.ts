// App Types
import {
  AppManifest,
  AppSettings,
  LOGGING_LEVELS,
  SETTING_TYPES,
  SettingsBoolean,
  SettingsColor,
  SettingsList,
  SettingsMultiSelect,
  SettingsNumber,
  SettingsRange,
  SettingsRanked,
  SettingsSelect,
  SettingsString,
  SettingsType,
  App,
  AppDataInterface,
  PlatformTypes,
  TagTypes,
  AppReleaseSingleMeta
} from '@deskthing/types'
import { AppData, LegacyAppData } from '@shared/types'

// Utils
import Logger from '@server/utils/logger'

// Validation
import { isValidTask } from '../task'
import { isValidAction, isValidKey } from '../mappings/mapsValidation'
import { statSync } from 'node:fs'

/**
 * Validates a setting.
 * @throws {Error} If the setting is not valid
 * @param setting The setting to validate
 */
export const isValidSettings: (setting: unknown) => asserts setting is SettingsType = (setting) => {
  if (!setting) {
    throw new Error('[isValidSetting] Setting must be a valid object')
  }
  if (typeof setting !== 'object') {
    throw new Error('[isValidSetting] Setting must be an object')
  }
  if ('type' in setting && typeof setting.type !== 'string') {
    throw new Error('[isValidSetting] Setting type must be a string')
  }
  if ('label' in setting && typeof setting.label !== 'string') {
    throw new Error('[isValidSetting] Setting label must be a string')
  }

  const typedSetting = setting as SettingsType

  switch (typedSetting.type) {
    case SETTING_TYPES.NUMBER:
      if (typeof typedSetting.value !== 'number')
        throw new Error('[isValidSetting] Number setting value must be a number')
      if (typeof typedSetting.min !== 'number')
        throw new Error('[isValidSetting] Number setting min must be a number')
      if (typeof typedSetting.max !== 'number')
        throw new Error('[isValidSetting] Number setting max must be a number')
      break
    case SETTING_TYPES.BOOLEAN:
      if (typeof typedSetting.value !== 'boolean')
        throw new Error('[isValidSetting] Boolean setting value must be a boolean')
      break
    case SETTING_TYPES.STRING:
      if (typeof typedSetting.value !== 'string')
        throw new Error('[isValidSetting] String setting value must be a string')
      if (typedSetting.maxLength && typeof typedSetting.maxLength !== 'number')
        throw new Error('[isValidSetting] String setting maxLength must be a number')
      break
    case SETTING_TYPES.SELECT:
    case SETTING_TYPES.MULTISELECT:
    case SETTING_TYPES.RANKED:
    case SETTING_TYPES.LIST:
      if (!Array.isArray(typedSetting.options))
        throw new Error(`[isValidSetting] ${typedSetting.type} setting must have options array`)
      typedSetting.options.forEach((option) => {
        if (typeof option.label !== 'string')
          throw new Error('[isValidSetting] Option label must be a string')
        if (typeof option.value !== 'string')
          throw new Error('[isValidSetting] Option value must be a string')
      })
      break
    case SETTING_TYPES.RANGE:
      if (typeof typedSetting.value !== 'number')
        throw new Error('[isValidSetting] Range setting value must be a number')
      if (typeof typedSetting.min !== 'number')
        throw new Error('[isValidSetting] Range setting min must be a number')
      if (typeof typedSetting.max !== 'number')
        throw new Error('[isValidSetting] Range setting max must be a number')
      if (typedSetting.step && typeof typedSetting.step !== 'number')
        throw new Error('[isValidSetting] Range setting step must be a number')
      break
    case SETTING_TYPES.COLOR:
      if (typeof typedSetting.value !== 'string')
        throw new Error('[isValidSetting] Color setting value must be a string')
      break
    default:
      throw new Error(`[isValidSetting] Invalid setting type: ${JSON.stringify(typedSetting)}`)
  }
}

/**
 * Sanitizes the Settings object to ensure it meets the required structure.
 * @throws Error if the settings are invalid.
 * @param setting
 * @returns
 */
export const sanitizeSettings: (setting: Partial<SettingsType>) => SettingsType = (setting) => {
  isValidSettings(setting)

  switch (setting.type) {
    case SETTING_TYPES.SELECT:
      setting = {
        type: SETTING_TYPES.SELECT,
        value: setting.value,
        label: setting.label,
        description: setting.description || '',
        placeholder: setting.placeholder,
        options: setting.options
      } as SettingsSelect
      break
    case SETTING_TYPES.MULTISELECT:
      setting = {
        type: SETTING_TYPES.MULTISELECT,
        value: setting.value,
        label: setting.label,
        description: setting.description || '',
        placeholder: setting.placeholder,
        options: setting.options
      } as SettingsMultiSelect
      break
    case SETTING_TYPES.NUMBER:
      setting = {
        type: SETTING_TYPES.NUMBER,
        value: setting.value,
        label: setting.label,
        min: setting.min,
        max: setting.max,
        description: setting.description || ''
      } as SettingsNumber
      break
    case SETTING_TYPES.BOOLEAN:
      setting = {
        type: SETTING_TYPES.BOOLEAN,
        value: setting.value,
        description: setting.description || '',
        label: setting.label
      } as SettingsBoolean
      break
    case SETTING_TYPES.STRING:
      setting = {
        type: SETTING_TYPES.STRING,
        description: setting.description || '',
        value: setting.value,
        label: setting.label
      } as SettingsString
      break
    case SETTING_TYPES.RANGE:
      setting = {
        type: SETTING_TYPES.RANGE,
        value: setting.value,
        label: setting.label,
        min: setting.min,
        max: setting.max,
        step: setting.step || 1,
        description: setting.description || ''
      } as SettingsRange
      break
    case SETTING_TYPES.RANKED:
      setting = {
        type: SETTING_TYPES.RANKED,
        value: setting.value,
        label: setting.label,
        description: setting.description || '',
        options: setting.options
      } as SettingsRanked
      break
    case SETTING_TYPES.LIST:
      setting = {
        type: SETTING_TYPES.LIST,
        value: setting.value,
        label: setting.label,
        unique: setting.unique,
        orderable: setting.orderable,
        placeholder: setting.placeholder,
        maxValues: setting.maxValues,
        description: setting.description || '',
        options: setting.options || []
      } as SettingsList
      break
    case SETTING_TYPES.COLOR:
      setting = {
        type: SETTING_TYPES.COLOR,
        value: setting.value,
        label: setting.label,
        description: setting.description || ''
      } as SettingsColor
      break
    default:
      throw new Error(`[isValidSetting] Unknown setting type: ${setting}`)
  }
  return setting as SettingsType
}

export const isValidAppSettings: (
  appSettings: Partial<AppSettings>
) => asserts appSettings is AppSettings = (appSettings) => {
  if (typeof appSettings !== 'object') {
    throw new Error('[sanitizeAppSettings] App settings must be an object')
  }
  Object.entries(appSettings).forEach(([key, setting]) => {
    if (typeof setting !== 'object') {
      throw new Error('[sanitizeAppSettings] App settings must be an object')
    }
    try {
      isValidSettings(setting)
    } catch (error) {
      Logger.error(`[sanitizeAppSettings] Setting ${key} was unable to be validated`)
      throw error
    }
  })
}

/**
 * @throws Error when not a structure
 * @param apps - The AppData
 * */
export const verifyAppInstanceStructure: (
  apps?: unknown | AppData | LegacyAppData
) => asserts apps is AppData = (apps) => {
  if (!apps) throw new Error('[verifyAppInstanceStructure] Apps do not exist or is not defined')
  if (typeof apps != 'object') throw new Error('[verifyAppInstanceStructure] Apps is not an object')

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
        handleError(error, `[verifyAppDataStructure]: App ${appId} had issue being verified`)
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
      throw new Error('App does not have a name! ' + JSON.stringify(app))
    }
  }

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
  const currentMetaVersion = '0.11.0' // find a better way to do this

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
  const getTags = (): TagTypes[] => {
    return [
      ...(manifestData?.tags || []),
      ...(manifestData?.isAudioSource ? [TagTypes.AUDIO_SOURCE] : []),
      ...(manifestData?.isScreenSaver ? [TagTypes.SCREEN_SAVER] : []),
      ...(manifestData?.isWebApp ? [TagTypes.WEB_APP_ONLY] : []),
      ...(manifestData?.isLocalApp ? [TagTypes.UTILITY_ONLY] : [])
    ]
  }

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
    tags: getTags(),
    requiredVersions: {
      client: manifestData?.requiredVersions?.client || '>=0.0.0',
      server: manifestData?.requiredVersions?.server || '>=0.0.0'
    },
    postinstall: manifestData?.postinstall || false,
    postinstall_message: manifestData?.postinstall_message || '',
    postinstall_script: manifestData?.postinstall_script || 'postinstall.js',
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

export const validateSha512 = async (
  zipLocation: string,
  app?: AppReleaseSingleMeta
): Promise<boolean> => {
  if (!app) {
    Logger.warn(`Could not find release for app ${zipLocation}`, {
      source: 'validateSha512'
    })
    return false
  }
  const { createHash } = await import('crypto')
  const { readFileSync } = await import('node:fs')

  Logger.debug(`Validating the checksum for ${app.id}`, {
    source: 'validateSha512'
  })

  if (app.hash.length === 0) {
    Logger.warn(`Could not find release for app ${app.id}`, {
      source: 'validateSha512'
    })
    return false
  }

  try {
    statSync(zipLocation)
  } catch (err) {
    Logger.error(`File not found or not readable: ${zipLocation}`, {
      source: 'validateSha512',
      error: err as Error
    })
    return false
  }

  try {
    const fileBuffer = readFileSync(zipLocation)
    const hashSum = createHash('sha512')
    hashSum.update(fileBuffer)
    const fileHash = hashSum.digest('hex')

    Logger.info(`Validated checksum for ${app.id}. Result is ${fileHash === app.hash}`, {
      source: 'validateSha512'
    })
    Logger.debug(`Expected hash: ${app.hash}`, {
      source: 'validateSha512'
    })
    Logger.debug(`Calculated hash: ${fileHash}`, {
      source: 'validateSha512'
    })

    return fileHash === app.hash
  } catch (err) {
    Logger.warn(`Could not validate hash for package file`, {
      source: 'validateSha512',
      error: err as Error
    })
    return false
  }
}
