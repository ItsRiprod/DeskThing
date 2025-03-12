import Logger from '@server/utils/logger'
import { Action, ActionReference, EventMode, Key, LOGGING_LEVELS } from '@DeskThing/types'
import { ButtonMapping, MappingFileStructure, Profile, LoggingOptions } from '@shared/types'

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

export const isValidMappingStructure = async (structure: unknown): Promise<void> => {
  if (!structure) throw new Error('Mapping structure is undefined')
  if (typeof structure !== 'object') {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateMappingStructure: Structure is not an object!')
    throw new Error('Structure must be an object')
  }
  const structObj = structure as MappingFileStructure
  if (!('version' in structure)) {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateMappingStructure: Version is not defined!')
    throw new Error('Version must be defined')
  }
  if (typeof structure.version !== 'string') {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateMappingStructure: Version is not a string!')
    throw new Error('Version must be a string')
  }
  if (typeof structObj.profiles['default'] !== 'object') {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateMappingStructure: Default is not an object!')
    throw new Error('Default profile must be an object')
  }

  await Promise.all(
    Object.values(structObj.profiles).map(async (profile) => {
      try {
        isValidProfile(profile)
      } catch (error) {
        Logger.log(
          LOGGING_LEVELS.ERROR,
          `validateMappingStructure: ${profile.id} is not a valid button mapping!`
        )
        throw error
      }
    })
  )

  if (!Array.isArray(structObj.actions)) {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateMappingStructure: Actions is not an array!')
    throw new Error('Actions must be an array')
  }

  for (let index = 0; index < structObj.actions.length; index++) {
    const action = structObj.actions[index]
    try {
      isValidAction(action)
    } catch (error) {
      Logger.log(
        LOGGING_LEVELS.ERROR,
        `validateMappingStructure: Action ${String(action)} is not a valid action!`
      )
      throw error
    }
  }

  if (!Array.isArray(structObj.keys)) {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateMappingStructure: Keys is not an array!')
    throw new Error('Keys must be an array')
  }

  for (let index = 0; index < structObj.keys.length; index++) {
    const key = structObj.keys[index]
    try {
      isValidKey(key)
    } catch (error) {
      Logger.log(
        LOGGING_LEVELS.ERROR,
        `validateMappingStructure: Key ${String(key)} is not a valid key!`
      )
      throw error
    }
  }
}

export const isValidFileStructure: (
  structure: MappingFileStructure | unknown
) => asserts structure is MappingFileStructure = (structure: unknown) => {
  if (!structure) throw new Error('Mapping structure is undefined')
  if (typeof structure !== 'object' || structure === null)
    throw new Error('Mapping structure is not an object')
  if (!('version' in structure)) {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateFileStructure: Version is not defined!')
    throw new Error('Version must be defined')
  }
  if (typeof structure.version !== 'string') {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateFileStructure: Version is not a string!')
    throw new Error('Version must be a string')
  }

  if (!('profiles' in structure)) {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateFileStructure: Profiles is not defined!')
    throw new Error('Profiles must be defined')
  }

  if (
    typeof structure.profiles !== 'object' ||
    structure.profiles === null ||
    Array.isArray(structure.profiles)
  ) {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateFileStructure: Profiles is not an object!')
    throw new Error('Profiles must be an object')
  } else {
    Object.values(structure.profiles).forEach((profile) => {
      try {
        isValidProfile(profile)
      } catch (error) {
        Logger.log(
          LOGGING_LEVELS.ERROR,
          `validateFileStructure: ${profile.id} is not a valid button mapping!`
        )
        throw error
      }
    })
  }
  if (Object.keys(structure.profiles).length === 0) {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateFileStructure: There are no available profiles!')
    throw new Error('Must have at least one profile')
  }

  if (!('actions' in structure)) {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateFileStructure: Actions is not defined!')
    throw new Error('Actions must be defined')
  }

  if (!Array.isArray(structure.actions)) {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateFileStructure: Actions is not an array!')
    throw new Error('Actions must be an array')
  }

  for (let index = 0; index < structure.actions.length; index++) {
    const action = structure.actions[index]
    try {
      isValidAction(action)
    } catch (error) {
      Logger.log(
        LOGGING_LEVELS.ERROR,
        `validateFileStructure: Action ${String(action)} is not a valid action!`
      )
      throw error
    }
  }

  if (!('keys' in structure)) {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateFileStructure: Keys is not defined!')
    throw new Error('Keys must be defined')
  }

  if (!Array.isArray(structure.keys)) {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateFileStructure: Keys is not an array!')
    throw new Error('Keys must be an array')
  }

  for (let index = 0; index < structure.keys.length; index++) {
    const key = structure.keys[index]
    try {
      isValidKey(key)
    } catch (error) {
      Logger.log(
        LOGGING_LEVELS.ERROR,
        `validateFileStructure: Key ${String(key)} is not a valid key!`
      )
      throw error
    }
  }
}

export const isValidProfile: (profile: unknown) => asserts profile is Profile = (
  profile: unknown
) => {
  if (!profile) throw new Error('Profile is undefined')
  if (typeof profile !== 'object') throw new Error('Profile is not an object')
  if (!('id' in profile)) {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateProfile: Id is not defined!')
    throw new Error('Id must be defined')
  }
  if (typeof profile.id !== 'string') {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateProfile: Id is not a string!')
    throw new Error('Id must be a string')
  }
  if (!('version' in profile)) {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateProfile: Name is not defined!')
    throw new Error('Name must be defined')
  }
  if (typeof profile.version !== 'string') {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateProfile: Name is not a string!')
    throw new Error('Name must be a string')
  }
}
export const isValidButtonMapping: (mapping: unknown) => asserts mapping is ButtonMapping = (
  mapping: unknown
): void => {
  isValidProfile(mapping)

  if (!('mapping' in mapping)) {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateProfile: Mapping is not defined!')
    throw new Error('Mapping must be defined')
  }
  if (typeof mapping.mapping !== 'object') {
    Logger.log(LOGGING_LEVELS.ERROR, 'validateProfile: Mapping is not an object!')
    throw new Error('Mapping must be an object')
  }

  const maps = mapping as ButtonMapping

  for (const [key, modes] of Object.entries(maps.mapping)) {
    if (typeof key !== 'string') {
      Logger.log(LOGGING_LEVELS.ERROR, 'validateProfile: Key is not a string!')
      throw new Error('Key must be a string')
    }
    if (typeof modes !== 'object') {
      Logger.log(LOGGING_LEVELS.ERROR, 'validateProfile: modes is not an object!')
      throw new Error('Modes must be an object')
    }

    for (const [Mode, action] of Object.entries(modes)) {
      if (!Object.values(EventMode).includes(Number(Mode))) {
        Logger.log(LOGGING_LEVELS.ERROR, `validateProfile: ${Mode} is not a valid mode`)
        throw new Error(`Invalid mode: ${Mode}`)
      }
      try {
        isValidActionReference(action)
      } catch (error) {
        Logger.log(LOGGING_LEVELS.ERROR, `validateProfile: ${String(action)} is not a valid action`)
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
      LOGGING_LEVELS.WARN,
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
