console.log('[Music Handler] Starting')
import loggingStore from '../stores/loggingStore'
import settingsStore from '../stores/settingsStore'
import { Settings, SocketData, MESSAGE_TYPES, SongData } from '@shared/types'
import { sendMessageToApp } from '../services/apps'
import { getAppByName } from './configHandler'
import appState from '../services/apps/appState'
import { sendMessageToClients } from '../services/client/clientCom'

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
    this.currentApp = settings.playbackLocation || 'none'

    this.updateRefreshInterval(settings.refreshInterval)
    settingsStore.addListener(this.handleSettingsUpdate.bind(this))

    setTimeout(() => {
      loggingStore.log(MESSAGE_TYPES.DEBUG, '[MusicHandler]: Initialized')
      this.refreshMusicData()
    }, 5000) // Delay to ensure settings are loaded
  }

  private handleSettingsUpdate = async (settings: Settings): Promise<void> => {
    this.updateRefreshInterval(settings.refreshInterval)

    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `[MusicHandler]: Received settings update - checking for changes | Playback location: ${this.currentApp} -> ${settings.playbackLocation}`
    )
    if (settings.playbackLocation) {
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `[MusicHandler]: Setting restarting to use ${settings.playbackLocation}`
      )
      this.currentApp = settings.playbackLocation
      this.refreshMusicData()
    }
  }

  public updateRefreshInterval = async (refreshRate: number): Promise<void> => {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }

    if (refreshRate < 0) {
      loggingStore.log(MESSAGE_TYPES.LOGGING, `[MusicHandler]: Cancelling Refresh Interval!`)
      return
    } else if (refreshRate < 5) {
      loggingStore.log(
        MESSAGE_TYPES.WARNING,
        `[MusicHandler]: Refresh Interval is ${refreshRate}! Performance may be impacted`
      )
      return
    }

    this.refreshInterval = setInterval(() => {
      this.refreshMusicData()
    }, refreshRate)
  }

  private async findCurrentPlaybackSource(): Promise<string | null> {
    if (this.currentApp && this.currentApp != 'none') {
      return this.currentApp
    } else {
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `[MusicHandler]: Current app is not set! Attempting to find one...`
      )
    }

    const settings = await settingsStore.getSettings()

    if (settings.playbackLocation && settings.playbackLocation != 'none') {
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `[MusicHandler]: Fount ${settings.playbackLocation} in settings. Setting playback location to i!`
      )
      return settings.playbackLocation
    } else {
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `[MusicHandler]: Unable to find a playback from settings! ${settings.playbackLocation}`
      )
    }

    const Apps = appState.getAllBase()

    const audioSource = Apps.find((app) => app.manifest?.isAudioSource)

    if (audioSource) {
      loggingStore.log(
        MESSAGE_TYPES.WARNING,
        `[MusicHandler]: Found ${audioSource.name} as an audio source automatically. Applying.`
      )
      return audioSource.name
    } else {
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `[MusicHandler]: Unable to automatically set an audio source. No app found!`
      )
      return null
    }
  }

  private async getPlaybackSource(): Promise<string | null> {
    if (this.currentApp == 'disabled') {
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `[MusicHandler]: Music is disabled! Cancelling refresh`
      )
      const settings = await settingsStore.getSettings()
      if (settings.refreshInterval > 0) {
        settingsStore.updateSetting('refreshInterval', -1)
      }
      return null
    }

    if (this.currentApp == 'none') {
      const app = await this.findCurrentPlaybackSource()
      if (app) {
        this.currentApp = app
        settingsStore.updateSetting('playbackLocation', app)
        return app
      } else {
        loggingStore.log(
          MESSAGE_TYPES.ERROR,
          `[MusicHandler]: No Audiosource Found! Go to Downloads -> Apps and download an audio source! (Spotify, MediaWin, GMP, etc)`
        )
        return null
      }
    }

    if (!this.currentApp || this.currentApp.length == 0) {
      // Attempt to get audiosource from settings
      const currentApp = (await settingsStore.getSettings()).playbackLocation
      if (!currentApp || currentApp.length == 0) {
        loggingStore.log(
          MESSAGE_TYPES.ERROR,
          `[MusicHandler]: No playback location set! Go to settings -> Music to set the playback location!`
        )
        return null
      } else {
        loggingStore.log(
          MESSAGE_TYPES.WARNING,
          `[MusicHandler]: Playback location was not set! Setting to ${currentApp}`
        )
        this.currentApp = currentApp
      }
    }

    const app = await getAppByName(this.currentApp)

    if (!app || app.running == false) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `[MusicHandler]: App ${this.currentApp} is not found or not running!`
      )
      return null
    }

    return this.currentApp
  }

  private async refreshMusicData(): Promise<void> {
    const currentApp = await this.getPlaybackSource()

    if (!currentApp) {
      return
    }

    try {
      await sendMessageToApp(currentApp, { type: 'get', request: 'refresh', payload: '' })
      loggingStore.log(MESSAGE_TYPES.LOGGING, `[MusicHandler]: Refreshing Music Data!`)
    } catch (error) {
      loggingStore.log(MESSAGE_TYPES.ERROR, `[MusicHandler]: Music refresh failed: ${error}`)
    }
  }

  public async setAudioSource(source: string): Promise<void> {
    if (source.length == 0) {
      loggingStore.log(
        MESSAGE_TYPES.ERROR,
        `[MusicHandler]: Unable to update playback location. No playback location passed!`
      )
      return
    }
    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `[MusicHandler]: Setting Playback Location to ${source}`
    )
    settingsStore.updateSetting('playbackLocation', source)
    this.currentApp = source
  }

  public async handleClientRequest(request: SocketData): Promise<void> {
    const currentApp = await this.getPlaybackSource()

    if (!currentApp) {
      return
    }

    if (request.app != 'music' && request.app != 'utility') return

    if (request.app == 'utility') {
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `[MusicHandler]: Legacy Name called! Support for this will be dropped in future updates. Migrate your app to use 'music' instead!`
      )
    }

    loggingStore.log(MESSAGE_TYPES.LOGGING, `[MusicHandler]: ${request.type} ${request.request}`)

    sendMessageToApp(currentApp, {
      type: request.type,
      request: request.request,
      payload: request.payload
    })
  }

  public async handleMusicMessage(songData: SongData): Promise<void> {
    if (!songData || typeof songData !== 'object') {
      loggingStore.log(MESSAGE_TYPES.ERROR, '[MusicHandler]: Invalid song data received')
      return
    }

    try {
      if (songData.thumbnail) {
        const { getAverageColor } = await import('fast-average-color-node')
        const color = await getAverageColor(songData.thumbnail)
        const songDataWithColor = {
          ...songData,
          color: color
        }
        await sendMessageToClients({
          type: 'song',
          app: 'client',
          payload: songDataWithColor
        })
      } else {
        await sendMessageToClients({
          type: 'song',
          app: 'client',
          payload: songData
        })
      }

      loggingStore.log(MESSAGE_TYPES.LOGGING, '[MusicHandler]: Song data sent to clients')
    } catch (error) {
      loggingStore.log(MESSAGE_TYPES.ERROR, `[MusicHandler]: Failed to send song data: ${error}`)
    }
  }
}

export default MusicHandler.getInstance()
