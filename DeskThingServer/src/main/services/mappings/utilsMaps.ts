console.log('[MapUtil Service] Starting')
import loggingStore from '@server/stores/loggingStore'
import {
  Action,
  ActionReference,
  ButtonMapping,
  EventMode,
  Key,
  MappingFileStructure,
  MappingStructure,
  MESSAGE_TYPES
} from '@shared/types'
import { getAppFilePath } from '../apps'

export const isValidMappingStructure = async (structure: MappingStructure): Promise<boolean> => {
  try {
    if (typeof structure.version !== 'string') {
      loggingStore.log(MESSAGE_TYPES.ERROR, 'validateMappingStructure: Version is not a string!')
      return false
    }
    if (typeof structure.profiles.default !== 'object') {
      loggingStore.log(MESSAGE_TYPES.ERROR, 'validateMappingStructure: Default is not an object!')
      return false
    }

    const validProfiles = await Promise.all(
      Object.values(structure.profiles).map((profile) => {
        if (!isValidButtonMapping(profile)) {
          loggingStore.log(
            MESSAGE_TYPES.ERROR,
            `validateMappingStructure: ${profile.id} is not a valid button mapping!`
          )
          return false
        } else {
          return true
        }
      })
    )
    if (validProfiles.includes(false)) return false

    if (!Array.isArray(structure.actions)) {
      loggingStore.log(MESSAGE_TYPES.ERROR, 'validateMappingStructure: Actions is not an array!')
      return false
    }

    for (let index = 0; index < structure.actions.length; index++) {
      const action = structure.actions[index]
      if (!isValidAction(action)) {
        loggingStore.log(
          MESSAGE_TYPES.ERROR,
          `validateMappingStructure: Action ${String(action)} is not a valid action!`
        )
        return false
      }
    }

    if (!Array.isArray(structure.keys)) {
      loggingStore.log(MESSAGE_TYPES.ERROR, 'validateMappingStructure: Keys is not an array!')
      return false
    }

    for (let index = 0; index < structure.keys.length; index++) {
      const key = structure.keys[index]
      if (!isValidKey(key)) {
        loggingStore.log(
          MESSAGE_TYPES.ERROR,
          `validateMappingStructure: Action ${String(key)} is not a valid key!`
        )
        return false
      }
    }

    return true
  } catch (error) {
    if (error instanceof Error) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `validateMappingStructure: Encountered an error validating the structure! ${error.message}`
      )
    } else {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `validateMappingStructure: Encountered an error validating the structure! ${String(error)}`
      )
    }
    return false
  }
}

export const isValidFileStructure = (structure: MappingFileStructure): boolean => {
  try {
    if (typeof structure.version !== 'string') {
      loggingStore.log(MESSAGE_TYPES.ERROR, 'validateFileStructure: Version is not a string!')
      return false
    }

    if (structure.profiles.length == 0) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        'validateFileStructure: There are no available profiles!'
      )
      return false
    }

    if (!Array.isArray(structure.actions)) {
      loggingStore.log(MESSAGE_TYPES.ERROR, 'validateFileStructure: Actions is not an array!')
      return false
    }

    for (let index = 0; index < structure.actions.length; index++) {
      const action = structure.actions[index]
      if (!isValidAction(action)) {
        loggingStore.log(
          MESSAGE_TYPES.ERROR,
          `validateFileStructure: Action ${String(action)} is not a valid action!`
        )
        return false
      }
    }

    if (!Array.isArray(structure.keys)) {
      loggingStore.log(MESSAGE_TYPES.ERROR, 'validateFileStructure: Keys is not an array!')
      return false
    }

    for (let index = 0; index < structure.keys.length; index++) {
      const key = structure.keys[index]
      if (!isValidKey(key)) {
        loggingStore.log(
          MESSAGE_TYPES.ERROR,
          `validateFileStructure: Action ${String(key)} is not a valid key!`
        )
        return false
      }
    }

    return true
  } catch (error) {
    if (error instanceof Error) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `validateFileStructure: Encountered an error validating the structure! ${error.message}`
      )
    } else {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `validateFileStructure: Encountered an error validating the structure! ${String(error)}`
      )
    }
    return false
  }
}

export const isValidButtonMapping = (mapping: ButtonMapping): boolean => {
  try {
    for (const [key, modes] of Object.entries(mapping.mapping)) {
      if (typeof key !== 'string') {
        loggingStore.log(MESSAGE_TYPES.ERROR, 'validateProfile: Key is not a string!')
        return false
      }
      if (typeof modes !== 'object') {
        loggingStore.log(MESSAGE_TYPES.ERROR, 'validateProfile: modes is not an object!')
        return false
      }

      for (const [Mode, action] of Object.entries(modes)) {
        if (!Object.values(EventMode).includes(Number(Mode))) {
          loggingStore.log(MESSAGE_TYPES.ERROR, `validateProfile: ${Mode} is not a valid mode`)
          return false
        }
        if (!isValidActionReference(action)) {
          loggingStore.log(
            MESSAGE_TYPES.ERROR,
            `validateProfile: ${String(action)} is not a valid action`
          )
          return false
        }
      }
    }
    return true
  } catch (error) {
    return false
  }
}

/**
 * Validates the required fields of an action
 * @param action - The action to validate
 * @throws Error if any required field is missing or invalid
 */
export const isValidAction = (action: unknown): boolean => {
  if (!action || typeof action !== 'object') return false
  const actionObj = action as Action
  if (typeof actionObj.id !== 'string') return false
  if (typeof actionObj.source !== 'string') return false

  if (typeof actionObj.version !== 'string') {
    actionObj.version = '0.0.0' // Default version
    console.warn('WARNING_MISSING_ACTION_VERSION')
  }

  if (typeof actionObj.enabled !== 'boolean') {
    actionObj.enabled = true // Default to enabled
    console.warn('WARNING_MISSING_ACTION_ENABLED')
  }

  return true
}
/**
 * Validates the required fields of an action
 * @param action - The action to validate
 * @throws Error if any required field is missing or invalid
 */
export const isValidActionReference = (action: ActionReference): boolean => {
  if (typeof action !== 'object') {
    loggingStore.log(MESSAGE_TYPES.ERROR, `validateActionReference: action is not a valid object`)
    return false
  }
  if (typeof action.id !== 'string') {
    loggingStore.log(MESSAGE_TYPES.ERROR, `validateActionReference: id is not a valid string`)
    return false
  }
  if (typeof action.source !== 'string') {
    loggingStore.log(MESSAGE_TYPES.ERROR, `validateActionReference: source is not a valid string`)
    return false
  }

  if (typeof action.enabled !== 'boolean') {
    action.enabled = true // Default to enabled
    loggingStore.log(
      MESSAGE_TYPES.WARNING,
      `validateActionReference: enabled was not set to a boolean value`
    )
  }

  return true
}

/**
 * Validates the required fields of a key
 * @param key - The key to validate
 * @returns true if the key is valid, false otherwise
 */
export const isValidKey = (key: Key): boolean => {
  return (
    typeof key.id === 'string' &&
    typeof key.source === 'string' &&
    typeof key.version === 'string' &&
    typeof key.enabled === 'boolean' &&
    Array.isArray(key.modes) &&
    key.modes.every((Mode) => Object.values(EventMode).includes(Mode))
  )
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
        : path.join(getAppFilePath(action.source), 'icons', `${action.id}.svg`)

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
