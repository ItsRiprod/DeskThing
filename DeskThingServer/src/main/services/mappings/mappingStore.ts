import {
  Action,
  ButtonMapping,
  MESSAGE_TYPES,
  EventMode,
  Key,
  MappingStructure,
  ActionReference
} from '@shared/types'
import loggingStore from '@server/stores/loggingStore'
import { writeToGlobalFile } from '@server/utils/fileHandler'
import { deepMerge } from '@server/utils/objectUtils'
import { importProfile, loadMappings, saveMappings } from './fileMaps'
import {
  ConstructActionReference,
  isValidAction,
  isValidActionReference,
  isValidKey
} from './utilsMaps'
import { sendMessageToApp } from '../apps'

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
      loadMappings().then((mappings) => {
        this._mappings = mappings
      })
    }

    return this._mappings
  }

  /**
   * Sets the mappings and saves them to the file
   */
  set mappings(value: MappingStructure) {
    this._mappings = value
    saveMappings(value)
  }

  /**
   *  ---------------------------- \
   *  |     MAPPING FUNCTIONS     |
   *  ---------------------------- /
   */

  /**
   * adds a new button mapping to the mapping structure. If the key already exists, it will update the mapping.
   * @param actionId - the id of the action to add
   * @param key - The key to map the button to
   * @param Mode - default is 'onPress'
   * @param profile - default is 'default'
   */
  addButton = async (
    actionId: string,
    key: string,
    Mode: EventMode,
    profile: string = 'default'
  ): Promise<void> => {
    const mappingProfile = this.mappings.profiles[profile]
    if (!mappingProfile) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: Profile ${profile} does not exist! Create a new profile with the name ${profile} and try again`
      )
      return
    }

    const mappingKey = this.mappings.keys.find((searchKey) => searchKey.id === key)

    if (!mappingKey?.Modes?.includes(Mode)) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: Key ${key} does not have ${EventMode[Mode]}!`
      )
      return
    }

    const mappingAction = this.mappings.actions.find((searchAction) => searchAction.id == actionId)

    if (!mappingAction) {
      loggingStore.log(MESSAGE_TYPES.ERROR, `MAPHANDLER: Action ${actionId} does not exist!`)
      return
    }

    // Ensuring the key exists in the mapping
    if (!mappingProfile[key]) {
      mappingProfile[key] = {}
    }

    const action = ConstructActionReference(mappingAction)

    // Ensure that the structure of the button is valid
    if (!isValidActionReference(action)) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: Action ${action.id} is invalid, cannot add to mapping`
      )
      return
    }

    // Adding the button to the mapping
    mappingProfile[key][Mode] = action

    // Save the mappings to file
    this.mappings.profiles[profile] = mappingProfile
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
    const mappingsProfile = this.mappings.profiles[profile]
    if (!mappingsProfile) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: Profile ${profile} does not exist! Create a new profile with the name ${profile} and try again`
      )
      return
    }
    // Ensuring the key exists in the mapping
    if (!mappingsProfile[key]) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: Key ${key} does not exist in profile ${profile}!`
      )
      return
    }

    if (Mode === null) {
      // Remove the entire key
      delete mappingsProfile[key]
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `MAPHANDLER: Key ${key} removed from profile ${profile}`
      )
    } else {
      // Ensure that the Mode exists in the mapping
      if (!mappingsProfile[key][Mode]) {
        loggingStore.log(
          MESSAGE_TYPES.ERROR,
          `MAPHANDLER: Mode ${Mode} does not exist in key ${key} in profile ${profile}!`
        )
      } else {
        // Removing the button from the mapping
        delete mappingsProfile[key][Mode]
      }
    }

    // Save the mappings to file
    this.mappings.profiles[profile] = mappingsProfile
    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `MAPHANDLER: Button ${key} removed from profile ${profile}`
    )
  }

  addKey = async (key: Key): Promise<void> => {
    const keys = this.mappings.keys
    // Validate key structure
    if (!isValidKey(key)) {
      loggingStore.log(MESSAGE_TYPES.ERROR, `MAPHANDLER: Invalid key structure`)
      return
    }
    // Check if the key already exists
    const existingKeyIndex = keys.findIndex((k) => k.id === key.id)
    if (existingKeyIndex !== -1) {
      // Replace the existing key
      keys[existingKeyIndex] = key
      loggingStore.log(MESSAGE_TYPES.LOGGING, `MAPHANDLER: Key ${key.id} updated`)
    } else {
      // Add the new key
      keys.push(key)
      loggingStore.log(MESSAGE_TYPES.LOGGING, `MAPHANDLER: Key ${key.id} added`)
    }
    // Save the mappings
    this.mappings.keys = keys
  }

  removeKey = async (keyId: string): Promise<void> => {
    const keys = this.mappings.keys
    // Find the index of the key to remove
    const keyIndex = keys.findIndex((key) => key.id === keyId)
    if (keyIndex !== -1) {
      // Remove the key
      keys.splice(keyIndex, 1)
      loggingStore.log(MESSAGE_TYPES.LOGGING, `MAPHANDLER: Key ${keyId} removed`)
    } else {
      loggingStore.log(MESSAGE_TYPES.ERROR, `MAPHANDLER: Key ${keyId} not found`)
    }
    // Save the mappings
    this.mappings.keys = keys
  }

  keyExists = (keyId: string): boolean => {
    const mappings = this.mappings
    return mappings.keys.some((key) => key.id === keyId)
  }

  actionExists = (actionId: string): boolean => {
    const mappings = this.mappings
    return mappings.actions.some((action) => action.id === actionId)
  }

  addAction = async (action: Action): Promise<void> => {
    const mappings = this.mappings
    // Validate action structure
    if (!isValidAction(action)) {
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

  getActions = (): Action[] | null => {
    const mappings = this.mappings
    return mappings.actions
  }

  getMapping = (): ButtonMapping => {
    if (!this.mappings.selected_profile) {
      return this.mappings.profiles.default
    }
    return this.mappings.profiles[this.mappings.selected_profile]
  }

  getKeys = (): Key[] | null => {
    return this.mappings.keys
  }

  getProfiles(): string[] {
    return Object.keys(this.mappings.profiles)
  }

  getProfile(profile: string): ButtonMapping | null {
    return this.mappings.profiles[profile]
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
    const buttonMapping = await importProfile(filePath, profileName)

    if (buttonMapping) {
      this.mappings.profiles[profileName] = buttonMapping
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `MAPHANDLER: Profile ${profileName} imported from ${filePath}`
      )
    } else {
      loggingStore.log(
        MESSAGE_TYPES.WARNING,
        `MAPSTORE: Profile ${profileName} not found at ${filePath}`
      )
    }
  }

  runAction(action: Action | ActionReference): void {
    if (isValidActionReference(action) && action.enabled) {
      const SocketData = {
        payload: action,
        app: action.source,
        type: 'action'
      }
      sendMessageToApp(action.source, SocketData)
    } else {
      loggingStore.log(MESSAGE_TYPES.ERROR, `MAPHANDLER: Action not found or not enabled!`)
    }
  }

  updateProfile = async (
    profileName: string,
    updatedProfile: Partial<ButtonMapping>
  ): Promise<void> => {
    const profile = this.mappings.profiles[profileName]
    if (!profile) {
      loggingStore.log(MESSAGE_TYPES.ERROR, `MAPHANDLER: Profile ${profileName} does not exist!`)
      return
    }

    // Update the profile with the provided data
    deepMerge(profile, updatedProfile)

    this.mappings.profiles[profileName] = profile
    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `MAPHANDLER: Profile ${profileName} updated successfully.`
    )
  }
}

export default MappingState.getInstance()
