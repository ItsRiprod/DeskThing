import { EventEmitter } from '../utility/eventEmitter'

export interface Settings {
  callbackPort: number
  devicePort: number
  address: string
  localIp: string[]
  autoStart: boolean
  minimizeApp: boolean
  globalADB: boolean
  appRepos: string[]
  clientRepos: string[]
}

export type SocketData = {
  app: string
  payload: Settings
  type: string
}

interface SettingsStoreEvents {
  update: Settings
}

class SettingsStore extends EventEmitter<SettingsStoreEvents> {
  private settings: Settings
  private static instance: SettingsStore

  constructor() {
    super()
    this.settings = {
      callbackPort: -1,
      devicePort: -1,
      address: '-.-.-.-',
      autoStart: true,
      minimizeApp: true,
      globalADB: true,
      localIp: ['-.-.-.-'],
      appRepos: [
        'https://github.com/ItsRiprod/DeskThing',
        'https://github.com/ItsRiprod/deskthing-apps'
      ],
      clientRepos: [
        'https://github.com/ItsRiprod/DeskThing',
        'https://github.com/ItsRiprod/deskthing-client'
      ]
    }

    window.electron.ipcRenderer.on('settings-updated', this.handleSettingsUpdated.bind(this))
  }

  static getInstance(): SettingsStore {
    if (!SettingsStore.instance) {
      SettingsStore.instance = new SettingsStore()
    }
    return SettingsStore.instance
  }

  public async getSettings(): Promise<Settings> {
    if (this.settings.callbackPort === -1 || this.settings.devicePort === -1) {
      const socketData = await window.electron.getSettings()
      this.settings = socketData.payload as Settings
    }
    console.log('Has ', this.settings)
    return this.settings
  }

  public async requestSettings(): Promise<Settings> {
    const socketData = await window.electron.getSettings()
    this.settings = socketData.payload as Settings
    return this.settings
  }

  public getSetting(key: string): any {
    return this.settings[key]
  }

  public saveSettings(settings: SocketData): void {
    if (settings.payload) {
      this.settings = settings.payload
      this.emit('update', this.settings)
      window.electron.saveSettings(settings)
    }
  }

  private handleSettingsUpdated(_event: any, updatedSettings: SocketData): void {
    this.settings = updatedSettings.payload as Settings
    this.emit('update', this.settings)
  }
}

export default SettingsStore.getInstance()
