import { AutoLaunchStoreClass } from '@shared/stores/autoLaunchStore'
import { app } from 'electron'
import AutoLaunch from 'auto-launch'
import Logger from '../utils/logger'
import { SettingsStoreClass } from '@shared/stores/settingsStore'

export class AutoLaunchStore implements AutoLaunchStoreClass {
  private autoLauncher: AutoLaunch

  private _initialized: boolean = false
  public get initialized(): boolean {
    return this._initialized
  }

  constructor(private settingStore: SettingsStoreClass) {
    this.autoLauncher = new AutoLaunch({
      name: 'DeskThing',
      path: app.getPath('exe')
    })
  }
  clearCache = async (): Promise<void> => {
    // do nothing
  }
  saveToFile = async (): Promise<void> => {
    // do nothing
  }

  async initialize(): Promise<void> {
    if (this._initialized) return
    this._initialized = true
    await this.initListeners()
  }

  async initListeners(): Promise<void> {
    this.settingStore.on('server_autoStart', async (enabled) => {
      if (enabled) {
        await this.enable()
      } else {
        await this.disable()
      }
    })
  }

  public async enable(): Promise<void> {
    try {
      await this.autoLauncher.enable()
      Logger.debug('Auto launch enabled', {
        source: 'autoLaunchStore',
        function: 'enable'
      })
    } catch (err) {
      Logger.error('Failed to enable auto launching', {
        source: 'autoLaunchStore',
        function: 'enable',
        error: err as Error
      })
    }
  }

  public async disable(): Promise<void> {
    try {
      await this.autoLauncher.disable()
      Logger.debug('Auto launch disabled', {
        source: 'autoLaunchStore',
        function: 'disable'
      })
    } catch (err) {
      Logger.error('Failed to disable auto launching', {
        source: 'autoLaunchStore',
        function: 'disable',
        error: err as Error
      })
    }
  }

  public async isEnabled(): Promise<boolean> {
    try {
      return await this.autoLauncher.isEnabled()
    } catch (err) {
      Logger.error('Failed to check auto launch status', {
        source: 'autoLaunchStore',
        function: 'isEnabled',
        error: err as Error
      })
      return false
    }
  }
}
