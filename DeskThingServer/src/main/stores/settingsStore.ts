import { readFromFile, writeToFile } from '../utils/fileHandler'
import dataListener, { MESSAGE_TYPES } from '../utils/events'
import os from 'os'
import { socketData } from '../handlers/websocketServer'

export interface Settings {
  callbackPort: number
  devicePort: number
  address: string
  autoStart: boolean
  minimizeApp: boolean
  localIp: string[]
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
        if (settings.payload) {
          this.settings = settings.payload as Settings
          this.settings.localIp = getLocalIpAddress()
          dataListener.asyncEmit(MESSAGE_TYPES.SETTINGS, {
            type: 'settings',
            payload: this.settings,
            app: 'server'
          })
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

  public async getSettings(): Promise<socketData> {
    if (this.settings) {
      return { type: 'settings', app: 'server', payload: this.settings }
    } else {
      console.log('SETTINGS: Settings not initialized. Loading settings...')
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

  public async loadSettings(): Promise<socketData> {
    try {
      const data = await readFromFile<Settings>(this.settingsFilePath)
      dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, 'SETTINGS: Loaded settings!')
      if (!data) {
        // File does not exist, create it with default settings
        const defaultSettings = this.getDefaultSettings()
        await writeToFile(defaultSettings, this.settingsFilePath)
        console.log('SETTINGS: Returning default settings')
        return { type: 'settings', app: 'server', payload: defaultSettings }
      }
      return { type: 'settings', app: 'server', payload: data }
    } catch (err) {
      console.error('Error loading settings:', err)
      const defaultSettings = this.getDefaultSettings()
      defaultSettings.localIp = getLocalIpAddress()
      return { type: 'settings', app: 'server', payload: defaultSettings }
    }
  }

  public async saveSettings(settings: socketData | undefined = undefined): Promise<void> {
    try {
      if (settings) {
        this.settings = settings.payload as Settings
        await writeToFile(this.settings, this.settingsFilePath)
        dataListener.asyncEmit(MESSAGE_TYPES.SETTINGS, {
          type: 'settings',
          payload: this.settings,
          app: 'server'
        })
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
      callbackPort: 8888,
      devicePort: 8891,
      address: '0.0.0.0',
      autoStart: false,
      minimizeApp: true,
      localIp: getLocalIpAddress()
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
