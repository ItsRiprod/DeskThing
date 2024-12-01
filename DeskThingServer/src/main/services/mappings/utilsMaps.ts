import {
  Action,
  ActionReference,
  ButtonMapping,
  EventMode,
  Key,
  MappingStructure
} from '@shared/types'

export const isValidFileStructure = (structure: MappingStructure): boolean => {
  if (typeof structure.version !== 'string') return false
  if (typeof structure.profiles.default !== 'object') return false
  if (!isValidButtonMapping(structure.profiles.default)) return false

  if (!Array.isArray(structure.actions)) return false
  for (let index = 0; index < structure.actions.length; index++) {
    const func = structure.actions[index]
    if (typeof func !== 'object' || !func.id || !func.source) {
      return false
    }
  }

  if (!Array.isArray(structure.keys)) return false
  for (let index = 0; index < structure.keys.length; index++) {
    const key = structure.keys[index]
    if (typeof key !== 'object' || !key.id || !key.source) {
      return false
    }
  }

  return true
}

export const isValidButtonMapping = (mapping: ButtonMapping): boolean => {
  try {
    for (const [key, Modes] of Object.entries(mapping.mapping)) {
      if (typeof key !== 'string') return false
      if (typeof Modes !== 'object') return false

      for (const [Mode, action] of Object.entries(Modes)) {
        if (!Object.values(EventMode).includes(Number(Mode))) {
          return false
        }
        if (!action || typeof action !== 'object' || !action.id || !action.source) {
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
export const isValidAction = (action: Action): boolean => {
  if (typeof action !== 'object') return false
  if (typeof action.id !== 'string') return false
  if (typeof action.source !== 'string') return false

  if (typeof action.version !== 'string') {
    action.version = '0.0.0' // Default version
    console.warn('WARNING_MISSING_ACTION_VERSION')
  }

  if (typeof action.enabled !== 'boolean') {
    action.enabled = true // Default to enabled
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
  if (typeof action !== 'object') return false
  if (typeof action.id !== 'string') return false
  if (typeof action.source !== 'string') return false

  if (typeof action.enabled !== 'boolean') {
    action.enabled = true // Default to enabled
    console.warn('WARNING_MISSING_ACTION_ENABLED')
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
    Array.isArray(key.Modes) &&
    key.Modes.every((Mode) => Object.values(EventMode).includes(Mode))
  )
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
