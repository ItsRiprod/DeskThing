console.log('[MapStore Service] Starting')
import {
  Action,
  EventMode,
  Key,
  ActionReference,
  ServerEvent,
  EventPayload,
  LOGGING_LEVELS
} from '@DeskThing/types'
import { ButtonMapping, MappingStructure, Button, Profile, CacheableStore } from '@shared/types'
import Logger from '@server/utils/logger'
import { writeToFile } from '@server/services/files/fileService'
import { deepMerge } from '@server/utils/objectUtils'
import { importProfile, loadMappings, saveMappings } from '@server/services/mappings/fileMaps'
import {
  ConstructActionReference,
  FetchIcon,
  isValidAction,
  isValidActionReference,
  isValidKey,
  validMappingExists,
  isValidButtonMapping
} from '@server/services/mappings/utilsMaps'
import { defaultProfile } from '@server/static/defaultMapping'

type ListeningTypes = 'key' | 'profile' | 'action' | 'update'

type Listener = (data?: Key[] | ButtonMapping | Action[]) => void

export class MappingState implements CacheableStore {
  private mappings: MappingStructure | null = null
  private static instance: MappingState
  private listeners: Record<ListeningTypes, Set<Listener>> = {
    key: new Set(),
    profile: new Set(),
    action: new Set(),
    update: new Set()
  }

  constructor() {
    this.fetchMappings()
  }

  /**
   * @implements CacheableStore
   */
  clearCache = async (): Promise<void> => {
    this.mappings = null
  }
  /**
   * @implements CacheableStore
   */
  saveToFile = async (): Promise<void> => {
    await this.saveMapping()
  }

  static getInstance(): MappingState {
    if (!this.instance) {
      this.instance = new MappingState()
    }
    return this.instance
  }

  /**
   * Sets the mappings and saves them to the file
   */
  private async saveMapping(value?: MappingStructure, notify: boolean = true): Promise<void> {
    Logger.log(LOGGING_LEVELS.DEBUG, `[MappingStore]: Saving mappings to file`)
    if (!value && this.mappings) {
      return await saveMappings(this.mappings)
    } else if (!value) {
      Logger.warn(`[MappingStore]: No mappings to save`)
      return
    }

    if (notify && value.keys != this.mappings?.keys) {
      this.notifyListeners('key', value.keys)
    }
    if (
      notify &&
      value.profiles[value.selected_profile.id] !=
        this.mappings?.profiles[this.mappings.selected_profile.id]
    ) {
      this.notifyListeners('profile', value.profiles[value.selected_profile.id])
    }
    if (notify && value.actions != this.mappings?.actions) {
      this.notifyListeners('action', value.actions)
    }

    this.mappings = value
    await saveMappings(value)
  }

  private async getMappings(): Promise<MappingStructure> {
    if (!this.mappings) {
      return await this.fetchMappings()
    }
    return this.mappings
  }

  private async fetchMappings(): Promise<MappingStructure> {
    const mappings = await loadMappings()

    if (!this.mappings) {
      this.mappings = mappings
    } else {
      this.mappings = deepMerge(this.mappings, mappings)
    }

    return mappings
  }

  async setMappings(mappings: MappingStructure): Promise<void> {
    this.mappings = mappings
  }

  /**
   * Adds a listener for the specified listening type and returns a function to remove the listener.
   * @param type - The type of listening event to add the listener for.
   * @param listener - The listener function to add.
   * @returns A function that can be called to remove the listener.
   */
  addListener(type: ListeningTypes, listener: Listener): () => void {
    this.listeners[type].add(listener)
    return () => {
      this.listeners[type].delete(listener)
    }
  }

  /**
   * Removes a listener from the specified listening type.
   * @param type - The type of listening event to remove the listener from.
   * @param listener - The listener function to remove.
   */
  removeListener(type: ListeningTypes, listener: Listener): void {
    this.listeners[type].delete(listener)
  }

  /**
   * Notifies all registered listeners of the specified type with the provided data.
   * @param type - The type of listening event to notify listeners for.
   * @param data - The data to pass to the listener functions.
   */
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
    const mapping = await this.getMappings()
    try {
      validMappingExists(this.mappings)
    } catch (error) {
      Logger.error(`Unable to add button ${button.action}`, {
        function: 'addButton',
        error: error as Error,
        source: 'mappingStore'
      })
      return
    }

    const mappingProfile = mapping.profiles[button.profile || 'default']
    if (!mappingProfile) {
      Logger.log(
        LOGGING_LEVELS.ERROR,
        `[MappingStore]: Profile ${button.profile || 'default'} does not exist! Create a new profile with the name ${button.profile || 'default'} and try again`
      )
      return
    }

    const mappingKey = mapping?.keys.find((searchKey) => searchKey.id === button.key)

    if (!mappingKey?.modes?.includes(button.mode)) {
      Logger.log(
        LOGGING_LEVELS.ERROR,
        `[MappingStore]: Key ${button.key} does not have ${EventMode[button.mode]}!`
      )
      return
    }

    const mappingAction = mapping.actions.find((searchAction) => searchAction.id == button.action)

    if (!mappingAction) {
      Logger.log(LOGGING_LEVELS.ERROR, `[MappingStore]: Action ${button.action} does not exist!`)
      return
    }

    // Ensuring the key exists in the mapping
    if (!mappingProfile[button.key]) {
      mappingProfile[button.key] = {}
    }

    const action = ConstructActionReference(mappingAction)

    try {
      // Ensure that the structure of the button is valid
      isValidActionReference(action)

      // Adding the button to the mapping
      mappingProfile[button.key][button.mode] = action

      // Save the mappings to file
      mapping.profiles[button.profile || 'default'] = mappingProfile

      this.notifyListeners('profile', mappingProfile)
      // Circumvent the listener notification
      await this.saveMapping(mapping, false)
    } catch (error) {
      Logger.error('Unable to verify action reference', {
        function: 'addButton',
        error: error as Error,
        source: 'mappingStore'
      })
    }
  }

  /**
   * Removes a button mapping from the mapping structure.
   * @param key - The key to remove the button from
   * @param Mode - The Mode of the button to remove. Default removes all modes
   * @param profile - default is 'default'
   */
  removeButton = async (button: Button): Promise<void> => {
    const mapping = await this.getMappings()
    try {
      validMappingExists(mapping)
    } catch (error) {
      Logger.error('Unable to remove button', {
        function: 'removeButton',
        error: error as Error,
        source: 'mappingStore'
      })
      return
    }

    const mappingsProfile = mapping.profiles[button.profile || 'default']
    if (!mappingsProfile) {
      Logger.log(
        LOGGING_LEVELS.ERROR,
        `[MappingStore]: Profile ${button.profile || 'default'} does not exist! Create a new profile with the name ${button.profile || 'default'} and try again`
      )
      return
    }
    // Ensuring the key exists in the mapping
    if (!mappingsProfile[button.key]) {
      Logger.log(
        LOGGING_LEVELS.ERROR,
        `[MappingStore]: Key ${button.key} does not exist in profile ${button.profile || 'default'}!`
      )
      return
    }

    if (button.mode === null) {
      // Remove the entire key
      delete mappingsProfile[button.key]
      Logger.log(
        LOGGING_LEVELS.LOG,
        `[MappingStore]: Key ${button.key} removed from profile ${button.profile || 'default'}`
      )
    } else {
      // Ensure that the Mode exists in the mapping
      if (!mappingsProfile[button.key][button.mode]) {
        Logger.log(
          LOGGING_LEVELS.ERROR,
          `[MappingStore]: Mode ${button.mode} does not exist in key ${button.key} in profile ${button.profile || 'default'}!`
        )
      } else {
        // Removing the button from the mapping
        delete mappingsProfile[button.key][button.mode]
      }
    }

    // Save the mappings to file
    mapping.profiles[button.profile || 'default'] = mappingsProfile
    await this.saveMapping(mapping)
    Logger.log(
      LOGGING_LEVELS.LOG,
      `[MappingStore]: Button ${button.key} removed from profile ${button.profile || 'default'}`
    )
  }

  /**
   * Adds a new key to the mappings or updates an existing key.
   *
   * @param key - The key to add or update.
   * @returns A Promise that resolves when the key has been added or updated.
   */
  addKey = async (key: Key): Promise<void> => {
    const mapping = await this.getMappings()
    if (!mapping) {
      Logger.error('Unable to add key', {
        function: 'addKey',
        error: new Error('No mappings found'),
        source: 'mappingStore'
      })
      return
    }
    const keys = mapping.keys
    // Validate key structure
    try {
      isValidKey(key)
      // Check if the key already exists
      const existingKeyIndex = keys.findIndex((k) => k.id === key.id)
      if (existingKeyIndex !== -1) {
        // Replace the existing key
        keys[existingKeyIndex] = key
        Logger.log(LOGGING_LEVELS.LOG, `[MappingStore]: Key ${key.id} updated`)
      } else {
        // Add the new key
        keys.push(key)
        Logger.log(LOGGING_LEVELS.LOG, `[MappingStore]: Key ${key.id} added`)
      }
      // Save the mappings
      mapping.keys = keys
      await this.saveMapping(mapping)
    } catch (error) {
      Logger.error('Unable to add key', {
        function: 'addKey',
        error: error as Error,
        source: 'mappingStore'
      })
    }
  }

  removeKey = async (keyId: string): Promise<void> => {
    const mapping = await this.getMappings()
    try {
      validMappingExists(mapping)
    } catch (error) {
      Logger.error('Unable to remove key', {
        function: 'removeKey',
        error: error as Error,
        source: 'mappingStore'
      })
      return
    }
    const keys = mapping.keys
    // Find the index of the key to remove
    const keyIndex = keys.findIndex((key) => key.id === keyId)
    if (keyIndex !== -1) {
      // Remove the key
      keys.splice(keyIndex, 1)
      Logger.log(LOGGING_LEVELS.LOG, `[MappingStore]: Key ${keyId} removed`)
    } else {
      Logger.log(LOGGING_LEVELS.ERROR, `[MappingStore]: Key ${keyId} not found`)
    }
    // Save the mappings
    mapping.keys = keys
    await this.saveMapping(mapping)
  }

  /**
   * Checks if a key with the specified ID exists in the mappings.
   *
   * @param keyId - The ID of the key to check.
   * @returns `true` if the key exists, `false` otherwise.
   */
  keyExists = async (keyId: string): Promise<boolean> => {
    const mapping = await this.getMappings()
    try {
      validMappingExists(mapping)
    } catch (error) {
      Logger.error('Unable to add key', {
        function: 'addKey',
        error: error as Error,
        source: 'mappingStore'
      })
      return false
    }
    return mapping.keys.some((key) => key.id === keyId)
  }

  /**
   * Checks if an action with the specified ID exists in the mappings.
   *
   * @param actionId - The ID of the action to check.
   * @returns `true` if the action exists, `false` otherwise.
   */
  actionExists = async (actionId: string): Promise<boolean> => {
    const mapping = await this.getMappings()
    return mapping?.actions.some((action) => action.id === actionId) || false
  }

  /**
   * Adds a new action to the mappings, or updates an existing action if it already exists.
   *
   * @param action - The action to add or update.
   * @returns A Promise that resolves when the action has been added or updated.
   */
  addAction = async (action: Action): Promise<void> => {
    const mapping = await this.getMappings()

    try {
      // Validate action structure
      isValidAction(action)
      // Check if the action already exists
      const existingActionIndex = mapping.actions.findIndex((a) => a.id === action.id)
      if (existingActionIndex !== -1) {
        // Replace the existing action
        mapping.actions[existingActionIndex] = action
        Logger.log(LOGGING_LEVELS.LOG, `[MappingStore]: Action ${action.id} updated`)
      } else {
        // Add the new action
        mapping.actions.push(action)
        Logger.log(LOGGING_LEVELS.LOG, `[MappingStore]: Action ${action.id} added`)
      }
      // Save the mappings
      await this.saveMapping(mapping)
    } catch (error) {
      Logger.error('Unable to add action', {
        function: 'addAction',
        error: error as Error,
        source: 'mappingStore'
      })
    }
  }

  /**
   * Removes an action from the mappings, and disables the action in all profile mappings.
   *
   * @param actionId - The ID of the action to remove.
   * @returns A Promise that resolves when the action has been removed.
   */
  removeAction = async (actionId: string): Promise<void> => {
    const mapping = await this.getMappings()
    try {
      validMappingExists(mapping)
    } catch (error) {
      Logger.error('Unable to remove Action', {
        function: 'removeAction',
        error: error as Error,
        source: 'mappingStore'
      })
      return
    }

    // Remove the action from global actions
    const actionIndex = mapping.actions.findIndex((action) => action.id === actionId)
    if (actionIndex !== -1) {
      mapping.actions.splice(actionIndex, 1)
      Logger.log(LOGGING_LEVELS.LOG, `[MappingStore]: Action ${actionId} removed`)

      // Remove this action from all profile mappings
      Object.values(mapping.profiles).forEach(async (profile) => {
        try {
          isValidButtonMapping(profile)
        } catch (error) {
          Logger.error(`Unable to disable Actions. ${profile.id} isn't structured correctly`, {
            function: 'removeAction',
            error: error as Error,
            source: 'mappingStore'
          })
          return
        }

        const disableMatchingActions = async (
          buttonMappings: Record<string, { [Mode in EventMode]?: ActionReference }>
        ): Promise<void> => {
          Object.values(buttonMappings).forEach((modeMap) => {
            Object.values(modeMap).forEach((action) => {
              if (action?.id === actionId) {
                action.enabled = false
              }
            })
          })
        }

        await disableMatchingActions(profile.mapping)
      })
    } else {
      Logger.log(LOGGING_LEVELS.ERROR, `[MappingStore]: Action ${actionId} not found`)
    }

    // Save the updated mappings
    await this.saveMapping(mapping)
  }

  /**
   * Removes a source to the mappings. Will disable all actions that use the source.
   * @param sourceId - The ID of the source to remove.
   */
  removeSource = async (sourceId: string): Promise<void> => {
    const mappings = await this.getMappings()
    try {
      validMappingExists(mappings)
    } catch (error) {
      Logger.error('Unable to remove Action', {
        function: 'removeAction',
        error: error as Error,
        source: 'mappingStore'
      })
      return
    }

    // Update all profiles
    const disableSourceActions = (
      actionContainer: Record<string, Record<EventMode, ActionReference>>
    ): Record<string, Record<EventMode, ActionReference>> => {
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
      if ('mapping' in profile) {
        profile.mapping = disableSourceActions(
          profile.mapping as Record<string, Record<EventMode, ActionReference>>
        )
      }
    })
    // Remove global actions with the specified source
    mappings.actions = mappings.actions.filter((action) => action.source !== sourceId)

    // Remove keys with the specified source
    mappings.keys = mappings.keys.filter((key) => key.source !== sourceId)

    /// Save the updated mappings
    await this.saveMapping(mappings)

    Logger.info(
      `Actions for source ${sourceId} disabled in all profiles, global actions, and keys`,
      {
        function: 'removeSource',
        source: 'mappingStore'
      }
    )
  }

  /**
   * Adds a source from the mappings. Will enable all actions that use the source.
   * @param sourceId - The ID of the source to add.
   */
  addSource = async (sourceId: string): Promise<void> => {
    const mappings = await this.getMappings()

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

    await this.saveMapping(mappings)

    Logger.log(
      LOGGING_LEVELS.LOG,
      `[MappingStore]: Actions for source ${sourceId} disabled in all profiles, global actions, and keys`
    )
  }

  /**
   * Updates the icon for an action with the specified ID.
   * @param actionId - The ID of the action to update.
   * @param icon - The new icon to set for the action.
   */
  updateIcon = async (actionId: string, icon: string): Promise<void> => {
    const mapping = await this.getMappings()
    // Find the index of the action to update
    const actionIndex = mapping.actions.findIndex((action) => action.id === actionId)
    if (actionIndex !== -1) {
      // Update the icon
      mapping.actions[actionIndex].icon = icon
      await this.saveMapping(mapping)
      Logger.log(LOGGING_LEVELS.LOG, `[MappingStore]: Icon for action ${actionId} updated`)
    } else {
      Logger.log(LOGGING_LEVELS.ERROR, `[MappingStore]: Action ${actionId} not found`)
    }
  }
  /**
   * Retrieves an action by its ID from the mappings.
   * @param actionId - The ID of the action to retrieve.
   * @returns The action with the specified ID, or null if not found.
   */
  getAction = async (actionId: string): Promise<Action | null> => {
    const mappings = await this.getMappings()
    // Find the index of the action to update
    const actionIndex = mappings.actions.findIndex((action) => action.id === actionId)
    if (actionIndex !== -1) {
      // Update the icon
      return mappings.actions[actionIndex]
    } else {
      Logger.log(LOGGING_LEVELS.ERROR, `[MappingStore]: Action ${actionId} not found`)
      return null
    }
  }

  /**
   * Retrieves the current actions from the mappings.
   * @returns The current actions, or null if not found.
   */
  getActions = async (): Promise<Action[] | null> => {
    const mapping = await this.getMappings()
    try {
      return mapping.actions
    } catch (error) {
      Logger.log(
        LOGGING_LEVELS.ERROR,
        `[[MappingStore]]: TRIED GETTING ACTION BUT FAILED WITH: ${error}`
      )
      return null
    }
  }

  /**
   * Retrieves the current button mapping from the selected profile, or the default profile if no profile is selected.
   * @returns The current button mapping.
   */
  getMapping = async (): Promise<ButtonMapping | null> => {
    const mapping = await this.getMappings()
    try {
      Logger.log(
        LOGGING_LEVELS.LOG,
        `[[MappingStore]]: Getting map from the profile: ${mapping.selected_profile}`
      )

      if (!mapping.profiles) {
        Logger.log(LOGGING_LEVELS.ERROR, '[[MappingStore]]: Profiles object is null')
        return null
      }

      if (!mapping.selected_profile) {
        if (!mapping.profiles.default) {
          Logger.log(LOGGING_LEVELS.ERROR, '[[MappingStore]]: Default profile is null')
          return null
        }
        return mapping.profiles.default
      }

      const profile = mapping.profiles[mapping.selected_profile.id]
      if (!profile) {
        Logger.log(
          LOGGING_LEVELS.ERROR,
          `[[MappingStore]]: Profile ${mapping.selected_profile.id} not found`
        )
        return null
      }

      return profile
    } catch (error) {
      Logger.log(LOGGING_LEVELS.ERROR, `[[MappingStore]]: Error getting mapping: ${error}`)
      return null
    }
  }

  getKeys = async (): Promise<Key[] | null> => {
    const mapping = await this.getMappings()
    return mapping.keys
  }

  /**
   * Retrieves an array of all the profiles defined in the mappings.
   * @returns An array of Profile objects, with the `mapping` property set to `null`.
   */
  getProfiles = async (): Promise<Profile[]> => {
    const mapping = await this.getMappings()
    const profiles = Object.values(mapping.profiles).map((profile) => ({
      ...profile,
      mapping: null
    }))
    return profiles
  }

  /**
   * Retrieves the button mapping for the specified profile.
   * @param profileName - The name of the profile to retrieve the mapping for.
   * @returns The button mapping for the specified profile, or `null` if the profile is not found.
   */
  getProfile = async (profileName: string): Promise<ButtonMapping | null> => {
    const mapping = await this.getMappings()
    return mapping.profiles[profileName]
  }

  /**
   * Retrieves the currently selected profile.
   * @returns The currently selected profile.
   */
  getCurrentProfile = async (): Promise<Profile> => {
    const mapping = await this.getMappings()
    return mapping.selected_profile
  }

  /**
   * Sets the currently selected profile.
   * @param profile - The profile to set as the current profile.
   * @returns A Promise that resolves when the profile has been set.
   */
  setCurrentProfile = async (profile: Profile): Promise<void> => {
    const mapping = await this.getMappings()
    if (mapping.profiles[profile.id]) {
      mapping.selected_profile = profile
      this.notifyListeners('update')
      await this.saveMapping(mapping, false)
    } else {
      Logger.log(
        LOGGING_LEVELS.ERROR,
        `[MappingStore]: Profile ${profile} does not exist! Create a new profile with the name ${profile} and try again`
      )
    }
  }

  /**
   * Adds a new profile to the mappings.
   * @param profileName - The unique name of the new profile.
   * @param baseProfile - Optional. The name of an existing profile to clone as the base for the new profile.
   */
  addProfile = async (profile: Profile): Promise<void> => {
    const mappings = await this.getMappings()
    if (profile.id == 'default') {
      Logger.log(
        LOGGING_LEVELS.WARN,
        `[[MappingStore].addProfile]: Cannot edit the default profile`
      )
      return
    }

    // Check if the profile name already exists
    if (mappings.profiles[profile.id]) {
      Logger.log(
        LOGGING_LEVELS.WARN,
        `[MappingStore]: Profile "${profile.id}" already exists! Updating`
      )
      this.updateProfile(profile.id, profile)
      return
    }

    // Ensure the base profile exists
    if (!mappings.profiles[profile.extends || 'default']) {
      Logger.log(
        LOGGING_LEVELS.ERROR,
        `[MappingStore]: Base profile "${profile.extends}" does not exist!`
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
    await this.saveMapping(mappings)

    Logger.log(LOGGING_LEVELS.LOG, `[MappingStore]: Profile "${profile.name}" added successfully.`)
  }

  /**
   * Removes an existing profile from the mappings.
   * @param profileName - The name of the profile to remove.
   */
  removeProfile = async (profileName: string): Promise<void> => {
    const mappings = await this.getMappings()

    // Prevent removal of the default profile
    if (profileName === 'default') {
      Logger.log(LOGGING_LEVELS.ERROR, `[MappingStore]: The "default" profile cannot be removed.`)
      return
    }

    // Check if the profile exists
    if (!mappings.profiles[profileName]) {
      Logger.log(LOGGING_LEVELS.ERROR, `[MappingStore]: Profile "${profileName}" does not exist!`)
      return
    }

    // Remove the profile
    delete mappings.profiles[profileName]

    // If the removed profile was the selected profile, revert to default
    if (mappings.selected_profile.id === profileName) {
      mappings.selected_profile = defaultProfile
      Logger.log(
        LOGGING_LEVELS.LOG,
        `[MappingStore]: Selected profile was removed. Reverted to "default" profile.`
      )
    }

    // Save the updated mappings
    await this.saveMapping(mappings)

    Logger.log(LOGGING_LEVELS.LOG, `[MappingStore]: Profile "${profileName}" removed successfully.`)
  }

  /**
   * Exports a profile to a file.
   * @param profile - The name of the profile to export.
   * @param filePath - The path where the profile should be saved.
   */
  exportProfile = async (profile: string, filePath: string): Promise<void> => {
    const mappings = await this.getMappings()

    if (!mappings.profiles[profile]) {
      Logger.log(
        LOGGING_LEVELS.ERROR,
        `[MappingStore]: Profile ${profile} does not exist! Cannot export.`
      )
      return
    }

    const profileData = mappings.profiles[profile]
    try {
      await writeToFile<ButtonMapping>(profileData, filePath)
      Logger.log(LOGGING_LEVELS.LOG, `[MappingStore]: Profile ${profile} exported to ${filePath}`)
    } catch (error) {
      Logger.error(`Failed to export profile ${profile}`, {
        error: error as Error,
        function: 'exportProfile',
        source: 'mappingStore'
      })
    }
  }

  /**
   * Imports a profile from a file and adds it to the mappings.
   * @param filePath - The path to the file containing the profile data.
   * @param profileName - The name to assign to the imported profile.
   */
  importProfile = async (filePath: string, profileName: string): Promise<void> => {
    const mapping = await this.getMappings()
    const buttonMapping = await importProfile(filePath, profileName)

    if (buttonMapping) {
      mapping.profiles[profileName] = buttonMapping
      Logger.log(
        LOGGING_LEVELS.LOG,
        `[MappingStore]: Profile ${profileName} imported from ${filePath}`
      )
      await this.saveMapping(mapping)
    } else {
      Logger.log(LOGGING_LEVELS.WARN, `MAPSTORE: Profile ${profileName} not found at ${filePath}`)
    }
  }

  /**
   * Runs the specified action, if it is valid and enabled.
   * @param action - The action to be run, either an `Action` or an `ActionReference`.
   * @returns void
   */
  runAction(action: Action | ActionReference): void {
    try {
      isValidActionReference(action)
      if (action.source === 'server') {
        Logger.log(LOGGING_LEVELS.ERROR, `[MappingStore]: Server actions are not supported!`)
        return
      }
      if (action.enabled && action.source) {
        const SocketData: EventPayload = {
          payload: action,
          request: '',
          type: ServerEvent.ACTION
        }
        import('@server/stores').then(({ appStore }) => {
          action.source && appStore.sendDataToApp(action.source, SocketData)
        })
      } else {
        Logger.log(LOGGING_LEVELS.ERROR, `[MappingStore]: Action not found or not enabled!`)
      }
    } catch (error) {
      Logger.error(`Unable to run action ${action?.id || 'unknown. (is it undefined?)'}`, {
        function: 'runAction',
        source: 'mappingStore',
        error: error as Error
      })
    }
  }

  async triggerKey(keyId: string, mode: EventMode): Promise<void> {
    const profile = await this.getMapping()
    if (!profile) {
      Logger.log(LOGGING_LEVELS.WARN, '[MAPPINGSTORE.triggerKey]: Profile was null or undefined!')
      return
    }
    const action = profile.mapping[keyId][mode]
    if (action) {
      this.runAction(action)
    } else {
      Logger.log(
        LOGGING_LEVELS.WARN,
        `[MappingStore]: Key does not have an action! KeyID: ${keyId}`
      )
    }
  }

  /**
   * Fetches the icon for the specified action.
   * @param action - The action for which to fetch the icon, either an `Action` or an `ActionReference`.
   * @returns The URL of the icon, or `null` if the icon could not be fetched.
   */
  fetchActionIcon = async (action: Action | ActionReference): Promise<string | null> => {
    try {
      isValidAction(action)
      return await FetchIcon(action as Action)
    } catch {
      if (!action || action.id) return null
      const actualAction = await this.getAction(action.id)
      return actualAction ? await FetchIcon(actualAction) : null
    }
  }

  /**
   * Fetches the icon for the specified key and event mode.
   * @param key - The key for which to fetch the icon.
   * @param mode - The event mode for which to fetch the icon.
   * @returns The URL of the icon, or `null` if the icon could not be fetched.
   */
  fetchKeyIcon = async (key: Key, mode: EventMode): Promise<string | null> => {
    const mapping = await this.getMapping()
    if (!mapping) {
      Logger.log(LOGGING_LEVELS.WARN, '[fetchKeyIcon]: Mapping was undefined!')
      return null
    }
    const action = mapping.mapping[key.id][mode]

    if (action) {
      return await this.fetchActionIcon(action)
    } else {
      return null
    }
  }

  /**
   * Updates the specified profile with the provided data.
   * @param profileName - The name of the profile to update.
   * @param updatedProfile - The partial profile data to merge with the existing profile.
   * @returns A Promise that resolves when the profile has been updated.
   */
  updateProfile = async (
    profileName: string,
    updatedProfile: Partial<ButtonMapping>
  ): Promise<void> => {
    const mapping = await this.getMappings()
    const profile = mapping.profiles[profileName]
    if (!profile) {
      Logger.log(LOGGING_LEVELS.ERROR, `[MappingStore]: Profile ${profileName} does not exist!`)
      return
    }

    // Update the profile with the provided data
    deepMerge(profile, updatedProfile)

    mapping.profiles[profileName] = profile
    Logger.log(LOGGING_LEVELS.LOG, `[MappingStore]: Profile ${profileName} updated successfully.`)
    this.notifyListeners('profile', profile)
    this.saveMapping(mapping, false)
  }
}

export default MappingState.getInstance()
