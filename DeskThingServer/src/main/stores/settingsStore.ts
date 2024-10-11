import { readFromFile, writeToFile } from '../utils/fileHandler'
import dataListener, { MESSAGE_TYPES } from '../utils/events'
import os from 'os'
import { Settings } from '@shared/types'

const settingsVersion = '0.9.0'

class SettingsStore {
  private settings: Settings
  private settingsFilePath: string = 'settings.json'
  private static instance: SettingsStore

  constructor() {
    this.settings = this.getDefaultSettings()
    this.loadSettings()
      .then((settings) => {
        if (settings) {
          this.settings = settings as Settings
          this.settings.localIp = getLocalIpAddress()
          dataListener.asyncEmit(MESSAGE_TYPES.SETTINGS, this.settings)
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

  public async getSettings(): Promise<Settings> {
    if (this.settings) {
      return this.settings
    } else {
      console.log('SETTINGS: Settings not initialized. Loading settings...')
      return await this.loadSettings()
    }
  }

  public updateSetting(key: string, value: any): void {
    if (key === 'autoStart') {
      this.updateAutoLaunch(value)
    }
    this.settings[key] = value
    dataListener.asyncEmit(MESSAGE_TYPES.SETTINGS, this.settings)
    this.saveSettings()
  }

  public async loadSettings(): Promise<Settings> {
    try {
      const data = await readFromFile<Settings>(this.settingsFilePath)
      dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, 'SETTINGS: Loaded settings!')

      if (!data || data.version !== settingsVersion) {
        // File does not exist, create it with default settings
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

  public async saveSettings(settings?: Settings): Promise<void> {
    try {
      if (settings) {
        this.settings = settings as Settings
        await writeToFile(this.settings, this.settingsFilePath)
        dataListener.asyncEmit(MESSAGE_TYPES.SETTINGS, this.settings)
        dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, 'SETTINGS: Updated settings!')
      } else {
        dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, 'SETTINGS: Invalid setting format!')
      }
    } catch (err) {
      console.error('Error saving settings:', err)
    }
  }

  private getDefaultSettings(): Settings {
    return {
      version: settingsVersion,
      callbackPort: 8888,
      devicePort: 8891,
      address: '0.0.0.0',
      autoStart: false,
      minimizeApp: true,
      globalADB: false,
      autoDetectADB: true,
      localIp: getLocalIpAddress(),
      appRepos: [
        'https://github.com/ItsRiprod/deskthing-apps',
        'https://github.com/ItsRiprod/DeskThing'
      ],
      clientRepos: [
        'https://github.com/ItsRiprod/deskthing-client',
        'https://github.com/ItsRiprod/DeskThing'
      ]
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
