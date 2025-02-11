console.log('[AppUtils Service] Starting')
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
  SettingsType
} from '@deskthing/types'
import { join } from 'path'
import { existsSync, promises } from 'node:fs'
import Logger from '@server/utils/logger'
import { app } from 'electron'
import { constructManifest } from '../files/appServiceUtils'

/**
 * Retrieves and parses the manifest file for an app.
 * This function should be used when loading or updating app information.
 * It reads the manifest file from the specified location and returns the parsed JSON data.
 *
 * @param fileLocation The file path of the manifest file to be read and parsed
 * @returns The parsed manifest data as a JavaScript object
 */
export const getManifest = async (fileLocation: string): Promise<AppManifest | undefined> => {
  try {
    Logger.info('[getManifest] Getting manifest for app')
    const manifestPath = join(fileLocation, 'manifest.json')
    if (!existsSync(manifestPath)) {
      throw new Error('manifest.json not found after extraction')
    }

    const manifest = await promises.readFile(manifestPath, 'utf8')
    const parsedManifest = JSON.parse(manifest)

    const returnData: AppManifest = constructManifest(parsedManifest)
    Logger.info('[getManifest] Successfully got manifest for app')
    return returnData
  } catch (error) {
    console.error(`Error getting manifest from ${fileLocation}`, error)
    return undefined
  }
}

/**
 * Retrieves the file path of a specified app.
 *
 * @param {string} appName - The name of the app.
 * @param {string} fileName - The name of the file to retrieve.
 * @returns {string} - The full file path of the specified file within the app's directory.
 */
export function getAppFilePath(appName: string, fileName: string = '/'): string {
  let path
  if (appName == 'developer-app') {
    Logger.log(LOGGING_LEVELS.ERROR, 'Developer app does not exist!')
  } else {
    path = join(app.getPath('userData'), 'apps', appName, fileName)
  }
  return path
}

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
