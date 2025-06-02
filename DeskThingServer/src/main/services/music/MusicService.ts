import {
  SongData,
  MusicEventPayloads,
  APP_REQUESTS,
  DESKTHING_DEVICE,
  SongEvent,
  AUDIO_REQUESTS,
  Client,
  DeviceToDeskthingData,
  LOGGING_LEVELS
} from '@deskthing/types'
import { Settings } from '@shared/types'
import { SettingsStoreClass } from '@shared/stores/settingsStore'
import { AppStoreClass } from '@shared/stores/appStore'
import { PlatformStoreClass, PlatformStoreEvent } from '@shared/stores/platformStore'
import Logger from '@server/utils/logger'
import { getAppByName } from '../files/appFileService'
import { MusicStoreClass } from '@shared/stores/musicStore'
import { SongCache, SongCacheEvents } from './songCache'
import { ColorExtractor } from './ColorExtractor'

/**
 * Core service that manages music playback functionality
 */
export class MusicService implements MusicStoreClass {
  private refreshInterval: NodeJS.Timeout | null = null
  private currentApp: string | null = null
  private songCache: SongCache
  private colorExtractor: ColorExtractor
  private _initialized: boolean = false

  public get initialized(): boolean {
    return this._initialized
  }

  constructor(
    private settingsStore: SettingsStoreClass,
    private appStore: AppStoreClass,
    private platformStore: PlatformStoreClass
  ) {
    this.songCache = new SongCache()
    this.colorExtractor = new ColorExtractor()
    this.initializeListeners()
  }

  async initialize(): Promise<void> {
    if (this._initialized) return
    this._initialized = true

    await this.appStore.initialize()
    await this.settingsStore.initialize()
    await this.initializeRefreshInterval()
  }

  async clearCache(): Promise<void> {
    this.songCache.clear()
  }

  async saveToFile(): Promise<void> {
    // No-op as per interface
  }

  async updateRefreshInterval(refreshRate: number): Promise<void> {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }

    if (refreshRate < 0) {
      Logger.log(LOGGING_LEVELS.LOG, `Music refresh disabled`)
      return
    }

    if (refreshRate < 5) {
      Logger.log(LOGGING_LEVELS.WARN, `Refresh interval of ${refreshRate}s may impact performance`)
      if (refreshRate < 1) {
        Logger.log(
          LOGGING_LEVELS.WARN,
          `Extremely low refresh interval (${refreshRate}s) could cause system issues`
        )
      }
    }

    this.refreshInterval = setInterval(() => {
      this.refreshMusicData()
    }, refreshRate)
  }

  async setAudioSource(source: string): Promise<void> {
    if (!source) {
      Logger.log(LOGGING_LEVELS.ERROR, `Cannot update playback location: empty source provided`)
      return
    }

    Logger.log(LOGGING_LEVELS.LOG, `Setting playback location to ${source}`)
    await this.settingsStore.saveSetting('music_playbackLocation', source)
    this.currentApp = source

    // if (source === 'local') { TODO Native Local Audio
    //   await this.mediaStore.initialize()
    // } else {
    // }

    await this.refreshMusicData()
  }

  async handleClientRequest(songData: MusicEventPayloads): Promise<void> {
    const currentApp = await this.getPlaybackSource()

    if (!currentApp) {
      Logger.warn(`No audio source app available`)
      return
    }

    // Validate request data
    if (!songData.app || !songData.request || !songData.type) {
      Logger.warn(`Invalid song data received: ${JSON.stringify(songData)}`)
      return
    }

    // Handle legacy app name
    if ((songData.app as string) === 'utility') {
      Logger.warn(`Legacy app name 'utility' used - please migrate to 'music'`, {
        domain: 'music',
        function: 'handleClientRequest'
      })
      songData.app = 'music'
    }

    Logger.debug(`Sending ${songData.type} ${songData.request} to ${currentApp}`, {
      domain: 'music',
      function: 'handleClientRequest'
    })

    const currentSong = this.songCache.getCurrentSong()

    // if (currentApp === 'local') { TODO Native Local Audio
    //   this.mediaStore.handleMusicPayload(songData)
    // } else {
    await this.appStore.sendDataToApp(currentApp, songData)
    // }

    // Handle different audio control requests
    switch (songData.request) {
      case AUDIO_REQUESTS.PLAY:
        // Update cache to resume progress tracking
        this.refreshMusicData()
        break

      case AUDIO_REQUESTS.PAUSE:
        // Update cache to pause progress tracking
        if (currentSong) {
          this.songCache.updateSong({
            ...currentSong!,
            is_playing: false
          })
        } else {
          this.refreshMusicData()
        }
        break

      case AUDIO_REQUESTS.STOP:
        // Clear the cache when stopping
        this.songCache.clear()
        break

      case AUDIO_REQUESTS.SEEK:
        // Update track progress in cache
        if (currentSong && songData.payload) {
          this.songCache.updateSong({
            ...currentSong!,
            track_progress: songData.payload
          })
        }
        break

      // These requests don't need cache updates, just pass through
      case AUDIO_REQUESTS.NEXT:
      case AUDIO_REQUESTS.PREVIOUS:
      case AUDIO_REQUESTS.REWIND:
      case AUDIO_REQUESTS.FAST_FORWARD:
        this.refreshMusicData()
        break
      case AUDIO_REQUESTS.LIKE:
      case AUDIO_REQUESTS.VOLUME:
      case AUDIO_REQUESTS.REPEAT:
      case AUDIO_REQUESTS.SHUFFLE:
      case AUDIO_REQUESTS.REFRESH:
        break
    }
  }

  private async initializeListeners(): Promise<void> {
    // Listen for platform data
    this.platformStore.on(PlatformStoreEvent.DATA_RECEIVED, async (data) => {
      await this.initialize()
      await this.handleDataReceived(data)
    })
    this.platformStore.on(PlatformStoreEvent.CLIENT_CONNECTED, async (client) => {
      await this.initialize()
      const cachedSong = this.songCache.getCurrentSong()
      if (cachedSong) {
        await this.platformStore.sendDataToClient({
          type: DESKTHING_DEVICE.MUSIC,
          app: 'client',
          payload: cachedSong,
          clientId: client.clientId
        })
      }
    })

    // Listen for app messages
    this.appStore.onAppMessage(APP_REQUESTS.SONG, async (appData): Promise<void> => {
      if (!appData || typeof appData !== 'object') {
        Logger.log(LOGGING_LEVELS.ERROR, `Invalid song data received`)
        return
      }

      Logger.debug(`Received song data from ${appData.app}`, {
        domain: 'music',
        function: 'handleMusicMessage'
      })

      const songData = appData.payload

      await this.handleMusicPayload(songData)
    })

    // Listen for settings changes
    this.settingsStore.addSettingsListener((data) => {
      this.initialize()
      this.handleSettingsUpdate(data)
    })

    // Listen for song end events
    this.songCache.on(SongCacheEvents.SONG_ENDED, () => {
      this.refreshMusicData()
    })

    this.songCache.on(SongCacheEvents.SONG_CHANGED, (data) => {
      this.refreshMusicData(data)
    })
  }

  private handleMusicPayload = async (songData: SongData): Promise<void> => {
    this.initialize()

    try {
      let songDataWithColor: SongData = songData

      // Extract color from thumbnail if available
      if (songData.thumbnail) {
        const color = await this.colorExtractor.extractFromImage(songData.thumbnail)
        songDataWithColor = {
          ...songData,
          color: color
        }
      }

      // Update cache and broadcast to clients
      this.songCache.updateSong(songDataWithColor)
      const currentSong = this.songCache.getCurrentSong() // ensures the song is correctly filled with available data

      if (!currentSong) {
        Logger.debug(`No song data available to broadcast`)
        return
      }

      await this.platformStore.broadcastToClients({
        type: DESKTHING_DEVICE.MUSIC,
        app: 'client',
        payload: currentSong
      })

      Logger.log(LOGGING_LEVELS.LOG, `Song data sent to clients`)
    } catch (error) {
      Logger.log(LOGGING_LEVELS.ERROR, `Failed to process song data: ${error}`)
    }
  }

  private handleDataReceived = async (data: {
    client: Client
    data: DeviceToDeskthingData
  }): Promise<void> => {
    if (
      data.data.type === SongEvent.GET &&
      (data.data.request === AUDIO_REQUESTS.SONG || data.data.request === AUDIO_REQUESTS.REFRESH)
    ) {
      if (data.data.payload) {
        await this.refreshMusicData()
        return
      }

      Logger.debug(`Received request for song data from client ${data?.client?.clientId}`)

      const cachedSong = this.songCache.getCurrentSong()
      if (cachedSong) {
        await this.platformStore.sendDataToClient({
          type: DESKTHING_DEVICE.MUSIC,
          app: 'client',
          payload: cachedSong,
          clientId: data.client.clientId
        })
      }
      return
    }

    if (data.data.type === SongEvent.SET) {
      await this.handleClientRequest(data.data)
    }
  }

  private async initializeRefreshInterval(): Promise<void> {
    const settings = await this.settingsStore.getSettings()
    if (!settings) return

    this.currentApp = settings.music_playbackLocation || 'none'
    Logger.debug(`Initializing current app to ${this.currentApp}`)

    await this.updateRefreshInterval(settings.music_refreshInterval)
    await this.refreshMusicData()
  }

  private async handleSettingsUpdate(settings: Settings): Promise<void> {
    await this.updateRefreshInterval(settings.music_refreshInterval)

    if (settings.music_playbackLocation && settings.music_playbackLocation !== this.currentApp) {
      Logger.info(
        `Changing playback source: ${this.currentApp} → ${settings.music_playbackLocation}`
      )
      this.currentApp = settings.music_playbackLocation
      await this.refreshMusicData()
    }
  }

  private async findCurrentPlaybackSource(): Promise<string | null> {
    // Return current app if already set
    if (this.currentApp && this.currentApp !== 'none') {
      return this.currentApp
    }

    Logger.log(LOGGING_LEVELS.LOG, `Current app not set, attempting to find one`)

    // Try to get from settings
    const settings = await this.settingsStore.getSettings()
    if (settings?.music_playbackLocation && settings.music_playbackLocation !== 'none') {
      Logger.log(LOGGING_LEVELS.LOG, `Found ${settings.music_playbackLocation} in settings`)
      return settings.music_playbackLocation
    }

    // Try to find an audio source app automatically
    const apps = this.appStore.getAllBase()
    const audioSource = apps.find((app) => app.manifest?.isAudioSource)

    if (audioSource) {
      Logger.log(LOGGING_LEVELS.WARN, `Automatically selected ${audioSource.name} as audio source`)
      return audioSource.name
    }

    Logger.log(LOGGING_LEVELS.LOG, `No audio source app found`)
    return null
  }

  private async getPlaybackSource(): Promise<string | null> {
    // Check if music is disabled
    if (this.currentApp === 'disabled') {
      Logger.log(LOGGING_LEVELS.LOG, `Music is disabled`)
      const settings = await this.settingsStore.getSettings()
      if (!settings || settings.music_refreshInterval > 0) {
        await this.settingsStore.saveSetting('music_refreshInterval', -1)
      }
      return null
    }

    // Try to find a source if none is set
    if (this.currentApp === 'none') {
      const app = await this.findCurrentPlaybackSource()
      if (app) {
        this.currentApp = app
        await this.settingsStore.saveSetting('music_playbackLocation', app)
        return app
      } else {
        Logger.log(LOGGING_LEVELS.ERROR, `No audio source found. Please install an audio app.`)
        return null
      }
    }

    // Handle empty current app
    if (!this.currentApp) {
      const settings = await this.settingsStore.getSettings()
      const currentApp = settings?.music_playbackLocation

      if (!currentApp) {
        Logger.log(LOGGING_LEVELS.ERROR, `No playback location set in settings`)
        return null
      } else {
        Logger.log(LOGGING_LEVELS.WARN, `Setting playback location to ${currentApp}`)
        this.currentApp = currentApp
      }
    }

    // Verify the app exists and is running
    const app = await getAppByName(this.currentApp)
    if (!app || app.running === false) {
      Logger.log(LOGGING_LEVELS.ERROR, `App ${this.currentApp} is not found or not running`)
      return null
    }

    return this.currentApp
  }

  private async refreshMusicData(songData?: SongData): Promise<void> {
    if (songData) {
      await this.platformStore.broadcastToClients({
        type: DESKTHING_DEVICE.MUSIC,
        payload: songData,
        app: 'client'
      })
      return
    }

    const currentApp = await this.getPlaybackSource()
    Logger.log(LOGGING_LEVELS.LOG, `Attempting to refresh music data`)

    if (!currentApp) {
      Logger.log(LOGGING_LEVELS.LOG, `No playback source available`)
      return
    }

    try {
      await this.appStore.sendDataToApp(currentApp, {
        type: SongEvent.GET,
        request: AUDIO_REQUESTS.REFRESH,
        app: 'music'
      })
      Logger.log(LOGGING_LEVELS.LOG, `Refreshed music data from ${currentApp}`)
    } catch (error) {
      Logger.log(LOGGING_LEVELS.ERROR, `Music refresh failed: ${error}`)
    }
  }
}
