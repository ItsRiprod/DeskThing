import dataListener, { MESSAGE_TYPES } from '../utils/events'
import settingsStore from '../stores/settingsStore'
import { Settings, SocketData } from '@shared/types'
import { sendMessageToApp } from '../services/apps'
import { getAppByName } from './configHandler'

export class MusicHandler {
  private static instance: MusicHandler
  private refreshInterval: NodeJS.Timeout | null = null
  private currentApp: string | null = null

  private constructor() {
    this.initializeRefreshInterval()
  }

  public static getInstance(): MusicHandler {
    if (!MusicHandler.instance) {
      MusicHandler.instance = new MusicHandler()
    }
    return MusicHandler.instance
  }

  private async initializeRefreshInterval(): Promise<void> {
    const settings = await settingsStore.getSettings() // Get from your settings store
    this.updateRefreshInterval(settings.refreshInterval)
    dataListener.on(MESSAGE_TYPES.SETTINGS, this.handleSettingsUpdate)

    setTimeout(() => {
      this.refreshMusicData()
    }, 5000) // Delay to ensure settings are loaded
  }

  private handleSettingsUpdate = (settings: Settings): void => {
    this.updateRefreshInterval(settings.refreshInterval)

    dataListener.asyncEmit(
      MESSAGE_TYPES.LOGGING,
      `[MusicHandler]: Received settings update - checking for changes | Playback location: ${settings.playbackLocation}`
    )
    if (settings.playbackLocation) {
      dataListener.asyncEmit(
        MESSAGE_TYPES.LOGGING,
        `[MusicHandler]: Setting restarting to use ${settings.playbackLocation}`
      )
      this.currentApp = settings.playbackLocation
      this.refreshMusicData()
    }
  }

  public updateRefreshInterval(refreshRate: number): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }

    if (refreshRate < 0) {
      dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, `[MusicHandler]: Cancelling Refresh Interval!`)
      return
    }

    this.refreshInterval = setInterval(() => {
      this.refreshMusicData()
    }, refreshRate)
  }

  private async refreshMusicData(): Promise<void> {
    if (!this.currentApp || this.currentApp.length == 0) {
      dataListener.asyncEmit(
        MESSAGE_TYPES.ERROR,
        `[MusicHandler]: No playback location set! Go to settings -> Music to set the playback location!`
      )
      return
    }

    const app = await getAppByName(this.currentApp)

    if (!app || app.running == false) {
      dataListener.asyncEmit(
        MESSAGE_TYPES.ERROR,
        `[MusicHandler]: App ${this.currentApp} not found or not running!!`
      )
    }

    try {
      await sendMessageToApp(this.currentApp, { type: 'get', request: 'refresh', payload: '' })
      dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, `[MusicHandler]: Refreshing Music Data!`)
    } catch (error) {
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `[MusicHandler]: Music refresh failed: ${error}`)
    }
  }

  public async setAudioSource(source: string): Promise<void> {
    if (source.length == 0) {
      dataListener.asyncEmit(
        MESSAGE_TYPES.ERROR,
        `[MusicHandler]: Unable to update playback location. No playback location passed!`
      )
      return
    }
    dataListener.asyncEmit(
      MESSAGE_TYPES.LOGGING,
      `[MusicHandler]: Setting Playback Location to ${source}`
    )
    this.currentApp = source
  }

  public async handleClientRequest(request: SocketData): Promise<void> {
    if (!this.currentApp) {
      const settings = await settingsStore.getSettings()
      if (settings.playbackLocation) {
        this.currentApp = settings.playbackLocation
      } else {
        dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `[MusicHandler]: No playback location set!`)
        return
      }
    }

    if (this.currentApp == 'none') {
      dataListener.asyncEmit(
        MESSAGE_TYPES.ERROR,
        `[MusicHandler]: Playback location is 'none' ! Go to settings -> Music to set the playback location!`
      )
      return
    }

    if (request.app != 'music' && request.app != 'utility') return

    if (request.app == 'utility') {
      dataListener.asyncEmit(
        MESSAGE_TYPES.LOGGING,
        `[MusicHandler]: Legacy Name called! Support for this will be dropped in future updates. Migrate your app to use 'music' instead!`
      )
    }

    dataListener.asyncEmit(
      MESSAGE_TYPES.LOGGING,
      `[MusicHandler]: ${request.type} ${request.request}`
    )

    sendMessageToApp(this.currentApp, {
      type: request.type,
      request: request.request,
      payload: request.payload
    })
  }
}

export default MusicHandler.getInstance()
