import { AUDIO_REQUESTS, MusicEventPayloads, SongData, SongEvent } from '@deskthing/types'
import logger from '@server/utils/logger'
// import { NowPlaying, NowPlayingMessage } from 'node-nowplaying'
import EventEmitter from 'node:events'

class NowPlaying {
  private callback: (message: NowPlayingMessage) => void

  constructor(callback: (message: NowPlayingMessage) => void) {
    this.callback = callback
  }

  async subscribe(): Promise<void> {
    this.callback({} as NowPlayingMessage)
  }

  async unsubscribe(): Promise<void> {
    // Mock unsubscribe
  }

  async play(): Promise<void> {
    // Mock play
  }

  async pause(): Promise<void> {
    // Mock pause
  }

  async nextTrack(): Promise<void> {
    // Mock next
  }

  async previousTrack(): Promise<void> {
    // Mock previous
  }

  async seekTo(_position: number): Promise<void> {
    // Mock seek
  }

  async setVolume(_volume: number): Promise<void> {
    // Mock setVolume
  }

  async shuffle(_enabled: boolean): Promise<void> {
    // Mock shuffle
  }

  async repeat(_mode: 'off' | 'track' | 'context'): Promise<void> {
    // Mock repeat
  }

  async getPlaybackState(): Promise<void> {
    // Mock getPlaybackState
  }

  async getCurrentTrack(): Promise<void> {
    // Mock getCurrentTrack
  }

  async setShuffle(_enabled: boolean): Promise<void> {
    // Mock setShuffle
  }
}
type NowPlayingMessage = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

interface MediaStoreEvents {
  update: [SongData]
}

export class MediaStore extends EventEmitter<MediaStoreEvents> {
  private player: NowPlaying
  private nowPlayingInfo: NowPlayingMessage | undefined = undefined

  private _isInitialized: boolean = false

  constructor() {
    super()
    this.player = new NowPlaying(this.handleMessage.bind(this))
  }

  public initialize = async (): Promise<void> => {
    if (this._isInitialized) return
    await this.player.subscribe()
    this._isInitialized = true
  }

  public cleanup = async (): Promise<void> => {
    this._isInitialized = false
    await this.player.unsubscribe()
    await this.clearCache()
  }

  public clearCache = async (): Promise<void> => {
    this.nowPlayingInfo = undefined
  }

  private handleMessage(message: NowPlayingMessage): void {
    this.nowPlayingInfo = message
    this.parseAndSendData()
  }

  private parseAndSendData(): void {
    if (!this.nowPlayingInfo) return
    const musicPayload: SongData = {
      album: this.nowPlayingInfo.album || null,
      artist: this.nowPlayingInfo.artist?.[0] || null,
      playlist: this.nowPlayingInfo.playlist || null,
      playlist_id: this.nowPlayingInfo.playlistId || null,
      track_name: this.nowPlayingInfo.trackName,
      shuffle_state: this.nowPlayingInfo.shuffleState || null,
      repeat_state: (this.nowPlayingInfo.repeatState as 'context' | 'track' | 'off') || 'off',
      is_playing: this.nowPlayingInfo.isPlaying,
      can_fast_forward: this.nowPlayingInfo.canFastForward,
      can_skip: this.nowPlayingInfo.canSkip,
      can_like: this.nowPlayingInfo.canLike,
      can_change_volume: this.nowPlayingInfo.canChangeVolume,
      can_set_output: this.nowPlayingInfo.canSetOutput,
      track_duration: this.nowPlayingInfo.trackDuration || null,
      track_progress: this.nowPlayingInfo.trackProgress || null,
      volume: this.nowPlayingInfo.volume,
      thumbnail: this.nowPlayingInfo.thumbnail || null,
      device: this.nowPlayingInfo.device || null,
      id: this.nowPlayingInfo.id || null,
      device_id: this.nowPlayingInfo.deviceId || null
    }
    this.emit('update', musicPayload)
  }

  // Song GET events
  public handleGetSong(): void {
    this.parseAndSendData()
  }
  public handleRefresh(): void {
    this.parseAndSendData()
  }

  // Song SET events
  public handleFastForward(data: { amount: number | undefined }): void {
    this.player.seekTo(data.amount || 0)
  }
  public handleLike(): void {
    logger.warn('Liking songs is not supported!')
  }
  public handleNext(): void {
    this.player.nextTrack()
  }
  public handlePause(): void {
    this.player.pause()
  }
  public handlePlay(): void {
    this.player.play()
  }
  public handlePrevious(): void {
    this.player.previousTrack()
  }
  public handleRepeat(): void {
    logger.warn('Repeating songs is not supported!')
  }
  public handleRewind(data: { amount: number | undefined }): void {
    this.player.seekTo(data.amount || 0)
  }
  public handleSeek(data: { positionMs: number }): void {
    this.player.seekTo(data.positionMs)
  }
  public handleShuffle(data: { shuffle: boolean }): void {
    this.player.setShuffle(data.shuffle)
  }
  public handleStop(): void {
    this.player.pause()
  }
  public handleVolume(data: { volume: number }): void {
    this.player.setVolume(data.volume)
  }

  public handleMusicPayload(data: MusicEventPayloads): void {
    switch (data.type) {
      case SongEvent.GET:
        switch (data.request) {
          case AUDIO_REQUESTS.SONG:
            this.handleGetSong()
            break
          case AUDIO_REQUESTS.REFRESH:
            this.handleRefresh()
            break
        }
        break
      case SongEvent.SET:
        switch (data.request) {
          case AUDIO_REQUESTS.FAST_FORWARD:
            this.handleFastForward({ amount: data.payload })
            break
          case AUDIO_REQUESTS.LIKE:
            this.handleLike()
            break
          case AUDIO_REQUESTS.NEXT:
            this.handleNext()
            break
          case AUDIO_REQUESTS.PAUSE:
            this.handlePause()
            break
          case AUDIO_REQUESTS.PLAY:
            this.handlePlay()
            break
          case AUDIO_REQUESTS.PREVIOUS:
            this.handlePrevious()
            break
          case AUDIO_REQUESTS.REPEAT:
            this.handleRepeat()
            break
          case AUDIO_REQUESTS.REWIND:
            this.handleRewind({ amount: data.payload })
            break
          case AUDIO_REQUESTS.SEEK:
            this.handleSeek({ positionMs: data.payload })
            break
          case AUDIO_REQUESTS.SHUFFLE:
            this.handleShuffle({ shuffle: data.payload })
            break
          case AUDIO_REQUESTS.STOP:
            this.handleStop()
            break
          case AUDIO_REQUESTS.VOLUME:
            this.handleVolume({ volume: data.payload })
            break
        }
        break
    }
  }
}
