console.log('[MapStore Service] Starting')
import { Action, EventMode, Key, ActionReference } from '@DeskThing/types'
import { ButtonMapping, Button, Profile } from '@shared/types'

export type ListenerPayloads = {
  key: Key[]
  profile: ButtonMapping
  action: Action[]
  update: undefined
}

export type Listener<T extends keyof ListenerPayloads> = (data?: ListenerPayloads[T]) => void

/**
 * Interface representing the public methods of MappingState
 */
export interface MappingStoreClass {
  /**
   * Clears the mapping cache
   */
  clearCache(): Promise<void>

  /**
   * Saves the current mappings to file
   */
  saveToFile(): Promise<void>

  /**
   * Adds a listener for the specified event type
   * @param type Event type to listen for
   * @param listener Function to call when event occurs
   * @returns Function to unregister the listener
   */
  addListener<T extends keyof ListenerPayloads>(type: T, listener: Listener<T>): () => void

  /**
   * Removes a listener for the specified event type
   * @param type Event type to stop listening for
   * @param listener Function to remove
   */
  removeListener<T extends keyof ListenerPayloads>(type: T, listener: Listener<T>): void

  /**
   * Adds a button mapping
   * @param button Button configuration to add
   */
  addButton(button: Button): Promise<void>

  /**
   * Removes a button mapping
   * @param button Button configuration to remove
   */
  removeButton(button: Button): Promise<void>

  /**
   * Adds or updates a key
   * @param key Key to add or update
   */
  addKey(key: Key): Promise<void>

  /**
   * Removes a key by ID
   * @param keyId ID of key to remove
   */
  removeKey(keyId: string): Promise<void>

  /**
   * Checks if a key exists
   * @param keyId ID of key to check
   * @returns Promise resolving to boolean indicating existence
   */
  keyExists(keyId: string): Promise<boolean>

  /**
   * Checks if an action exists
   * @param actionId ID of action to check
   * @returns Promise resolving to boolean indicating existence
   */
  actionExists(actionId: string): Promise<boolean>

  /**
   * Adds or updates an action
   * @param action Action to add or update
   */
  addAction(action: Action): Promise<void>

  /**
   * Removes an action by ID
   * @param actionId ID of action to remove
   */
  removeAction(actionId: string): Promise<void>

  /**
   * Removes a source and disables all related actions
   * @param sourceId ID of source to remove
   */
  removeSource(sourceId: string): Promise<void>

  /**
   * Adds a source and enables all related actions
   * @param sourceId ID of source to add
   */
  addSource(sourceId: string): Promise<void>

  /**
   * Updates an action's icon
   * @param actionId ID of action to update
   * @param icon New icon value
   */
  updateIcon(actionId: string, icon: string): Promise<void>

  /**
   * Gets an action by ID
   * @param actionId ID of action to retrieve
   * @returns Promise resolving to action or null
   */
  getAction(actionId: string): Promise<Action | null>

  /**
   * Gets all actions
   * @returns Promise resolving to array of actions or null
   */
  getActions(): Promise<Action[] | null>

  /**
   * Gets the current button mapping
   * @returns Promise resolving to button mapping or null
   */
  getMapping(): Promise<ButtonMapping | null>

  /**
   * Gets all keys
   * @returns Promise resolving to array of keys or null
   */
  getKeys(): Promise<Key[] | null>

  /**
   * Gets all profiles
   * @returns Promise resolving to array of profiles
   */
  getProfiles(): Promise<Profile[]>

  /**
   * Gets a profile by name
   * @param profileName Name of profile to retrieve
   * @returns Promise resolving to button mapping or null
   */
  getProfile(profileName: string): Promise<ButtonMapping | null>

  /**
   * Gets the current profile
   * @returns Promise resolving to current profile
   */
  getCurrentProfile(): Promise<Profile>

  /**
   * Sets the current profile
   * @param profile Profile to set as current
   */
  setCurrentProfile(profile: Profile): Promise<void>

  /**
   * Adds a new profile
   * @param profile Profile to add
   */
  addProfile(profile: Profile): Promise<void>

  /**
   * Removes a profile by name
   * @param profileName Name of profile to remove
   */
  removeProfile(profileName: string): Promise<void>

  /**
   * Exports a profile to a file
   * @param profile Name of profile to export
   * @param filePath Path to save the profile
   */
  exportProfile(profile: string, filePath: string): Promise<void>

  /**
   * Imports a profile from a file
   * @param filePath Path of file to import
   * @param profileName Name to assign to imported profile
   */
  importProfile(filePath: string, profileName: string): Promise<void>

  /**
   * Executes an action
   * @param action Action or action reference to run
   */
  runAction(action: Action | ActionReference): void

  /**
   * Triggers a key with the specified event mode
   * @param keyId ID of key to trigger
   * @param mode Event mode to trigger
   */
  triggerKey(keyId: string, mode: EventMode): Promise<void>

  /**
   * Fetches an icon for an action
   * @param action Action or action reference to fetch icon for
   * @returns Promise resolving to icon URL or null
   */
  fetchActionIcon(action: Action | ActionReference): Promise<string | null>

  /**
   * Fetches an icon for a key and event mode
   * @param key Key to fetch icon for
   * @param mode Event mode to fetch icon for
   * @returns Promise resolving to icon URL or null
   */
  fetchKeyIcon(key: Key, mode: EventMode): Promise<string | null>

  /**
   * Updates a profile with partial data
   * @param profileName Name of profile to update
   * @param updatedProfile Partial profile data to merge
   */
  updateProfile(profileName: string, updatedProfile: Partial<ButtonMapping>): Promise<void>
}
