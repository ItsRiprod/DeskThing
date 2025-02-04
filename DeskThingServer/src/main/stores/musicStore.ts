/**
 * The MusicStore class is responsible for managing the music playback functionality in the application.
 * It handles the initialization of the refresh interval, updates to the settings, finding the current playback source,
 * refreshing the music data, setting the audio source, and handling client requests and music messages.
 */
console.log('[Music Handler] Starting')
import { settingsStore, appStore } from '.'
import Logger from '@server/utils/logger'
import { Settings, SocketData, MESSAGE_TYPES, SongData, OutgoingEvent } from '@shared/types'
import { getAppByName } from '../services/files/appService'
import { sendMessageToClients } from '../services/client/clientCom'
import { getColorFromImage } from '../services/music/musicUtils'
// import { getNowPlaying } from '../services/music/musicController'

export class MusicStore {
  private static instance: MusicStore
  private refreshInterval: NodeJS.Timeout | null = null
  private currentApp: string | null = null

  private constructor() {
    setTimeout(() => {
      this.initializeRefreshInterval()
    }, 3000)
  }

  public static getInstance(): MusicStore {
    if (!MusicStore.instance) {
      MusicStore.instance = new MusicStore()
    }
    return MusicStore.instance
  }

  private async initializeRefreshInterval(): Promise<void> {
    const settings = await settingsStore.getSettings() // Get from your settings store
    this.currentApp = settings.playbackLocation || 'none'

    this.updateRefreshInterval(settings.refreshInterval)
    settingsStore.addListener(this.handleSettingsUpdate.bind(this))

    setTimeout(() => {
      Logger.log(MESSAGE_TYPES.DEBUG, '[MusicStore]: Initialized')
      this.refreshMusicData()
    }, 3000) // Delay to ensure settings are loaded
  }

  private handleSettingsUpdate = async (settings: Settings): Promise<void> => {
    this.updateRefreshInterval(settings.refreshInterval)

    Logger.info(
      `Received settings update - checking for changes | Playback location: ${this.currentApp} -> ${settings.playbackLocation}`,
      {
        source: 'MusicStore',
        function: 'handleSettingsUpdate'
      }
    )
    if (settings.playbackLocation) {
      Logger.info(`Setting restarting to use ${settings.playbackLocation}`, {
        source: 'MusicStore',
        function: 'handleSettingsUpdate'
      })
      this.currentApp = settings.playbackLocation
      this.refreshMusicData()
    }
  }

  public updateRefreshInterval = async (refreshRate: number): Promise<void> => {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }

    if (refreshRate < 0) {
      Logger.log(MESSAGE_TYPES.LOGGING, `[MusicStore]: Cancelling Refresh Interval!`)
      return
    } else if (refreshRate < 5) {
      Logger.log(
        MESSAGE_TYPES.WARNING,
        `[MusicStore]: Refresh Interval is ${refreshRate}! Performance may be impacted`
      )
      if (refreshRate < 1) {
        Logger.log(
          MESSAGE_TYPES.WARNING,
          `[MusicStore]: Refresh Interval is ${refreshRate}! This could very well end your system. Highly unrecommended. Please change this ASAP!`
        )
      }
    }

    this.refreshInterval = setInterval(() => {
      this.refreshMusicData()
    }, refreshRate)
  }

  private async findCurrentPlaybackSource(): Promise<string | null> {
    if (this.currentApp && this.currentApp != 'none') {
      return this.currentApp
    } else {
      Logger.log(
        MESSAGE_TYPES.LOGGING,
        `[MusicStore]: Current app is not set! Attempting to find one...`
      )
    }

    const settings = await settingsStore.getSettings()

    if (settings.playbackLocation && settings.playbackLocation != 'none') {
      Logger.log(
        MESSAGE_TYPES.LOGGING,
        `[MusicStore]: Fount ${settings.playbackLocation} in settings. Setting playback location to i!`
      )
      return settings.playbackLocation
    } else {
      Logger.log(
        MESSAGE_TYPES.LOGGING,
        `[MusicStore]: Unable to find a playback from settings! ${settings.playbackLocation}`
      )
    }

    const Apps = appStore.getAllBase()

    const audioSource = Apps.find((app) => app.manifest?.isAudioSource)

    if (audioSource) {
      Logger.log(
        MESSAGE_TYPES.WARNING,
        `[MusicStore]: Found ${audioSource.name} as an audio source automatically. Applying.`
      )
      return audioSource.name
    } else {
      Logger.log(
        MESSAGE_TYPES.LOGGING,
        `[MusicStore]: Unable to automatically set an audio source. No app found!`
      )
      return null
    }
  }

  private async getPlaybackSource(): Promise<string | null> {
    if (this.currentApp == 'disabled') {
      Logger.log(MESSAGE_TYPES.LOGGING, `[MusicStore]: Music is disabled! Cancelling refresh`)
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
        Logger.log(
          MESSAGE_TYPES.ERROR,
          `[MusicStore]: No Audiosource Found! Go to Downloads -> Apps and download an audio source! (Spotify, MediaWin, GMP, etc)`
        )
        return null
      }
    }

    if (!this.currentApp || this.currentApp.length == 0) {
      // Attempt to get audiosource from settings
      const currentApp = (await settingsStore.getSettings()).playbackLocation
      if (!currentApp || currentApp.length == 0) {
        Logger.log(
          MESSAGE_TYPES.ERROR,
          `[MusicStore]: No playback location set! Go to settings -> Music to set the playback location!`
        )
        return null
      } else {
        Logger.log(
          MESSAGE_TYPES.WARNING,
          `[MusicStore]: Playback location was not set! Setting to ${currentApp}`
        )
        this.currentApp = currentApp
      }
    }

    const app = await getAppByName(this.currentApp)

    if (!app || app.running == false) {
      Logger.log(
        MESSAGE_TYPES.ERROR,
        `[MusicStore]: App ${this.currentApp} is not found or not running!`
      )
      return null
    }

    return this.currentApp
  }

  private async refreshMusicData(): Promise<void> {
    const currentApp = await this.getPlaybackSource()

    Logger.log(MESSAGE_TYPES.LOGGING, `[MusicStore]: Attempting to refresh Music Data!`)

    if (!currentApp) {
      Logger.log(MESSAGE_TYPES.LOGGING, `[MusicStore]: No playback source set or found!`)
      return
    }

    try {
      const { appStore } = await import('@server/stores')
      appStore.sendDataToApp(currentApp, { type: 'get', request: 'refresh', payload: '' })
      Logger.log(MESSAGE_TYPES.LOGGING, `[MusicStore]: Refreshed with ${currentApp}!`)
    } catch (error) {
      Logger.log(MESSAGE_TYPES.ERROR, `[MusicStore]: Music refresh failed: ${error}`)
    }
  }

  public async setAudioSource(source: string): Promise<void> {
    if (source.length == 0) {
      Logger.log(
        MESSAGE_TYPES.ERROR,
        `[MusicStore]: Unable to update playback location. No playback location passed!`
      )
      return
    }
    Logger.log(MESSAGE_TYPES.LOGGING, `[MusicStore]: Setting Playback Location to ${source}`)
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
      Logger.log(
        MESSAGE_TYPES.LOGGING,
        `[MusicStore]: Legacy Name called! Support for this will be dropped in future updates. Migrate your app to use 'music' instead!`
      )
    }

    Logger.log(MESSAGE_TYPES.LOGGING, `[MusicStore]: ${request.type} ${request.request}`)

    const { appStore } = await import('@server/stores')
    appStore.sendDataToApp(currentApp, {
      type: request.type as OutgoingEvent,
      request: request.request,
      payload: request.payload
    })
  }

  public async handleMusicMessage(songData: SongData): Promise<void> {
    if (!songData || typeof songData !== 'object') {
      Logger.log(MESSAGE_TYPES.ERROR, '[MusicStore]: Invalid song data received')
      return
    }

    try {
      if (songData.thumbnail) {
        const color = await getColorFromImage(songData.thumbnail)
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

      Logger.log(MESSAGE_TYPES.LOGGING, '[MusicStore]: Song data sent to clients')
    } catch (error) {
      Logger.log(MESSAGE_TYPES.ERROR, `[MusicStore]: Failed to send song data: ${error}`)
    }
  }
}

export default MusicStore.getInstance()
