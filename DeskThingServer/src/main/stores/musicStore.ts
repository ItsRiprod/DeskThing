/**
 * MusicStore implementation that delegates to the MusicService
 * This maintains compatibility with the MusicStoreClass interface
 */
import { MusicStoreClass } from '@shared/stores/musicStore'
import { CacheableStore } from '@shared/types'
import { MusicEventPayloads } from '@deskthing/types'
import { SettingsStoreClass } from '@shared/stores/settingsStore'
import { AppStoreClass } from '@shared/stores/appStore'
import { PlatformStoreClass } from '@shared/stores/platformStore'
import { MusicService } from '../services/music/MusicService'

export class MusicStore implements CacheableStore, MusicStoreClass {
  private musicService: MusicService

  constructor(
    settingsStore: SettingsStoreClass,
    appStore: AppStoreClass,
    platformStore: PlatformStoreClass
  ) {
    this.musicService = new MusicService(settingsStore, appStore, platformStore)
    this.musicService.initialize()
  }

  get initialized(): boolean {
    return this.musicService.initialized
  }

  async initialize(): Promise<void> {
    return this.musicService.initialize()
  }

  async clearCache(): Promise<void> {
    return this.musicService.clearCache()
  }

  async saveToFile(): Promise<void> {
    return this.musicService.saveToFile()
  }

  async updateRefreshInterval(refreshRate: number): Promise<void> {
    return this.musicService.updateRefreshInterval(refreshRate)
  }

  async setAudioSource(source: string): Promise<void> {
    return this.musicService.setAudioSource(source)
  }

  async handleClientRequest(request: MusicEventPayloads): Promise<void> {
    return this.musicService.handleClientRequest(request)
  }
}

// /**
//  * The MusicStore class is responsible for managing the music playback functionality in the application.
//  * It handles the initialization of the refresh interval, updates to the settings, finding the current playback source,
//  * refreshing the music data, setting the audio source, and handling client requests and music messages.
//  */
// // Types
// import { MusicStoreClass } from '@shared/stores/musicStore'
// import {
//   LOGGING_LEVELS,
//   SongData,
//   MusicEventPayloads,
//   APP_REQUESTS,
//   DESKTHING_DEVICE,
//   SongEvent,
//   AUDIO_REQUESTS,
//   Client,
//   DeviceToDeskthingData
// } from '@deskthing/types'
// import { CacheableStore, Settings } from '@shared/types'
// import { SettingsStoreClass } from '@shared/stores/settingsStore'
// import { AppStoreClass } from '@shared/stores/appStore'

// // Utils
// import Logger from '@server/utils/logger'
// import { getAppByName } from '../services/files/appFileService'
// import { getColorFromImage } from '../services/music/musicUtils'
// import { PlatformStoreClass, PlatformStoreEvent } from '@shared/stores/platformStore'
// import { AppProcessListener } from '@shared/stores/appProcessStore'
// import { songCache, SongCacheEvents } from '../services/music/songCache'

// export class MusicStore implements CacheableStore, MusicStoreClass {
//   private refreshInterval: NodeJS.Timeout | null = null
//   private currentApp: string | null = null

//   private _initialized: boolean = false
//   public get initialized(): boolean {
//     return this._initialized
//   }

//   // DI stores
//   private settingsStore: SettingsStoreClass
//   private appStore: AppStoreClass
//   private platformStore: PlatformStoreClass

//   constructor(
//     settingsStore: SettingsStoreClass,
//     appStore: AppStoreClass,
//     platformStore: PlatformStoreClass
//   ) {
//     this.settingsStore = settingsStore
//     this.appStore = appStore
//     this.platformStore = platformStore
//     this.initializeListeners()
//   }

//   async initialize(): Promise<void> {
//     if (this._initialized) return
//     this._initialized = true
//     this.appStore.initialize()
//     this.settingsStore.initialize()
//     this.initializeRefreshInterval()
//   }

//   /**
//    * @implements CacheableStore
//    */
//   clearCache = async (): Promise<void> => {
//     songCache.clear()
//   }
//   /**
//    * @implements CacheableStore
//    */
//   saveToFile = async (): Promise<void> => {
//     /**
//      * Save to file logic here if needed
//      */
//   }

//   private async initializeListeners(): Promise<void> {
//     this.platformStore.on(PlatformStoreEvent.DATA_RECEIVED, async (data) => {
//       await this.initialize()
//       Logger.debug(`Received data from ${data.client.connectionId}`, {
//         source: 'MusicStore',
//         function: 'initializeListeners'
//       })
//       await this.handleDataReceived(data)
//     })
//     this.appStore.onAppMessage(APP_REQUESTS.SONG, (data) => {
//       this.initialize()
//       Logger.debug('Received music data from app process', {
//         source: 'MusicStore',
//         function: 'handleMusicMessage'
//       })
//       this.handleMusicMessage(data)
//     })

//     this.settingsStore.addListener((data) => {
//       this.initialize()
//       this.handleSettingsUpdate(data)
//     })

//     songCache.on(SongCacheEvents.SONG_ENDED, () => {
//       this.refreshMusicData()
//     })
//   }

//   private handleDataReceived = (data: { client: Client; data: DeviceToDeskthingData }): void => {
//     if (data.data.type === SongEvent.GET) {
//       const cachedSong = songCache.getCurrentSong()
//       if (cachedSong) {
//         this.platformStore.sendDataToClient({
//           type: DESKTHING_DEVICE.MUSIC,
//           app: 'client',
//           payload: cachedSong,
//           clientId: data.client.connectionId
//         })
//         return
//       }
//     }

//     if (data.data.type === SongEvent.SET || data.data.type === SongEvent.GET) {
//       this.handleClientRequest(data.data)
//     }
//   }

//   private async initializeRefreshInterval(): Promise<void> {
//     const settings = await this.settingsStore.getSettings() // Get from your settings store
//     this.currentApp = settings?.playbackLocation || 'none'

//     Logger.debug(`Initializing the current app to ${this.currentApp}`)

//     if (!settings) return

//     this.updateRefreshInterval(settings?.refreshInterval)

//     this.refreshMusicData()
//   }

//   private handleSettingsUpdate = async (settings: Settings): Promise<void> => {
//     this.updateRefreshInterval(settings.refreshInterval)

//     Logger.info(
//       `Received settings update - checking for changes | Playback location: ${this.currentApp} -> ${settings.playbackLocation}`,
//       {
//         source: 'MusicStore',
//         function: 'handleSettingsUpdate'
//       }
//     )
//     if (settings.playbackLocation) {
//       Logger.info(`Setting restarting to use ${settings.playbackLocation}`, {
//         source: 'MusicStore',
//         function: 'handleSettingsUpdate'
//       })
//       this.currentApp = settings.playbackLocation
//       this.refreshMusicData()
//     }
//   }

//   public updateRefreshInterval = async (refreshRate: number): Promise<void> => {
//     if (this.refreshInterval) {
//       clearInterval(this.refreshInterval)
//     }

//     if (refreshRate < 0) {
//       Logger.log(LOGGING_LEVELS.LOG, `[MusicStore]: Cancelling Refresh Interval!`)
//       return
//     } else if (refreshRate < 5) {
//       Logger.log(
//         LOGGING_LEVELS.WARN,
//         `[MusicStore]: Refresh Interval is ${refreshRate}! Performance may be impacted`
//       )
//       if (refreshRate < 1) {
//         Logger.log(
//           LOGGING_LEVELS.WARN,
//           `[MusicStore]: Refresh Interval is ${refreshRate}! This could very well end your system. Highly unrecommended. Please change this ASAP!`
//         )
//       }
//     }

//     this.refreshInterval = setInterval(() => {
//       this.refreshMusicData()
//     }, refreshRate)
//   }

//   private async findCurrentPlaybackSource(): Promise<string | null> {
//     if (this.currentApp && this.currentApp != 'none') {
//       return this.currentApp
//     } else {
//       Logger.log(
//         LOGGING_LEVELS.LOG,
//         `[MusicStore]: Current app is not set! Attempting to find one...`
//       )
//     }

//     const settings = await this.settingsStore.getSettings()

//     if (settings?.playbackLocation && settings?.playbackLocation != 'none') {
//       Logger.log(
//         LOGGING_LEVELS.LOG,
//         `[MusicStore]: Fount ${settings.playbackLocation} in settings. Setting playback location to i!`
//       )
//       return settings.playbackLocation
//     } else {
//       Logger.log(
//         LOGGING_LEVELS.LOG,
//         `[MusicStore]: Unable to find a playback from settings! ${settings?.playbackLocation}`
//       )
//     }

//     const Apps = this.appStore.getAllBase()

//     const audioSource = Apps.find((app) => app.manifest?.isAudioSource)

//     if (audioSource) {
//       Logger.log(
//         LOGGING_LEVELS.WARN,
//         `[MusicStore]: Found ${audioSource.name} as an audio source automatically. Applying.`
//       )
//       return audioSource.name
//     } else {
//       Logger.log(
//         LOGGING_LEVELS.LOG,
//         `[MusicStore]: Unable to automatically set an audio source. No app found!`
//       )
//       return null
//     }
//   }

//   private async getPlaybackSource(): Promise<string | null> {
//     if (this.currentApp == 'disabled') {
//       Logger.log(LOGGING_LEVELS.LOG, `[MusicStore]: Music is disabled! Cancelling refresh`)
//       const settings = await this.settingsStore.getSettings()
//       if (!settings || settings?.refreshInterval > 0) {
//         this.settingsStore.updateSetting('refreshInterval', -1)
//       }
//       return null
//     }

//     Logger.debug(`[MusicStore]: Current App: ${this.currentApp}`)

//     if (this.currentApp == 'none') {
//       const app = await this.findCurrentPlaybackSource()
//       if (app) {
//         this.currentApp = app
//         this.settingsStore.updateSetting('playbackLocation', app)
//         return app
//       } else {
//         Logger.log(
//           LOGGING_LEVELS.ERROR,
//           `[MusicStore]: No Audiosource Found! Go to Downloads -> Apps and download an audio source! (Spotify, MediaWin, GMP, etc)`
//         )
//         return null
//       }
//     }

//     if (!this.currentApp || this.currentApp.length == 0) {
//       // Attempt to get audiosource from settings
//       const currentApp = (await this.settingsStore.getSettings())?.playbackLocation
//       if (!currentApp || currentApp.length == 0) {
//         Logger.log(
//           LOGGING_LEVELS.ERROR,
//           `[MusicStore]: No playback location set! Go to settings -> Music to set the playback location!`
//         )
//         return null
//       } else {
//         Logger.log(
//           LOGGING_LEVELS.WARN,
//           `[MusicStore]: Playback location was not set! Setting to ${currentApp}`
//         )
//         this.currentApp = currentApp
//       }
//     }

//     if (!this.currentApp) {
//       Logger.log(
//         LOGGING_LEVELS.ERROR,
//         `[MusicStore]: No playback location set! Go to settings -> Music to set the playback location!`
//       )
//       return null
//     }

//     const app = await getAppByName(this.currentApp)

//     if (!app || app.running == false) {
//       Logger.log(
//         LOGGING_LEVELS.ERROR,
//         `[MusicStore]: App ${this.currentApp} is not found or not running!`
//       )
//       return null
//     }

//     return this.currentApp
//   }

//   private async refreshMusicData(): Promise<void> {
//     const currentApp = await this.getPlaybackSource()

//     Logger.log(LOGGING_LEVELS.LOG, `[MusicStore]: Attempting to refresh Music Data!`)

//     if (!currentApp) {
//       Logger.log(LOGGING_LEVELS.LOG, `[MusicStore]: No playback source set or found!`)
//       return
//     }

//     try {
//       this.appStore.sendDataToApp(currentApp, {
//         type: SongEvent.GET,
//         request: AUDIO_REQUESTS.REFRESH,
//         app: 'music'
//       })
//       Logger.log(LOGGING_LEVELS.LOG, `[MusicStore]: Refreshed with ${currentApp}!`)
//     } catch (error) {
//       Logger.log(LOGGING_LEVELS.ERROR, `[MusicStore]: Music refresh failed: ${error}`)
//     }
//   }

//   public async setAudioSource(source: string): Promise<void> {
//     if (source.length == 0) {
//       Logger.log(
//         LOGGING_LEVELS.ERROR,
//         `[MusicStore]: Unable to update playback location. No playback location passed!`
//       )
//       return
//     }
//     Logger.log(LOGGING_LEVELS.LOG, `[MusicStore]: Setting Playback Location to ${source}`)
//     this.settingsStore.updateSetting('playbackLocation', source)
//     this.currentApp = source
//   }

//   public async handleClientRequest(songData: MusicEventPayloads): Promise<void> {
//     const currentApp = await this.getPlaybackSource()

//     if (!currentApp) {
//       Logger.debug(`[MusicStore]: No current app found!`)
//       return
//     }

//     Logger.debug(`[MusicStore]: Received request for ${currentApp}`)

//     Logger.debug(`${JSON.stringify(songData)}`)

//     if (songData.app != 'music' && songData.app != 'utility') return

//     // Legacy warning
//     if ((songData.app as string) == 'utility') {
//       Logger.warn(
//         `[MusicStore]: Legacy Name called! Support for this will be dropped in future updates. Migrate your app to use 'music' instead!`,
//         {
//           domain: 'music',
//           source: 'musicStore',
//           function: 'handleClientRequest'
//         }
//       )
//       // Ensure app is music
//       songData.app = currentApp as 'music'
//     }

//     Logger.debug(`[MusicStore]: ${songData.type} ${songData.request} being sent to ${currentApp}`, {
//       domain: 'music',
//       source: 'musicStore',
//       function: 'handleClientRequest'
//     })

//     if (!songData.app || !songData.request || !songData.type) {
//       Logger.debug(`[MusicStore]: Invalid song data received: ${JSON.stringify(songData)}`, {
//         domain: 'music',
//         source: 'musicStore',
//         function: 'handleClientRequest'
//       })
//       return
//     }

//     Logger.debug(
//       `[MusicStore]: Sending data to ${currentApp} with payload ${JSON.stringify(songData)}`,
//       {
//         domain: 'music',
//         source: 'musicStore',
//         function: 'handleClientRequest'
//       }
//     )
//     this.appStore.sendDataToApp(currentApp, songData)
//   }

//   private handleMusicMessage: AppProcessListener<APP_REQUESTS.SONG> = async (
//     appData
//   ): Promise<void> => {
//     if (!appData || typeof appData !== 'object') {
//       Logger.log(LOGGING_LEVELS.ERROR, '[MusicStore]: Invalid song data received')
//       return
//     }

//     Logger.debug(`[MusicStore]: Received song data from ${appData.app}`, {
//       domain: 'music',
//       source: 'musicStore',
//       function: 'handleMusicMessage'
//     })

//     const songData = appData.payload

//     try {
//       let songDataWithColor: SongData = songData
//       if (songData.thumbnail) {
//         const color = await getColorFromImage(songData.thumbnail)
//         songDataWithColor = {
//           ...songData,
//           color: color
//         }
//       }

//       songCache.updateSong(songDataWithColor)

//       this.platformStore.broadcastToClients({
//         type: DESKTHING_DEVICE.MUSIC,
//         app: 'client',
//         payload: songDataWithColor
//       })

//       Logger.log(LOGGING_LEVELS.LOG, '[MusicStore]: Song data sent to clients')
//     } catch (error) {
//       Logger.log(LOGGING_LEVELS.ERROR, `[MusicStore]: Failed to send song data: ${error}`)
//     }
//   }
// }
