import { EventEmitter } from 'events'
import { SongData } from '@deskthing/types'
import Logger from '@server/utils/logger'

export enum SongCacheEvents {
  SONG_CHANGED = 'songChanged',
  SONG_ENDED = 'songEnded'
}

type SongCacheEventMap = {
  [SongCacheEvents.SONG_CHANGED]: [SongData]
  [SongCacheEvents.SONG_ENDED]: [void]
}

/**
 * Manages the caching of song data and emits events when songs change or end
 */
export class SongCache extends EventEmitter<SongCacheEventMap> {
  private currentSong: SongData | null = null
  private songEndTimeout: NodeJS.Timeout | null = null
  private progressInterval: NodeJS.Timeout | null = null

  constructor() {
    super()
  }

  /**
   * Returns the currently cached song
   */
  public getCurrentSong(): SongData | null {
    return this.currentSong
  }

  /**
   * Updates the cached song data and emits events if the song has changed
   */
  public updateSong(newSong: SongData): void {
    // If no current song, just set it and emit change
    if (!this.currentSong) {
      this.setNewSong(newSong)
      return
    }

    // Check if song has actually changed
    const hasSongChanged =
      this.currentSong.track_name !== newSong.track_name ||
      this.currentSong.artist !== newSong.artist ||
      this.currentSong.album !== newSong.album ||
      this.currentSong.is_playing !== newSong.is_playing ||
      this.currentSong.track_progress !== newSong.track_progress ||
      this.currentSong.track_duration !== newSong.track_duration

    if (hasSongChanged) {
      this.setNewSong(newSong)
    } else {
      // Update progress/state without emitting change
      this.currentSong = {
        ...this.currentSong,
        track_progress: newSong.track_progress,
        track_duration: newSong.track_duration,
        is_playing: newSong.is_playing
      }
    }
  }

  /**
   * Clears the song cache and cancels any pending timeouts
   */
  public clear(): void {
    this.currentSong = null
    if (this.songEndTimeout) {
      clearTimeout(this.songEndTimeout)
      this.songEndTimeout = null
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }
  }

  /**
   * Sets a new song and schedules the song end event
   */
  private setNewSong(song: SongData): void {
    this.currentSong = song
    this.emit(SongCacheEvents.SONG_CHANGED, song)

    // Clear existing timeouts if any
    if (this.songEndTimeout) {
      clearTimeout(this.songEndTimeout)
      this.songEndTimeout = null
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }

    // Set interval for progress updates and timeout for song end if we have duration and progress
    if (song.track_duration && song.track_progress && song.is_playing) {
      const remainingTime = song.track_duration - song.track_progress

      // Update progress every second
      this.progressInterval = setInterval(() => {
        if (
          this.currentSong &&
          this.currentSong.track_progress &&
          this.currentSong.track_duration
        ) {
          this.currentSong.track_progress += 1000
          if (this.currentSong.track_progress >= this.currentSong.track_duration) {
            Logger.debug('Song ended based on duration', {
              source: 'SongCache',
              function: 'setNewSong'
            })
            this.emit(SongCacheEvents.SONG_ENDED)
            this.clear()
          }
        }
      }, 1000)

      // Set a backup timeout for song end
      this.songEndTimeout = setTimeout(() => {
        Logger.debug('Song ended based on duration (backup timeout)', {
          source: 'SongCache',
          function: 'setNewSong'
        })
        this.emit(SongCacheEvents.SONG_ENDED)
        this.clear()
      }, remainingTime)
    }
  }
}
