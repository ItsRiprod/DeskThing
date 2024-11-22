import { defaultData } from '../static/defaultMapping'
import {
  Action,
  ButtonMapping,
  MESSAGE_TYPES,
  EventMode,
  Key,
  MappingStructure
} from '@shared/types'
import loggingStore from '../stores/loggingStore'
import {
  readFromFile,
  readFromGlobalFile,
  writeToFile,
  writeToGlobalFile
} from '../utils/fileHandler'
import { deepMerge } from '../utils/objectUtils'

export class MappingState {
  private _mappings: MappingStructure
  private static instance: MappingState

  constructor() {
    this._mappings = this.mappings
  }

  static getInstance(): MappingState {
    if (!this.instance) {
      this.instance = new MappingState()
    }
    return this.instance
  }

  /**
   * Gets the mappings from the file if they dont exist in cache
   */
  get mappings(): MappingStructure {
    if (!this._mappings) {
      this._mappings = this.loadMappings()
    }

    return this._mappings
  }

  /**
   * Sets the mappings and saves them to the file
   */
  set mappings(value: MappingStructure) {
    this._mappings = value
    this.saveMappings(value)
  }

  /**
   * This needs to be reviewed
   * @returns
   */
  private loadMappings(): MappingStructure {
    const data = readFromFile('mappings.json') as MappingStructure
    if (!data || data?.version !== defaultData.version) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: Mappings file is corrupt or does not exist, using default`
      )
      writeToFile(defaultData, 'mappings.json')
      return defaultData
    }
    const parsedData = data as MappingStructure
    if (!this.isValidFileStructure(parsedData)) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: Mappings file is corrupt, resetting to default`
      )
      writeToFile(defaultData, 'mappings.json')
      return defaultData
    }
    return parsedData
  }

  private async saveMappings(mapping: MappingStructure): Promise<void> {
    if (this.isValidFileStructure(mapping)) {
      writeToFile(mapping, 'mappings.json')
    } else {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: New Mappings file is corrupt, resetting to default`
      )
      writeToFile(defaultData, 'mappings.json')
    }
  }

  /**
   * This needs to be reviewed
   * @returns
   */
  isValidFileStructure = (structure: MappingStructure): boolean => {
    if (typeof structure.version !== 'string') return false
    if (typeof structure.profiles.default !== 'object') return false
    if (!this.isValidButtonMapping(structure.profiles.default)) return false

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
  /**
   * This needs to be reviewed
   * @returns
   */
  isValidButtonMapping = (mapping: ButtonMapping): boolean => {
    try {
      for (const [key, Modes] of Object.entries(mapping.mapping)) {
        if (typeof key !== 'string') return false
        if (typeof Modes !== 'object') return false

        for (const [Mode, action] of Object.entries(Modes)) {
          if (!Object.values(EventMode).includes(Number(Mode))) {
            return false
          }
          if (
            !action ||
            typeof action !== 'object' ||
            !action.name ||
            !action.id ||
            !action.description ||
            !action.source
          ) {
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
  isValidAction = (action: Action): boolean => {
    if (typeof action !== 'object') return false
    if (typeof action.id !== 'string') return false
    if (typeof action.source !== 'string') return false

    if (typeof action.version !== 'string') {
      action.version = this._mappings.version || '0.0.0' // Default version
      console.warn('WARNING_MISSING_ACTION_VERSION')
    }

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
  private isValidKey(key: Key): boolean {
    return (
      typeof key.id === 'string' &&
      typeof key.source === 'string' &&
      typeof key.version === 'string' &&
      typeof key.enabled === 'boolean' &&
      Array.isArray(key.Modes) &&
      key.Modes.every((Mode) => Object.values(EventMode).includes(Mode))
    )
  }

  /**
   *  ---------------------------- \
   *  |     MAPPING FUNCTIONS     |
   *  ---------------------------- /
   */

  /**
   * adds a new button mapping to the mapping structure. If the key already exists, it will update the mapping.
   * @param DynamicAction2 - the button to add
   * @param key - The key to map the button to
   * @param Mode - default is 'onPress'
   * @param profile - default is 'default'
   */
  addButton = async (
    action: Action,
    key: string,
    Mode: EventMode,
    profile: string = 'default'
  ): Promise<void> => {
    const mappings = this.mappings
    if (!mappings[profile]) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: Profile ${profile} does not exist! Create a new profile with the name ${profile} and try again`
      )
    }
    // Ensuring the key exists in the mapping
    if (!mappings[profile][key]) {
      mappings[profile][key] = {}
    }
    // Ensure that the structure of the button is valid
    if (!this.isValidAction(action)) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: Action ${action.id} is invalid, cannot add to mapping`
      )
      return
    }

    // Adding the button to the mapping
    mappings[profile][key][Mode] = action

    // Save the mappings to file
    this.mappings = mappings
  }

  /**
   * Removes a button mapping from the mapping structure.
   * @param key - The key to remove the button from
   * @param Mode - The Mode of the button to remove. Default removes all Modes
   * @param profile - default is 'default'
   */
  removeButton = async (
    key: string,
    Mode: EventMode | null,
    profile: string = 'default'
  ): Promise<void> => {
    const mappings = this.mappings
    if (!mappings[profile]) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: Profile ${profile} does not exist! Create a new profile with the name ${profile} and try again`
      )
      return
    }
    // Ensuring the key exists in the mapping
    if (!mappings[profile][key]) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: Key ${key} does not exist in profile ${profile}!`
      )
      return
    }

    if (Mode === null) {
      // Remove the entire key
      delete mappings[profile][key]
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `MAPHANDLER: Key ${key} removed from profile ${profile}`
      )
    } else {
      // Ensure that the Mode exists in the mapping
      if (!mappings[profile][key][Mode]) {
        loggingStore.log(
          MESSAGE_TYPES.ERROR,
          `MAPHANDLER: Mode ${Mode} does not exist in key ${key} in profile ${profile}!`
        )
      } else {
        // Removing the button from the mapping
        delete mappings[profile][key][Mode]
      }
    }

    // Save the mappings to file
    this.mappings = mappings
    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `MAPHANDLER: Button ${key} removed from profile ${profile}`
    )
  }

  addKey = async (key: Key): Promise<void> => {
    const mappings = this.mappings
    // Validate key structure
    if (!this.isValidKey(key)) {
      loggingStore.log(MESSAGE_TYPES.ERROR, `MAPHANDLER: Invalid key structure`)
      return
    }
    // Check if the key already exists
    const existingKeyIndex = mappings.keys.findIndex((k) => k.id === key.id)
    if (existingKeyIndex !== -1) {
      // Replace the existing key
      mappings.keys[existingKeyIndex] = key
      loggingStore.log(MESSAGE_TYPES.LOGGING, `MAPHANDLER: Key ${key.id} updated`)
    } else {
      // Add the new key
      mappings.keys.push(key)
      loggingStore.log(MESSAGE_TYPES.LOGGING, `MAPHANDLER: Key ${key.id} added`)
    }
    // Save the mappings
    this.mappings = mappings
  }

  removeKey = async (keyId: string): Promise<void> => {
    const mappings = this.mappings
    // Find the index of the key to remove
    const keyIndex = mappings.keys.findIndex((key) => key.id === keyId)
    if (keyIndex !== -1) {
      // Remove the key
      mappings.keys.splice(keyIndex, 1)
      loggingStore.log(MESSAGE_TYPES.LOGGING, `MAPHANDLER: Key ${keyId} removed`)
    } else {
      loggingStore.log(MESSAGE_TYPES.ERROR, `MAPHANDLER: Key ${keyId} not found`)
    }
    // Save the mappings
    this.mappings = mappings
  }

  keyExists = (keyId: string): boolean => {
    const mappings = this.mappings
    return mappings.keys.some((key) => key.id === keyId)
  }

  addAction = async (action: Action): Promise<void> => {
    const mappings = this.mappings
    // Validate action structure
    if (!this.isValidAction(action)) {
      loggingStore.log(MESSAGE_TYPES.ERROR, `MAPHANDLER: Invalid action structure`)
      return
    }
    // Check if the action already exists
    const existingActionIndex = mappings.actions.findIndex((a) => a.id === action.id)
    if (existingActionIndex !== -1) {
      // Replace the existing action
      mappings.actions[existingActionIndex] = action
      loggingStore.log(MESSAGE_TYPES.LOGGING, `MAPHANDLER: Action ${action.id} updated`)
    } else {
      // Add the new action
      mappings.actions.push(action)
      loggingStore.log(MESSAGE_TYPES.LOGGING, `MAPHANDLER: Action ${action.id} added`)
    }
    // Save the mappings
    this.mappings = mappings
  }

  removeAction = async (actionId: string): Promise<void> => {
    const mappings = this.mappings
    // Find the index of the action to remove
    const actionIndex = mappings.actions.findIndex((action) => action.id === actionId)
    if (actionIndex !== -1) {
      // Remove the action
      mappings.actions.splice(actionIndex, 1)
      loggingStore.log(MESSAGE_TYPES.LOGGING, `MAPHANDLER: Action ${actionId} removed`)
    } else {
      loggingStore.log(MESSAGE_TYPES.ERROR, `MAPHANDLER: Action ${actionId} not found`)
    }
    // Save the mappings
    this.mappings = mappings
  }

  actionExists = (actionId: string): boolean => {
    const mappings = this.mappings
    return mappings.actions.some((action) => action.id === actionId)
  }

  /**
   * Removes a source to the mappings. Will disable all actions that use the source.
   * @param sourceId - The ID of the source to remove.
   */
  removeSource = (sourceId: string): void => {
    const mappings = this.mappings

    // Update all profiles
    Object.values(mappings.profiles).forEach((profile) => {
      // Update nested actions
      Object.values(profile.mapping).forEach((buttonMappings) => {
        Object.values(buttonMappings).forEach((action) => {
          if (action && action.source === sourceId) {
            action.enabled = false
          }
        })
      })
    })
    // Remove global actions with the specified source
    mappings.actions = mappings.actions.filter((action) => action.source !== sourceId)

    // Remove keys with the specified source
    mappings.keys = mappings.keys.filter((key) => key.source !== sourceId)

    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `MAPHANDLER: Actions for source ${sourceId} disabled in all profiles, global actions, and keys`
    )

    // Save the mappings
    this.mappings = mappings
  }

  /**
   * Adds a source from the mappings. Will enable all actions that use the source.
   * @param sourceId - The ID of the source to add.
   */
  addSource = async (sourceId: string): Promise<void> => {
    const mappings = this.mappings

    // Update all profiles
    Object.values(mappings.profiles).forEach((profile) => {
      // Update nested actions
      Object.values(profile.mapping).forEach((buttonMappings) => {
        Object.values(buttonMappings).forEach((action) => {
          if (action && action.source === sourceId) {
            action.enabled = true
          }
        })
      })
    })

    // Update global actions
    mappings.actions.forEach((action) => {
      if (action.source === sourceId) {
        action.enabled = true
      }
    })

    // Update keys
    mappings.keys.forEach((key) => {
      if (key.source === sourceId) {
        key.enabled = true
      }
    })

    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `MAPHANDLER: Actions for source ${sourceId} disabled in all profiles, global actions, and keys`
    )

    // Save the mappings
    this.mappings = mappings
  }

  updateIcon = (actionId: string, icon: string): void => {
    const mappings = this.mappings
    // Find the index of the action to update
    const actionIndex = mappings.actions.findIndex((action) => action.id === actionId)
    if (actionIndex !== -1) {
      // Update the icon
      mappings.actions[actionIndex].icon = icon
      loggingStore.log(MESSAGE_TYPES.LOGGING, `MAPHANDLER: Icon for action ${actionId} updated`)
    } else {
      loggingStore.log(MESSAGE_TYPES.ERROR, `MAPHANDLER: Action ${actionId} not found`)
    }

    // Update the icon for all actions inside the current profile
    const currentMap = mappings.selected_profile
    if (currentMap) {
      const currentMapActions = mappings.profiles[currentMap].mapping
      Object.values(currentMapActions).forEach((buttonModes) => {
        Object.values(buttonModes).forEach((action) => {
          if (action && action.id === actionId) {
            action.icon = icon
          }
        })
      })
    }

    // Save the mappings
    this.mappings = mappings
  }

  getAction = (actionId: string): Action | null => {
    const mappings = this.mappings
    // Find the index of the action to update
    const actionIndex = mappings.actions.findIndex((action) => action.id === actionId)
    if (actionIndex !== -1) {
      // Update the icon
      return mappings.actions[actionIndex]
    } else {
      loggingStore.log(MESSAGE_TYPES.ERROR, `MAPHANDLER: Action ${actionId} not found`)
      return null
    }
  }

  getMapping = (): ButtonMapping => {
    if (!this.mappings.selected_profile) {
      return this.mappings.profiles.default
    }
    return this.mappings.profiles[this.mappings.selected_profile]
  }

  setCurrentProfile = async (profile: string): Promise<void> => {
    if (this.mappings.profiles[profile]) {
      this.mappings.selected_profile = profile
    } else {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: Profile ${profile} does not exist! Create a new profile with the name ${profile} and try again`
      )
    }
  }

  getProfiles = (): string[] => {
    return Object.keys(this.mappings.profiles)
  }

  /**
   * Adds a new profile to the mappings.
   * @param profileName - The unique name of the new profile.
   * @param baseProfile - Optional. The name of an existing profile to clone as the base for the new profile.
   */
  addProfile = async (profileName: string, baseProfile: string = 'default'): Promise<void> => {
    const mappings = this.mappings

    // Check if the profile name already exists
    if (mappings.profiles[profileName]) {
      loggingStore.log(MESSAGE_TYPES.ERROR, `MAPHANDLER: Profile "${profileName}" already exists!`)
      return
    }

    // Ensure the base profile exists
    if (!mappings.profiles[baseProfile]) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: Base profile "${baseProfile}" does not exist!`
      )
      return
    }

    // Clone the base profile to create the new profile
    const baseButtonMapping = mappings.profiles[baseProfile]
    const newButtonMapping: ButtonMapping = {
      version: baseButtonMapping.version,
      id: `${baseButtonMapping.id}_${profileName}`, // Ensure a unique ID
      name: `${profileName}`,
      version_code: baseButtonMapping.version_code,
      description: baseButtonMapping.description,
      trigger_app: baseButtonMapping.trigger_app,
      mapping: JSON.parse(JSON.stringify(baseButtonMapping.mapping)) // Deep clone
    }

    // Add the new profile to the mappings
    mappings.profiles[profileName] = newButtonMapping

    // Optionally, set the new profile as the selected profile
    // mappings.selected_profile = profileName

    // Save the updated mappings
    this.mappings = mappings

    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `MAPHANDLER: Profile "${profileName}" added successfully.`
    )
  }

  /**
   * Removes an existing profile from the mappings.
   * @param profileName - The name of the profile to remove.
   */
  removeProfile = async (profileName: string): Promise<void> => {
    const mappings = this.mappings

    // Prevent removal of the default profile
    if (profileName === 'default') {
      loggingStore.log(MESSAGE_TYPES.ERROR, `MAPHANDLER: The "default" profile cannot be removed.`)
      return
    }

    // Check if the profile exists
    if (!mappings.profiles[profileName]) {
      loggingStore.log(MESSAGE_TYPES.ERROR, `MAPHANDLER: Profile "${profileName}" does not exist!`)
      return
    }

    // Remove the profile
    delete mappings.profiles[profileName]

    // If the removed profile was the selected profile, revert to default
    if (mappings.selected_profile === profileName) {
      mappings.selected_profile = 'default'
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `MAPHANDLER: Selected profile was removed. Reverted to "default" profile.`
      )
    }

    // Save the updated mappings
    this.mappings = mappings

    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `MAPHANDLER: Profile "${profileName}" removed successfully.`
    )
  }

  /**
   * Exports a profile to a file.
   * @param profile - The name of the profile to export.
   * @param filePath - The path where the profile should be saved.
   */
  exportProfile = async (profile: string, filePath: string): Promise<void> => {
    const mappings = this.mappings

    if (!mappings.profiles[profile]) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: Profile ${profile} does not exist! Cannot export.`
      )
      return
    }

    const profileData = mappings.profiles[profile]
    writeToGlobalFile<ButtonMapping>(profileData, filePath)

    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `MAPHANDLER: Profile ${profile} exported to ${filePath}`
    )
  }

  /**
   * Imports a profile from a file and adds it to the mappings.
   * @param filePath - The path to the file containing the profile data.
   * @param profileName - The name to assign to the imported profile.
   */
  importProfile = async (filePath: string, profileName: string): Promise<void> => {
    const mappings = this.mappings

    // Load profile data from the file
    const profileData = readFromGlobalFile<ButtonMapping>(filePath)

    if (!profileData) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: Failed to load profile data from ${filePath}`
      )
      return
    }

    if (!this.isValidButtonMapping(profileData)) {
      loggingStore.log(MESSAGE_TYPES.ERROR, `MAPHANDLER: Invalid profile data in file ${filePath}`)
      return
    }

    // Add the new profile
    mappings.profiles[profileName] = profileData
    this.mappings = mappings

    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `MAPHANDLER: Profile ${profileName} imported from ${filePath}`
    )
  }

  updateProfile = async (
    profileName: string,
    updatedProfile: Partial<ButtonMapping>
  ): Promise<void> => {
    const mappings = this.mappings
    const profile = mappings.profiles[profileName]
    if (!profile) {
      loggingStore.log(MESSAGE_TYPES.ERROR, `MAPHANDLER: Profile ${profileName} does not exist!`)
      return
    }
    // Update the profile with the provided data
    deepMerge(profile, updatedProfile)
    this.mappings = mappings
    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `MAPHANDLER: Profile ${profileName} updated successfully.`
    )
  }
}

export default MappingState.getInstance()
