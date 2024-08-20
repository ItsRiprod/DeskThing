import { readFromFile, writeToFile } from '../utils/fileHandler'
import dataListener, { MESSAGE_TYPES } from '../utils/events'

export interface Settings {
  callbackPort: number
  devicePort: number
  address: string
  autoStart: boolean
  minimizeApp: boolean
  [key: string]: any // For any additional settings
}

class SettingsStore {
  private settings: Settings
  private settingsFilePath: string = 'settings.json'
  private static instance: SettingsStore

  constructor() {
    this.settings = this.getDefaultSettings()
    this.loadSettings()
      .then((settings) => {
        this.settings = settings
        dataListener.asyncEmit(MESSAGE_TYPES.SETTINGS, {
          type: 'settings',
          payload: this.settings,
          app: 'server'
        })
      })
      .catch((err) => {
        console.error('Error initializing settings:', err)
      })
  }
  static getInstance(): SettingsStore {
    if (!SettingsStore.instance) {
      SettingsStore.instance = new SettingsStore()
    }
    return SettingsStore.instance
  }

  public async getSettings(): Promise<Settings> {
    if (this.settings) {
      return this.settings
    } else {
      console.log('Settings not initialized. Loading settings...')
      return await this.loadSettings()
    }
  }

  public updateSetting(key: string, value: any): void {
    this.settings[key] = value
    dataListener.asyncEmit(MESSAGE_TYPES.SETTINGS, {
      type: 'settings',
      payload: this.settings,
      app: 'server'
    })
    this.saveSettings()
  }

  public async loadSettings(): Promise<Settings> {
    try {
      const data = await readFromFile<Settings>(this.settingsFilePath)
      dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, 'SETTINGS: Loaded settings!')
      if (!data) {
        // File does not exist, create it with default settings
        const defaultSettings = this.getDefaultSettings()
        await writeToFile(defaultSettings, this.settingsFilePath)
        return defaultSettings
      }
      return data
    } catch (err) {
      console.error('Error loading settings:', err)
      return this.getDefaultSettings()
    }
  }

  public async saveSettings(settings = this.settings): Promise<void> {
    try {
      this.settings = settings
      await writeToFile(settings, this.settingsFilePath)
      dataListener.asyncEmit(MESSAGE_TYPES.SETTINGS, {
        type: 'settings',
        payload: settings,
        app: 'server'
      })
      dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, 'SETTINGS: Updated settings!')
    } catch (err) {
      console.error('Error saving settings:', err)
    }
  }

  private getDefaultSettings(): Settings {
    return {
      callbackPort: 8888,
      devicePort: 8891,
      address: '0.0.0.0',
      autoStart: false,
      minimizeApp: true
    }
  }
}
export default SettingsStore.getInstance()
