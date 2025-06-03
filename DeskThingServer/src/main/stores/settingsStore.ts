// Types
import { Settings, CacheableStore } from '@shared/types'
import {
  SettingsListener,
  SettingsStoreClass,
  SettingsStoreListener
} from '@shared/stores/settingsStore'

// Utils
import { readFromFile, writeToFile } from '../services/files/fileService'
import Logger from '@server/utils/logger'
import semverSatisfies from 'semver/functions/satisfies.js'
import { defaultSettings } from '@server/static/defaultSettings'

const LAST_SETTINGS_UPDATE = '0.11.8'

export class SettingsStore implements CacheableStore, SettingsStoreClass {
  private settings: Settings | undefined
  private settingsFilePath: string = 'settings.json'
  private globalListeners: SettingsListener[] = []

  private _initialized: boolean = false
  public get initialized(): boolean {
    return this._initialized
  }

  async initialize(): Promise<void> {
    if (this._initialized) return
    this._initialized = true
    this.setupSettings()
  }

  /**
   * @implements CacheableStore
   */
  clearCache = async (): Promise<void> => {
    // do nothing
  }

  /**
   * @implements CacheableStore
   */
  saveToFile = async (): Promise<void> => {
    await this.saveSettings()
  }

  private setupSettings = async (): Promise<void> => {
    const settings = await this.loadSettings()
    this.settings = settings
  }

  private notifyListeners = async (): Promise<void> => {
    if (!this.settings) return
    this.globalListeners.forEach(async (listener) => {
      try {
        if (!this.settings) return
        await listener(this.settings)
      } catch (error) {
        Logger.error('Error in notifyListeners', {
          source: 'settingsStore',
          function: 'notifyListeners',
          error: error as Error
        })
      }
    })
  }

  /**
   * Saves the current settings to file. Emits an update if settings are passed
   * @param settings - Overrides the current settings with the passed settings if passed
   */
  public async saveSettings(settings?: Settings): Promise<void> {
    try {
      if (settings) {
        this.settings = settings
      }

      await writeToFile(this.settings, this.settingsFilePath)
      Logger.debug('SETTINGS: Updated settings!' + JSON.stringify(this.settings), {
        source: 'settingsStore',
        function: 'saveSettings'
      })
      this.notifyListeners()
    } catch (err) {
      Logger.error('Unable to save settings!', {
        source: 'settingsStore',
        function: 'saveSettings',
        error: err as Error
      })
    }
  }

  /**
   *
   * @returns Returns the default settings for the application
   */
  private getDefaultSettings(): Settings {
    return { ...defaultSettings }
  }

  /**
   * Loads the application settings from a file. If the file does not exist or the
   * version code is outdated, it creates a new file with the default settings.
   * If the `autoStart` setting is defined, it also updates the auto-launch
   * configuration.
   *
   * @returns The loaded settings, or the default settings if the file could not be
   * loaded.
   */
  private async loadSettings(): Promise<Settings> {
    try {
      const data = await readFromFile<Settings>(this.settingsFilePath)
      Logger.debug('Loaded Settings!', {
        source: 'settingStore',
        function: 'loadSettings'
      })

      if (!data || !data.version || !semverSatisfies(data.version, '>=' + LAST_SETTINGS_UPDATE)) {
        // File does not exist, create it with default settings
        console.log('Unable to find settings. ', data)
        const defaultSettings = this.getDefaultSettings()
        await writeToFile(defaultSettings, this.settingsFilePath)
        console.log('SETTINGS: Returning default settings')
        return defaultSettings
      }

      return data
    } catch (err) {
      console.error('Error loading settings:', err)

      const defaultSettings = this.getDefaultSettings()

      writeToFile(defaultSettings, this.settingsFilePath)

      return defaultSettings
    }
  }

  public getSettings = async (): Promise<Settings> => {
    if (this.settings) {
      return this.settings
    }
    return this.loadSettings()
  }

  public getSetting = async <K extends keyof Settings>(
    key: K
  ): Promise<Settings[K] | undefined> => {
    const settings = await this.getSettings()
    return settings[key]
  }

  public addSettingsListener(listener: SettingsListener): () => void {
    this.globalListeners.push(listener)
    return () => {
      this.globalListeners = this.globalListeners.filter((l) => l !== listener)
    }
  }

  public on<K extends keyof Settings>(key: K, listener: SettingsStoreListener<K>): () => void {
    let currentSetting = this.settings?.[key]

    const remove = this.addSettingsListener(async (settings) => {
      // Ensures the new setting is not the same as it was before - unless it is a reference
      if (settings[key] === currentSetting && typeof currentSetting != 'object') return

      currentSetting = settings[key]
      await listener(settings[key])
    })

    return remove
  }

  /**
   * Updates a specific setting and saves it to file
   * @param key - The key of the setting to update
   * @param value - The new value for the setting
   */
  public async saveSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
    const settings = await this.getSettings()
    settings[key] = value
    await this.saveSettings(settings)
  }
}
