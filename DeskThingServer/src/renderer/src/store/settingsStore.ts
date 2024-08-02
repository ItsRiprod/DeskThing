import { EventEmitter } from '../utility/eventEmitter'

export interface Settings {
  callbackPort: number
  devicePort: number
  address: string
  autoStart: boolean
  minimizeApp: boolean
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
      minimizeApp: true
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
    this.settings = await window.electron.getSettings()
    return this.settings
  }

  public getSetting(key: string): any {
    return this.settings[key]
  }

  public saveSettings(settings: Settings): void {
    this.emit('update', this.settings)
    window.electron.saveSettings(settings)
  }

  private handleSettingsUpdated(_event: any, updatedSettings: Settings): void {
    this.settings = updatedSettings
    this.emit('update', this.settings)
  }
}

export default SettingsStore.getInstance()
