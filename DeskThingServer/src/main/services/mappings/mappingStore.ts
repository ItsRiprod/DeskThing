console.log('[MapStore Service] Starting')
import {
  Action,
  ButtonMapping,
  MESSAGE_TYPES,
  EventMode,
  Key,
  MappingStructure,
  ActionReference,
  Button,
  Profile
} from '@shared/types'
import loggingStore from '@server/stores/loggingStore'
import { writeToGlobalFile } from '@server/utils/fileHandler'
import { deepMerge } from '@server/utils/objectUtils'
import { importProfile, loadMappings, saveMappings } from './fileMaps'
import {
  ConstructActionReference,
  FetchIcon,
  isValidAction,
  isValidActionReference,
  isValidKey
} from './utilsMaps'
import { sendMessageToApp } from '../apps'
import { defaultProfile } from '@server/static/defaultMapping'

type ListeningTypes = 'key' | 'profile' | 'action' | 'update'

type Listener = (data?: Key[] | ButtonMapping | Action[]) => void

export class MappingState {
  private _mappings: MappingStructure
  private static instance: MappingState
  private listeners: Record<ListeningTypes, Set<Listener>> = {
    key: new Set(),
    profile: new Set(),
    action: new Set(),
    update: new Set()
  }

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
    loggingStore.log(MESSAGE_TYPES.DEBUG, `MAPHANDLER: Saving mappings to file`)
    if (value.keys != this._mappings.keys) {
      this.notifyListeners('key', value.keys)
    }
    if (
      value.profiles[value.selected_profile.id] !=
      this._mappings.profiles[this._mappings.selected_profile.id]
    ) {
      this.notifyListeners('profile', value.profiles[value.selected_profile.id])
    }
    if (value.actions != this._mappings.actions) {
      this.notifyListeners('action', value.actions)
    }

    this._mappings = value
    saveMappings(value)
  }

  addListener(type: ListeningTypes, listener: Listener): () => void {
    this.listeners[type].add(listener)
    return () => {
      this.listeners[type].delete(listener)
    }
  }

  removeListener(type: ListeningTypes, listener: Listener): void {
    this.listeners[type].delete(listener)
  }

  private async notifyListeners(
    type: ListeningTypes,
    data?: Key[] | ButtonMapping | Action[]
  ): Promise<void> {
    this.listeners[type].forEach((listener) => listener(data))
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
  addButton = async (button: Button): Promise<void> => {
    const mappingProfile = this.mappings.profiles[button.profile || 'default']
    if (!mappingProfile) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: Profile ${button.profile || 'default'} does not exist! Create a new profile with the name ${button.profile || 'default'} and try again`
      )
      return
    }

    const mappingKey = this.mappings.keys.find((searchKey) => searchKey.id === button.key)

    if (!mappingKey?.modes?.includes(button.mode)) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: Key ${button.key} does not have ${EventMode[button.mode]}!`
      )
      return
    }

    const mappingAction = this.mappings.actions.find(
      (searchAction) => searchAction.id == button.action
    )

    if (!mappingAction) {
      loggingStore.log(MESSAGE_TYPES.ERROR, `MAPHANDLER: Action ${button.action} does not exist!`)
      return
    }

    // Ensuring the key exists in the mapping
    if (!mappingProfile[button.key]) {
      mappingProfile[button.key] = {}
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
    mappingProfile[button.key][button.mode] = action

    // Save the mappings to file
    this.mappings.profiles[button.profile || 'default'] = mappingProfile

    this.notifyListeners('profile', mappingProfile)
    saveMappings(this.mappings)
  }

  /**
   * Removes a button mapping from the mapping structure.
   * @param key - The key to remove the button from
   * @param Mode - The Mode of the button to remove. Default removes all modes
   * @param profile - default is 'default'
   */
  removeButton = async (button: Button): Promise<void> => {
    const mappingsProfile = this.mappings.profiles[button.profile || 'default']
    if (!mappingsProfile) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: Profile ${button.profile || 'default'} does not exist! Create a new profile with the name ${button.profile || 'default'} and try again`
      )
      return
    }
    // Ensuring the key exists in the mapping
    if (!mappingsProfile[button.key]) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: Key ${button.key} does not exist in profile ${button.profile || 'default'}!`
      )
      return
    }

    if (button.mode === null) {
      // Remove the entire key
      delete mappingsProfile[button.key]
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `MAPHANDLER: Key ${button.key} removed from profile ${button.profile || 'default'}`
      )
    } else {
      // Ensure that the Mode exists in the mapping
      if (!mappingsProfile[button.key][button.mode]) {
        loggingStore.log(
          MESSAGE_TYPES.ERROR,
          `MAPHANDLER: Mode ${button.mode} does not exist in key ${button.key} in profile ${button.profile || 'default'}!`
        )
      } else {
        // Removing the button from the mapping
        delete mappingsProfile[button.key][button.mode]
      }
    }

    // Save the mappings to file
    this.mappings.profiles[button.profile || 'default'] = mappingsProfile
    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `MAPHANDLER: Button ${button.key} removed from profile ${button.profile || 'default'}`
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
  }

  removeAction = async (actionId: string): Promise<void> => {
    const mappings = this.mappings

    // Remove the action from global actions
    const actionIndex = mappings.actions.findIndex((action) => action.id === actionId)
    if (actionIndex !== -1) {
      mappings.actions.splice(actionIndex, 1)
      loggingStore.log(MESSAGE_TYPES.LOGGING, `MAPHANDLER: Action ${actionId} removed`)

      // Remove this action from all profile mappings
      Object.values(mappings.profiles).forEach((profile) => {
        Object.keys(profile.mapping).forEach((key) => {
          Object.keys(profile.mapping[key]).forEach((mode) => {
            if (profile.mapping[key][mode]?.id === actionId) {
              profile.mapping[key][mode].enabled = false
            }
          })
        })
      })
    } else {
      loggingStore.log(MESSAGE_TYPES.ERROR, `MAPHANDLER: Action ${actionId} not found`)
    }

    // Save the updated mappings
    this.mappings = mappings
  }

  /**
   * Removes a source to the mappings. Will disable all actions that use the source.
   * @param sourceId - The ID of the source to remove.
   */
  removeSource = (sourceId: string): void => {
    const mappings = this.mappings

    // Update all profiles
    const disableSourceActions = (actionContainer: {
      [key: string]: {
        [Mode in EventMode]?: ActionReference
      }
    }): {
      [key: string]: {
        [Mode in EventMode]?: ActionReference
      }
    } => {
      Object.values(actionContainer).forEach((buttonMappings) => {
        Object.keys(buttonMappings).forEach((mode) => {
          if (buttonMappings[mode]?.source === sourceId) {
            buttonMappings[mode].enabled = false
          }
        })
      })

      return actionContainer
    }

    // Disable actions in all profiles
    Object.values(mappings.profiles).forEach((profile) => {
      profile.mapping = disableSourceActions(profile.mapping)
    })
    // Remove global actions with the specified source
    mappings.actions = mappings.actions.filter((action) => action.source !== sourceId)

    // Remove keys with the specified source
    mappings.keys = mappings.keys.filter((key) => key.source !== sourceId)

    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `MAPHANDLER: Actions for source ${sourceId} disabled in all profiles, global actions, and keys`
    )
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
  }

  updateIcon = (actionId: string, icon: string): void => {
    const action = this.mappings.actions.find((action) => action.id === actionId)
    // Find the index of the action to update
    if (action && action.icon != icon) {
      // Update the icon
      action.icon = icon
      loggingStore.log(MESSAGE_TYPES.LOGGING, `MAPHANDLER: Icon for action ${actionId} updated`)
    }
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
    console.log('Getting map from the profile: ', this.mappings.selected_profile)
    if (!this.mappings.selected_profile) {
      return this.mappings.profiles.default
    }
    return this.mappings.profiles[this.mappings.selected_profile.id]
  }

  getKeys = (): Key[] | null => {
    return this.mappings.keys
  }

  getProfiles(): Profile[] {
    const profiles = Object.values(this.mappings.profiles).map((profile) => ({
      ...profile,
      mapping: null
    }))
    return profiles
  }

  getProfile(profileName: string): ButtonMapping | null {
    return this.mappings.profiles[profileName]
  }

  getCurrentProfile = (): Profile => {
    return this.mappings.selected_profile
  }

  setCurrentProfile = async (profile: Profile): Promise<void> => {
    console.log('Setting profile to: ', profile)
    if (this.mappings.profiles[profile.id]) {
      this.mappings.selected_profile = profile
      this.notifyListeners('update')
      saveMappings(this.mappings)
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
  addProfile = async (profile: Profile): Promise<void> => {
    if (profile.id == 'default') {
      loggingStore.log(MESSAGE_TYPES.WARNING, `MAPHANDLER: Cannot edit the default profile`)
      return
    }

    const mappings = this.mappings

    // Check if the profile name already exists
    if (mappings.profiles[profile.id]) {
      loggingStore.log(
        MESSAGE_TYPES.WARNING,
        `MAPHANDLER: Profile "${profile.id}" already exists! Updating`
      )
      this.updateProfile(profile.id, profile)
      return
    }

    // Ensure the base profile exists
    if (!mappings.profiles[profile.extends || 'default']) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `MAPHANDLER: Base profile "${profile.extends}" does not exist!`
      )
      return
    }

    // Clone the base profile to create the new profile
    const baseButtonMapping = mappings.profiles[profile.extends || 'default']
    const newButtonMapping: ButtonMapping = {
      version: baseButtonMapping.version,
      id: `${profile.id}`, // Ensure a unique ID
      name: `${profile.name || profile.id || 'NewProfile'}`,
      version_code: baseButtonMapping.version_code,
      description: baseButtonMapping.description,
      trigger_app: baseButtonMapping.trigger_app,
      mapping: JSON.parse(JSON.stringify(baseButtonMapping.mapping)) // Deep clone
    }

    // Add the new profile to the mappings
    mappings.profiles[profile.id] = newButtonMapping

    // Optionally, set the new profile as the selected profile
    // mappings.selected_profile = profileName

    // Save the updated mappings
    this.mappings = mappings

    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `MAPHANDLER: Profile "${profile.name}" added successfully.`
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
    if (mappings.selected_profile.id === profileName) {
      mappings.selected_profile = defaultProfile
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

  fetchActionIcon = async (action: Action | ActionReference): Promise<string | null> => {
    if (!isValidAction(action)) {
      const actualAction = this.getAction(action.id)
      return actualAction ? await FetchIcon(actualAction) : null
    } else {
      return await FetchIcon(action as Action)
    }
  }

  fetchKeyIcon = async (key: Key, mode: EventMode): Promise<string | null> => {
    const mapping = this.getMapping()
    const action = mapping.mapping[key.id][mode]

    if (action) {
      return await this.fetchActionIcon(action)
    } else {
      return null
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
    this.notifyListeners('profile', profile)
  }
}

export default MappingState.getInstance()
