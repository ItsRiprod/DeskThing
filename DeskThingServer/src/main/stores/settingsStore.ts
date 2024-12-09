console.log('[Settings Store] Starting')
import { readFromFile, writeToFile } from '../utils/fileHandler'
import loggingStore from './loggingStore'
import os from 'os'
import { LOGGING_LEVEL, Settings, MESSAGE_TYPES } from '@shared/types'

const settingsVersion = '0.9.2'
const version_code = 9.2

type SettingsStoreListener = (settings: Settings) => void

class SettingsStore {
  private settings: Settings
  private settingsFilePath: string = 'settings.json'
  private static instance: SettingsStore
  private listeners: SettingsStoreListener[] = []

  constructor() {
    this.settings = this.getDefaultSettings()
    this.setupSettings()
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

  static getInstance(): SettingsStore {
    if (!SettingsStore.instance) {
      SettingsStore.instance = new SettingsStore()
    }
    return SettingsStore.instance
  }

  public addListener(listener: SettingsStoreListener): void {
    this.listeners.push(listener)
  }

  private async notifyListeners(): Promise<void> {
    this.listeners.forEach((listener) => {
      listener(this.settings)
    })
  }

  public async getSettings(): Promise<Settings> {
    if (this.settings) {
      return this.settings
    } else {
      console.log('SETTINGS: Settings not initialized. Loading settings...')
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
    value: boolean | undefined | string | number | string[]
  ): Promise<void> {
    if (key === 'autoStart' && typeof value === 'boolean') {
      this.updateAutoLaunch(value)
    }
    this.settings[key] = value
    this.saveSettings()
  }

  public async loadSettings(): Promise<Settings> {
    try {
      const data = await readFromFile<Settings>(this.settingsFilePath)
      loggingStore.log(MESSAGE_TYPES.LOGGING, 'SETTINGS: Loaded settings!')

      if (!data || !data.version_code || data.version_code < version_code) {
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
      return defaultSettings
    }
  }

  private async updateAutoLaunch(enable: boolean): Promise<void> {
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
  }

  /**
   * Saves the current settings to file. Emits an update if settings are passed
   * @param settings - Overrides the current settings with the passed settings if passed
   */
  public async saveSettings(settings?: Settings): Promise<void> {
    try {
      if (settings) {
        this.settings = settings as Settings
      }

      await writeToFile(this.settings, this.settingsFilePath)
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        'SETTINGS: Updated settings!' + JSON.stringify(this.settings)
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
      version_code: version_code,
      callbackPort: 8888,
      devicePort: 8891,
      address: '0.0.0.0',
      LogLevel: LOGGING_LEVEL.PRODUCTION,
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

const getLocalIpAddress = (): string[] => {
  const interfaces = os.networkInterfaces()
  const localIps: string[] = []

  for (const name of Object.keys(interfaces)) {
    const ifaceGroup = interfaces[name]
    if (ifaceGroup) {
      for (const iface of ifaceGroup) {
        if (iface.family === 'IPv4' && !iface.internal) {
          if (
            (iface.address.startsWith('10.') ||
              iface.address.startsWith('172.') ||
              iface.address.startsWith('169.') ||
              iface.address.startsWith('100.') ||
              iface.address.startsWith('192.')) &&
            iface.address !== '192.168.7.1'
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

export default SettingsStore.getInstance()
