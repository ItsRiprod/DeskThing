console.log('[MapUtil Service] Starting')
import Logger from '@server/utils/logger'
import {
  Action,
  ActionReference,
  ButtonMapping,
  EventMode,
  Key,
  LoggingOptions,
  MappingFileStructure,
  MappingStructure,
  MESSAGE_TYPES
} from '@shared/types'
import { getAppFilePath } from '../apps'

export const validMappingExists: (
  mapping: MappingFileStructure | unknown,
  error?: string,
  options?: LoggingOptions
) => asserts mapping is MappingFileStructure = (mapping) => {
  if (mapping) {
    return isValidFileStructure(mapping)
  } else {
    throw new Error('[validMappingExists] No mapping found')
  }
}
export const isValidMappingStructure = async (structure: MappingStructure): Promise<void> => {
  if (typeof structure.version !== 'string') {
    Logger.log(MESSAGE_TYPES.ERROR, 'validateMappingStructure: Version is not a string!')
    throw new Error('Version must be a string')
  }
  if (typeof structure.profiles.default !== 'object') {
    Logger.log(MESSAGE_TYPES.ERROR, 'validateMappingStructure: Default is not an object!')
    throw new Error('Default profile must be an object')
  }

  await Promise.all(
    Object.values(structure.profiles).map(async (profile) => {
      try {
        isValidButtonMapping(profile)
      } catch (error) {
        Logger.log(
          MESSAGE_TYPES.ERROR,
          `validateMappingStructure: ${profile.id} is not a valid button mapping!`
        )
        throw error
      }
    })
  )

  if (!Array.isArray(structure.actions)) {
    Logger.log(MESSAGE_TYPES.ERROR, 'validateMappingStructure: Actions is not an array!')
    throw new Error('Actions must be an array')
  }

  for (let index = 0; index < structure.actions.length; index++) {
    const action = structure.actions[index]
    try {
      isValidAction(action)
    } catch (error) {
      Logger.log(
        MESSAGE_TYPES.ERROR,
        `validateMappingStructure: Action ${String(action)} is not a valid action!`
      )
      throw error
    }
  }

  if (!Array.isArray(structure.keys)) {
    Logger.log(MESSAGE_TYPES.ERROR, 'validateMappingStructure: Keys is not an array!')
    throw new Error('Keys must be an array')
  }

  for (let index = 0; index < structure.keys.length; index++) {
    const key = structure.keys[index]
    try {
      isValidKey(key)
    } catch (error) {
      Logger.log(
        MESSAGE_TYPES.ERROR,
        `validateMappingStructure: Key ${String(key)} is not a valid key!`
      )
      throw error
    }
  }
}

export const isValidFileStructure: (
  structure: MappingFileStructure | unknown
) => asserts structure is MappingFileStructure = (structure) => {
  if (!structure) throw new Error('Mapping structure is undefined')
  if (typeof structure !== 'object') throw new Error('Mapping structure is not an object')
  if (!('version' in structure)) {
    Logger.log(MESSAGE_TYPES.ERROR, 'validateFileStructure: Version is not defined!')
    throw new Error('Version must be defined')
  }
  if (typeof structure.version !== 'string') {
    Logger.log(MESSAGE_TYPES.ERROR, 'validateFileStructure: Version is not a string!')
    throw new Error('Version must be a string')
  }

  if (!('profiles' in structure)) {
    Logger.log(MESSAGE_TYPES.ERROR, 'validateFileStructure: Profiles is not defined!')
    throw new Error('Profiles must be defined')
  }

  if (!Array.isArray(structure.profiles)) {
    Logger.log(MESSAGE_TYPES.ERROR, 'validateFileStructure: Profiles is not an array!')
    throw new Error('Profiles must be an object')
  }

  if (structure.profiles.length == 0) {
    Logger.log(MESSAGE_TYPES.ERROR, 'validateFileStructure: There are no available profiles!')
    throw new Error('Must have at least one profile')
  }

  if (!('actions' in structure)) {
    Logger.log(MESSAGE_TYPES.ERROR, 'validateFileStructure: Actions is not defined!')
    throw new Error('Actions must be defined')
  }

  if (!Array.isArray(structure.actions)) {
    Logger.log(MESSAGE_TYPES.ERROR, 'validateFileStructure: Actions is not an array!')
    throw new Error('Actions must be an array')
  }

  for (let index = 0; index < structure.actions.length; index++) {
    const action = structure.actions[index]
    try {
      isValidAction(action)
    } catch (error) {
      Logger.log(
        MESSAGE_TYPES.ERROR,
        `validateFileStructure: Action ${String(action)} is not a valid action!`
      )
      throw error
    }
  }

  if (!('keys' in structure)) {
    Logger.log(MESSAGE_TYPES.ERROR, 'validateFileStructure: Keys is not defined!')
    throw new Error('Keys must be defined')
  }

  if (!Array.isArray(structure.keys)) {
    Logger.log(MESSAGE_TYPES.ERROR, 'validateFileStructure: Keys is not an array!')
    throw new Error('Keys must be an array')
  }

  for (let index = 0; index < structure.keys.length; index++) {
    const key = structure.keys[index]
    try {
      isValidKey(key)
    } catch (error) {
      Logger.log(
        MESSAGE_TYPES.ERROR,
        `validateFileStructure: Key ${String(key)} is not a valid key!`
      )
      throw error
    }
  }
}

export const isValidButtonMapping = (mapping: ButtonMapping): void => {
  for (const [key, modes] of Object.entries(mapping.mapping)) {
    if (typeof key !== 'string') {
      Logger.log(MESSAGE_TYPES.ERROR, 'validateProfile: Key is not a string!')
      throw new Error('Key must be a string')
    }
    if (typeof modes !== 'object') {
      Logger.log(MESSAGE_TYPES.ERROR, 'validateProfile: modes is not an object!')
      throw new Error('Modes must be an object')
    }

    for (const [Mode, action] of Object.entries(modes)) {
      if (!Object.values(EventMode).includes(Number(Mode))) {
        Logger.log(MESSAGE_TYPES.ERROR, `validateProfile: ${Mode} is not a valid mode`)
        throw new Error(`Invalid mode: ${Mode}`)
      }
      try {
        isValidActionReference(action)
      } catch (error) {
        Logger.log(MESSAGE_TYPES.ERROR, `validateProfile: ${String(action)} is not a valid action`)
        throw error
      }
    }
  }
}

/**
 * Validates the required fields of an action
 * @param action - The action to validate
 * @throws Error if any required field is missing or invalid
 */
export const isValidAction: (action: unknown) => asserts action is Action = (action) => {
  if (!action || typeof action !== 'object') throw new Error('Action must be an object')
  const actionObj = action as Action
  if (typeof actionObj.id !== 'string') throw new Error('Action id must be a string')
  if (typeof actionObj.source !== 'string') throw new Error('Action source must be a string')

  if (typeof actionObj.version !== 'string') {
    actionObj.version = '0.0.0' // Default version
    console.warn('WARNING_MISSING_ACTION_VERSION')
  }

  if (typeof actionObj.enabled !== 'boolean') {
    actionObj.enabled = true // Default to enabled
    console.warn('WARNING_MISSING_ACTION_ENABLED')
  }
}

/**
 * Sanitizes an action by ensuring all required fields have valid values
 * @param action - The action to sanitize
 * @returns The sanitized action
 */
export const sanitizeAction = (action: unknown): Action => {
  const sanitized = action as Action
  if (!action || typeof action !== 'object') throw new Error('Action must be an object')

  sanitized.id = String(sanitized.id || '')
  sanitized.source = String(sanitized.source || '')
  sanitized.version = String(sanitized.version || '0.0.0')
  sanitized.enabled = Boolean(sanitized.enabled ?? true)

  return sanitized
}

/**
 * Validates the required fields of an action reference
 * @param action - The action reference to validate
 * @throws Error if any required field is missing or invalid
 */
export const isValidActionReference: (action: unknown) => asserts action is ActionReference = (
  action
) => {
  if (typeof action !== 'object') {
    throw new Error('Action reference must be an object')
  }
  const actionRef = action as ActionReference
  if (typeof actionRef.id !== 'string') {
    throw new Error('Action reference id must be a string')
  }
  if (typeof actionRef.source !== 'string') {
    throw new Error('Action reference source must be a string')
  }

  if (typeof actionRef.enabled !== 'boolean') {
    actionRef.enabled = true // Default to enabled
    Logger.log(
      MESSAGE_TYPES.WARNING,
      `validateActionReference: enabled was not set to a boolean value`
    )
  }
}

/**
 * Sanitizes an action reference by ensuring all required fields have valid values
 * @param action - The action reference to sanitize
 * @returns The sanitized action reference
 */
export const sanitizeActionReference = (action: unknown): ActionReference => {
  const sanitized = action as ActionReference
  if (!action || typeof action !== 'object') throw new Error('Action reference must be an object')

  sanitized.id = String(sanitized.id || '')
  sanitized.source = String(sanitized.source || '')
  sanitized.enabled = Boolean(sanitized.enabled ?? true)

  return sanitized
}

/**
 * Validates the required fields of a key
 * @param key - The key to validate
 * @throws Error if any required field is missing or invalid
 */
export const isValidKey: (key: unknown) => asserts key is Key = (key) => {
  if (!key || typeof key !== 'object') throw new Error('Key must be an object')
  const keyObj = key as Record<string, unknown>
  if (typeof keyObj.id !== 'string') throw new Error('Key id must be a string')
  if (typeof keyObj.source !== 'string') throw new Error('Key source must be a string')
  if (typeof keyObj.version !== 'string') throw new Error('Key version must be a string')
  if (typeof keyObj.enabled !== 'boolean') throw new Error('Key enabled must be a boolean')
  if (!Array.isArray(keyObj.modes)) throw new Error('Key modes must be an array')
  if (!keyObj.modes.every((Mode) => Object.values(EventMode).includes(Mode))) {
    throw new Error('Key modes must all be valid EventMode values')
  }
}
export const FetchIcon = async (action: Action): Promise<string | null> => {
  if (!action) return null
  const { app } = require('electron')
  const fs = require('fs').promises
  const path = require('path')

  try {
    const iconPath =
      action.source === 'server'
        ? path.join(app.getPath('userData'), 'webapp', 'icons', `${action.icon || action.id}.svg`)
        : path.join(getAppFilePath(action.source), 'icons', `${action.icon || action.id}.svg`)

    return await fs.readFile(iconPath, 'utf8')
  } catch (error) {
    return null
  }
}

export const ConstructActionReference = ({
  id,
  source,
  value,
  enabled
}: Action): ActionReference => ({
  id,
  source,
  value,
  enabled
})
