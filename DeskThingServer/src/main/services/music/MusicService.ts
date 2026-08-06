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
  /**
   * How long to wait for the answer to each attempt when chasing a track
   * change. Every entry is a request followed by that pause before looking at
   * the result, so the list is both the retry count and the total window —
   * about seven seconds, which comfortably covers the provider's own lag in
   * reporting a skip. The chase stops the moment the track is different, so
   * the usual cost is the first entry alone.
   */
  private static readonly TRACK_CHANGE_RETRY_DELAYS_MS = [600, 900, 1200, 1800, 2500]

  /** How long to wait for a refresh request to be handed off before moving on. */
  private static readonly REFRESH_SEND_TIMEOUT_MS = 2000

  /**
   * Poll cadence while a client is connected and something is playing. This is
   * the only thing that notices playback changed from the provider's own app on
   * another device, so it bounds how stale the screen can be in that case.
   * Costs one request per tick and, because the source only reports genuine
   * state changes, sends nothing to clients unless something actually changed.
   */
  private static readonly ACTIVE_REFRESH_INTERVAL_MS = 2000

  private chaseGeneration = 0
  private configuredRefreshRate = -1
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
      clearTimeout(this.refreshInterval)
      this.refreshInterval = null
    }

    this.configuredRefreshRate = refreshRate

    if (refreshRate < 0) {
      Logger.log(LOGGING_LEVELS.LOG, `Music refresh disabled`)
      return
    }

    if (refreshRate < 1000) {
      Logger.log(
        LOGGING_LEVELS.WARN,
        `Extremely low refresh interval (${refreshRate}ms) could cause system issues`
      )
    }

    this.scheduleRefresh()
  }

  /**
   * Pick the next poll delay from what is actually happening, and schedule one
   * poll at a time rather than running a fixed interval.
   *
   * A track that ends on its own, and a skip made from a connected client, are
   * both handled the moment they happen — one is predicted from the track's own
   * duration, the other is observed as a command. Neither needs the poll.
   *
   * What the poll is for is the case with no boundary to predict and no command
   * to observe: playback changed somewhere else entirely, from the provider's
   * own app on a phone or desktop. Nothing announces that, so the only way to
   * notice is to look — and at the configured 15s that meant a change made
   * elsewhere took up to 15s to appear, which is the whole of the delay users
   * still saw after the boundary work.
   *
   * So look often, but only while it can matter: something is connected to show
   * it, and something is actually playing. Idle or paused, this falls back to
   * the configured rate, because a poll that nobody can see is pure cost — and
   * cost here is provider rate limit, which is not free to spend.
   */
  private scheduleRefresh(): void {
    if (this.refreshInterval) {
      clearTimeout(this.refreshInterval)
      this.refreshInterval = null
    }

    if (this.configuredRefreshRate < 0) return

    const song = this.songCache.getCurrentSong()
    const someoneIsWatching = this.platformStore.getClients().length > 0
    const active = someoneIsWatching && song?.is_playing === true

    // Never poll slower than configured, and never faster than the active rate.
    const delay = active
      ? Math.min(MusicService.ACTIVE_REFRESH_INTERVAL_MS, this.configuredRefreshRate)
      : this.configuredRefreshRate

    this.refreshInterval = setTimeout(async () => {
      try {
        await this.refreshMusicData()
      } finally {
        // Reschedule from here rather than on a fixed interval, so a slow poll
        // cannot stack requests on top of itself.
        this.scheduleRefresh()
      }
    }, delay)
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

      // A skip has the same shape as a track boundary: we know playback is
      // about to be something else, but the provider will keep reporting the
      // old track for a moment. Asking once loses that race and drops the user
      // back onto the scheduled refresh, so chase it the same way.
      case AUDIO_REQUESTS.NEXT:
      case AUDIO_REQUESTS.PREVIOUS:
      case AUDIO_REQUESTS.REWIND:
      case AUDIO_REQUESTS.FAST_FORWARD:
        this.chaseTrackChange()
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
        await this.sendMusicToClient(client.clientId)
      }
      // Someone can see the screen now — start looking often enough to keep it
      // honest about changes made elsewhere.
      this.scheduleRefresh()
    })

    // ...and stop paying for that the moment nobody is watching.
    this.platformStore.on(PlatformStoreEvent.CLIENT_DISCONNECTED, () => {
      this.scheduleRefresh()
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
    this.settingsStore.on('music_playbackLocation', async (data) => {
      if (data && data !== this.currentApp) {
        Logger.info(`Changing playback source: ${this.currentApp} → ${data}`)
        this.currentApp = data
        await this.refreshMusicData()
      }
    })

    this.settingsStore.on('music_refreshInterval', async (data) => {
      await this.updateRefreshInterval(data)
    })

    // Listen for song end events
    this.songCache.on(SongCacheEvents.SONG_ENDED, () => {
      this.chaseTrackChange()
    })

    // Pausing or resuming changes whether a fast poll is worth paying for.
    this.songCache.on(SongCacheEvents.SONG_CHANGED, () => {
      this.scheduleRefresh()
    })

    // NOTE: SONG_CHANGED deliberately does not broadcast. handleMusicPayload
    // already broadcasts every payload it caches, and it broadcasts the
    // normalised copy — the one whose thumbnail has been rewritten to a URL
    // the client can actually fetch. Broadcasting again from here sent the raw
    // payload as a second, worse copy of the same update.
  }

  /**
   * Ask again, briefly, until the track we were told ended is actually gone.
   *
   * Asking once at the boundary reliably fails: the provider still reports the
   * finishing track for around a second afterwards, the change-detect gate
   * sees nothing new, and the update waits for the next scheduled poll — which
   * is how a one-second gap became a fifteen-second one.
   *
   * The ladder is short and stops the moment it has an answer, because an
   * unbounded retry at a track boundary is exactly how an account earns a
   * multi-hour Retry-After.
   */
  private async chaseTrackChange(): Promise<void> {
    // Only one chase should be in flight, but a later one must be able to
    // replace an earlier one rather than be dropped: it is chasing a different
    // change, from a different starting track. A plain "already chasing" flag
    // both discarded those and — worse — wedged permanently if a chase ever
    // failed to finish, silently disabling every future chase and sending
    // every skip back to the scheduled poll.
    const generation = ++this.chaseGeneration

    const leaving = this.songCache.getCurrentSong()
    const leavingId = leaving?.id
    const leavingName = leaving?.track_name
    const leavingProgress = leaving?.track_progress

    for (const wait of MusicService.TRACK_CHANGE_RETRY_DELAYS_MS) {
      if (generation !== this.chaseGeneration) return // superseded by a newer chase

      // Never let one request hold the chase open. A send that does not settle
      // would otherwise stall the whole ladder behind it.
      await Promise.race([
        this.refreshMusicData(undefined, { force: true }),
        new Promise((resolve) => setTimeout(resolve, MusicService.REFRESH_SEND_TIMEOUT_MS))
      ]).catch(() => {})

      // Wait BEFORE looking. refreshMusicData only hands the request to the
      // source app; the answer arrives later, over a separate message, and
      // updates the cache then. Checking immediately after sending always
      // reads the track we are trying to leave, so every attempt "fails" and
      // the chase gives up on a change it had in fact already asked for —
      // which is how a skip fell back to the scheduled poll and took a full
      // cycle instead of about a second.
      await new Promise((resolve) => setTimeout(resolve, wait))

      const now = this.songCache.getCurrentSong()
      if (!now) continue

      // Stop when the track is genuinely different. Repeat-one replays the
      // same id, so a progress collapse counts as a change too — otherwise
      // the chase would run to exhaustion on every looped track.
      const isDifferent = now.id !== leavingId || now.track_name !== leavingName
      const restarted =
        leavingProgress != null && now.track_progress != null && now.track_progress < leavingProgress

      if (isDifferent || restarted) return

      // Nothing is playing any more — there is no next track to wait for.
      if (now.is_playing === false) return
    }
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
        await this.sendMusicToClient(data.client.clientId)
      }
      return
    }

    if (data.data.type === SongEvent.SET) {
      await this.handleClientRequest(data.data)
    }
  }

  public async sendMusicToClient(clientId: string): Promise<void> {
    const currentSong = this.songCache.getCurrentSong()
    if (currentSong) {
      await this.platformStore.sendDataToClient({
        type: DESKTHING_DEVICE.MUSIC,
        app: 'client',
        payload: currentSong,
        clientId
      })
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

  private async refreshMusicData(
    songData?: SongData,
    options: { force?: boolean } = {}
  ): Promise<void> {
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
        app: 'music',
        // Tells the source not to answer from a coalesced in-flight request.
        // Only set when we already know playback changed, so the ordinary
        // cadence keeps its de-duplication.
        payload: options.force || undefined
      })
      Logger.log(LOGGING_LEVELS.LOG, `Refreshed music data from ${currentApp}`)
    } catch (error) {
      Logger.log(LOGGING_LEVELS.ERROR, `Music refresh failed: ${error}`)
    }
  }
}
