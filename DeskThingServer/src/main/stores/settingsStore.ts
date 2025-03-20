// Types
import { LOGGING_LEVELS } from '@DeskThing/types'
import { Settings, LOG_FILTER, CacheableStore } from '@shared/types'
import { SettingsStoreClass, SettingsStoreListener } from '@shared/stores/settingsStore'

// Utils
import { readFromFile, writeToFile } from '../services/files/fileService'
import Logger from '@server/utils/logger'
import os from 'os'
import semverSatisfies from 'semver/functions/satisfies.js'

// Consts
const settingsVersion = '0.10.4'

export class SettingsStore implements CacheableStore, SettingsStoreClass {
  private settings: Settings | undefined
  private settingsFilePath: string = 'settings.json'
  private listeners: SettingsStoreListener[] = []

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
    // this.settings = undefined - it's not worth the performance overhead of loading them again
  }

  /**
   * @implements CacheableStore
   */
  saveToFile = async (): Promise<void> => {
    await this.saveSettings()
  }

  private setupSettings = async (): Promise<void> => {
    this.loadSettings()
      .then((settings) => {
        if (settings) {
          this.settings = settings as Settings
          this.settings.localIp = getLocalIpAddress()
          this.notifyListeners()
        }
      })
      .catch((err) => {
        console.error('SETTINGS: Error initializing settings:', err)
      })
  }

  /**
   * Adds a listener function that will be called whenever the settings are updated.
   * @param listener - A function that will be called with the updated settings.
   */
  public addListener(listener: SettingsStoreListener): void {
    this.listeners.push(listener)
  }

  /**
   * Notifies all registered listeners of the updated settings.
   * This method is called internally whenever the settings are updated.
   */
  private async notifyListeners(): Promise<void> {
    if (!this.settings) {
      // Ensures settings are loaded
      await this.getSettings()
    }

    await Promise.all(this.listeners.map((listener) => listener(this.settings as Settings)))
  }

  public async getSettings(): Promise<Settings | undefined> {
    if (this.settings) {
      return this.settings
    } else {
      return await this.loadSettings()
    }
  }

  /**
   * Updates a specific setting and saves it to file
   * @param key - The key of the setting to update
   * @param value - The new value for the setting
   */
  public async updateSetting(
    key: string,
    value: boolean | undefined | string | number | string[],
    atmps: number = 0
  ): Promise<void> {
    if (!this.settings) {
      await this.getSettings()
      // call update setting again to avoid null check
      if (atmps < 3) {
        return await this.updateSetting(key, value, atmps + 1)
      } else return
    }

    if (key === 'autoStart' && typeof value === 'boolean') {
      this.updateAutoLaunch(value)
    }
    this.settings[key] = value
    this.saveSettings()
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
  public async loadSettings(): Promise<Settings> {
    try {
      const data = await readFromFile<Settings>(this.settingsFilePath)
      Logger.debug('Loaded Settings!', {
        source: 'settingStore',
        function: 'loadSettings'
      })

      if (!data || !data.version || !semverSatisfies(data.version, '>=' + settingsVersion)) {
        // File does not exist, create it with default settings
        console.log('Unable to find settings. ', data)
        const defaultSettings = this.getDefaultSettings()
        await writeToFile(defaultSettings, this.settingsFilePath)
        console.log('SETTINGS: Returning default settings')
        return defaultSettings
      }

      if (data.autoStart !== undefined) {
        await this.updateAutoLaunch(data.autoStart)
      }

      return data
    } catch (err) {
      console.error('Error loading settings:', err)
      const defaultSettings = this.getDefaultSettings()
      defaultSettings.localIp = getLocalIpAddress()
      writeToFile(defaultSettings, this.settingsFilePath)
      return defaultSettings
    }
  }

  private async updateAutoLaunch(enable: boolean): Promise<void> {
    try {
      const AutoLaunch = await import('auto-launch')
      const autoLaunch = new AutoLaunch.default({
        name: 'DeskThing',
        path: process.execPath
      })

      if (enable) {
        await autoLaunch.enable()
      } else {
        await autoLaunch.disable()
      }
    } catch (err) {
      Logger.error('Failed to enable auto launching', {
        source: 'settingsStore',
        function: 'updateAutoLaunch',
        error: err as Error
      })
    }
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
      Logger.log(
        LOGGING_LEVELS.LOG,
        'SETTINGS: Updated settings!' + JSON.stringify(this.settings),
        {
          source: 'settingsStore',
          function: 'saveSettings'
        }
      )
      this.notifyListeners()
    } catch (err) {
      console.error('Error saving settings:', err)
    }
  }

  /**
   *
   * @returns Returns the default settings for the application
   */
  private getDefaultSettings(): Settings {
    return {
      version: settingsVersion,
      callbackPort: 8888,
      devicePort: 8891,
      address: '0.0.0.0',
      LogLevel: LOG_FILTER.INFO,
      autoStart: false,
      autoConfig: false,
      minimizeApp: true,
      globalADB: false,
      autoDetectADB: false,
      refreshInterval: -1,
      playbackLocation: 'none',
      localIp: getLocalIpAddress(),
      appRepos: ['https://github.com/ItsRiprod/deskthing-apps'],
      clientRepos: ['https://github.com/ItsRiprod/deskthing-client']
    }
  }
}

/**
 * Retrieves the local IP addresses of the system, excluding internal and certain reserved IP addresses.
 * @returns An array of local IP addresses as strings.
 */
const getLocalIpAddress = (): string[] => {
  const interfaces = os.networkInterfaces()
  const localIps: string[] = []

  if (!interfaces) {
    return ['127.0.0.1']
  }

  for (const name of Object.keys(interfaces)) {
    const ifaceGroup = interfaces[name]
    if (ifaceGroup) {
      for (const iface of ifaceGroup) {
        if (iface.family === 'IPv4' && !iface.internal) {
          if (
            iface.address.startsWith('10.') ||
            (iface.address.startsWith('172.') &&
              parseInt(iface.address.split('.')[1]) >= 16 &&
              parseInt(iface.address.split('.')[1]) <= 31) ||
            iface.address.startsWith('192.168.')
          ) {
            localIps.push(iface.address)
          }
        }
      }
    }
  }
  if (localIps.length === 0) {
    localIps.push('127.0.0.1')
  }
  return localIps
}
