import { StoreInterface } from '@shared/interfaces/storeInterface'
import { CacheableStore, Settings } from '../types'

export type SettingsStoreListener<K extends keyof Settings> = (
  settings: Settings[K]
) => void | Promise<void>
export type SettingsListener = (settings: Settings) => void | Promise<void>

/**
 * Interface representing the public methods of SettingsStore
 */
export interface SettingsStoreClass extends StoreInterface, CacheableStore {
  /**
   * Listens to changes on a specific setting
   * @param key The key of the setting to listen to
   * @param listener The function to be called when the setting changes
   * @returns A function to unsubscribe the listener
   */
  on<K extends keyof Settings>(key: K, listener: SettingsStoreListener<K>): () => void

  /**
   * Listens to changes on all settings
   * @param listener The function to be called when any setting changes
   * @returns A function to unsubscribe the listener
   */
  addSettingsListener(listener: SettingsListener): () => void

  /**
   * Gets the current application settings
   * @returns Promise resolving to current settings
   */
  getSetting<K extends keyof Settings>(key: K): Promise<Settings[K] | undefined>

  /**
   * Updates a specific setting and saves it to file
   * @param key The key of the setting to update
   * @param value The new value for the setting
   * @param atmps Optional retry counter for internal recursion
   */
  saveSetting<K extends keyof Settings>(key: K, value: Settings[K], atmps?: number): Promise<void>
  /**
   * Updates a specific setting and saves it to file
   * @param key The key of the setting to update
   * @param value The new value for the setting
   */
  saveSettings(settings: Settings): Promise<void>

  getSettings(): Promise<Settings | undefined>
}
