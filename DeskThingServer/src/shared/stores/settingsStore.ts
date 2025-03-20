import { StoreInterface } from '@shared/interfaces/storeInterface'
import { Settings } from '../types'

export type SettingsStoreListener = (settings: Settings) => void

/**
 * Interface representing the public methods of SettingsStore
 */
export interface SettingsStoreClass extends StoreInterface {
  /**
   * Clears the settings store cache
   */
  clearCache(): Promise<void>

  /**
   * Saves the current settings to file
   */
  saveToFile(): Promise<void>

  /**
   * Adds a listener function that will be called whenever settings are updated
   * @param listener Function to call with updated settings
   */
  addListener(listener: SettingsStoreListener): void

  /**
   * Gets the current application settings
   * @returns Promise resolving to current settings
   */
  getSettings(): Promise<Settings | undefined>

  /**
   * Updates a specific setting and saves it to file
   * @param key The key of the setting to update
   * @param value The new value for the setting
   * @param atmps Optional retry counter for internal recursion
   */
  updateSetting(
    key: string,
    value: boolean | undefined | string | number | string[],
    atmps?: number
  ): Promise<void>

  /**
   * Loads the application settings from file
   * @returns Promise resolving to loaded settings
   */
  loadSettings(): Promise<Settings>

  /**
   * Saves the current settings to file
   * @param settings Optional settings to save instead of current settings
   */
  saveSettings(settings?: Settings): Promise<void>
}
