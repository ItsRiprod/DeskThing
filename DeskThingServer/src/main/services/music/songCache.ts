import { EventEmitter } from 'events'
import { SongAbilities, SongData } from '@deskthing/types'
import Logger from '@server/utils/logger'
import { join } from 'path'
import { app } from 'electron'
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'

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

  private encodeSongThumbnail(thumbnail: string, song: SongData): string {
    // Handle base64 encodings
    if (thumbnail.startsWith('data:image/')) {
      // For base64 data, store it in a temporary file and serve it through our own endpoint
      const imageId = (song.id || `${song.track_name}-${song.artist}`).replace(/[<>:"/\\|?*]/g, '_')
      const imageBuffer = Buffer.from(thumbnail.split(',')[1], 'base64')

      // Store in a dedicated thumbnails directory
      const thumbnailsDir = join(app.getPath('userData'), 'thumbnails')
      if (!existsSync(thumbnailsDir)) {
        mkdirSync(thumbnailsDir, { recursive: true })
      }

      const imagePath = join(thumbnailsDir, `${imageId}.jpg`)
      writeFileSync(imagePath, imageBuffer)

      // Return a URL to our own endpoint
      return `/resource/thumbnail/${imageId}`
    }

    // Handle local file paths
    if (thumbnail.startsWith('file://')) {
      const localPath = thumbnail.startsWith('file://') ? thumbnail.substring(7) : thumbnail

      // Create a symbolic link or copy to our resource directory
      const imageId = (song.id || `${song.track_name}-${song.artist}`).replace(/[<>:"/\\|?*]/g, '_')
      const thumbnailsDir = join(app.getPath('userData'), 'thumbnails')
      if (!existsSync(thumbnailsDir)) {
        mkdirSync(thumbnailsDir, { recursive: true })
      }

      const destPath = join(thumbnailsDir, `${imageId}.jpg`)
      copyFileSync(localPath, destPath)

      return `/resource/thumbnail/${imageId}`
    }

    // Make URLs point to the proxy
    // For external URLs, use the proxy
    if (thumbnail.startsWith('http://') || thumbnail.startsWith('https://')) {
      return `/proxy/v1?url=${encodeURIComponent(thumbnail)}`
    }

    // Return as-is if we can't determine the type
    return thumbnail
  }

  private ensureUpdatedSong = (song: SongData): SongData => {
    if (!song.version || song.version === 1) {
      // Convert v1 to v2
      const abilities: SongAbilities[] = []

      if (song.can_fast_forward) abilities.push(SongAbilities.FAST_FORWARD)
      if (song.can_like) abilities.push(SongAbilities.LIKE)
      if (song.can_skip) abilities.push(SongAbilities.NEXT)
      if (song.can_change_volume) abilities.push(SongAbilities.CHANGE_VOLUME)
      if (song.can_set_output) abilities.push(SongAbilities.SET_OUTPUT)

      return {
        version: 2,
        track_name: song.track_name,
        album: song.album,
        artist: song.artist,
        playlist: song.playlist,
        playlist_id: song.playlist_id,
        shuffle_state: song.shuffle_state,
        repeat_state: song.repeat_state === 'context' ? 'all' : song.repeat_state,
        is_playing: song.is_playing,
        source: 'unknown',
        abilities,
        track_duration: song.track_duration,
        track_progress: song.track_progress,
        volume: song.volume,
        thumbnail: song.thumbnail,
        device: song.device,
        device_id: song.device_id,
        id: song.id,
        liked: song.liked,
        color: song.color || {
          value: [],
          rgb: '',
          rgba: '',
          hex: '',
          hexa: '',
          isDark: false,
          isLight: false,
          error: undefined
        },

        // deprecated version info
        can_fast_forward: song.can_fast_forward,
        can_like: song.can_like,
        can_skip: song.can_skip,
        can_change_volume: song.can_change_volume,
        can_set_output: song.can_set_output
      }
    }

    if (song.version === 2) {
      return {
        ...song,
        // fill in deprecated song info with abilities
        can_fast_forward:
          song.can_fast_forward || song.abilities.includes(SongAbilities.FAST_FORWARD),
        can_like: song.can_like || song.abilities.includes(SongAbilities.LIKE),
        can_skip: song.can_skip || song.abilities.includes(SongAbilities.NEXT),
        can_change_volume:
          song.can_change_volume || song.abilities.includes(SongAbilities.CHANGE_VOLUME),
        can_set_output: song.can_set_output || song.abilities.includes(SongAbilities.SET_OUTPUT)
      }
    }

    // Else just return the song object - assuming it is updated or smth
    return song
  }

  /**
   * Sets a new song and schedules the song end event
   */
  private setNewSong(song: SongData): void {
    this.currentSong = this.ensureUpdatedSong(song)

    if (song.thumbnail) {
      this.currentSong.thumbnail = this.encodeSongThumbnail(song.thumbnail, song)
    }

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
