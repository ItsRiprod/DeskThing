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
  /**
   * Progress moves on its own while a track plays. Only a jump bigger than a
   * poll's worth of playback means the listener actually seeked.
   */
  private static readonly SEEK_TOLERANCE_MS = 3000

  /**
   * Ask for the next track slightly after the current one runs out. Querying
   * at the exact boundary races the provider, which usually still reports the
   * track that just finished.
   */
  private static readonly END_OF_TRACK_GRACE_MS = 750

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

    // A track that is simply playing is not a track that changed. Treating
    // every progress advance as a change made setNewSong run on each poll,
    // which tore down and rebuilt the end-of-track timer every time and fired
    // a redundant SONG_CHANGED broadcast on each one.
    const isDifferentTrack =
      this.currentSong.track_name !== newSong.track_name ||
      this.currentSong.artist !== newSong.artist ||
      this.currentSong.album !== newSong.album ||
      this.currentSong.track_duration !== newSong.track_duration

    const playbackFlipped = this.currentSong.is_playing !== newSong.is_playing

    // A seek is a progress jump larger than playback alone can explain. The
    // comparison is against the cached value rather than the last polled one
    // because the progress interval above keeps the cache advancing in real
    // time — so this is already "where the track should be by now", and an
    // ordinary poll lands within the tolerance no matter how long the gap
    // between polls is.
    const jumped =
      Math.abs((newSong.track_progress ?? 0) - (this.currentSong.track_progress ?? 0)) >
      SongCache.SEEK_TOLERANCE_MS

    if (isDifferentTrack || playbackFlipped || jumped) {
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
        color: song.color,

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

    // Keep the cached progress moving between polls, so a client that connects
    // mid-track is told where the track actually is. Note this only advances
    // the cache — it is not what detects the end of the track.
    if (song.track_duration && song.is_playing) {
      this.progressInterval = setInterval(() => {
        const current = this.currentSong
        if (current?.track_duration == null) return
        current.track_progress = Math.min(
          (current.track_progress ?? 0) + 1000,
          current.track_duration
        )
      }, 1000)

      // The track's own remaining time is the one piece of information that
      // says exactly when the next track begins, so schedule for it rather
      // than waiting for the next poll to stumble across the change.
      //
      // `track_progress ?? 0` matters: a track first seen at progress 0 is
      // falsy, and the previous `song.track_progress &&` guard skipped the
      // timer entirely for it — precisely the track that needed it most.
      const remainingTime = song.track_duration - (song.track_progress ?? 0)

      if (remainingTime > 0) {
        this.songEndTimeout = setTimeout(() => {
          Logger.debug('Song reached the end of its duration', {
            source: 'SongCache',
            function: 'setNewSong'
          })
          // Deliberately NOT clear() — dropping the cached song here left a
          // client that connected during the gap with nothing to show, and
          // killed the progress interval for the track that replaces it. The
          // refresh this triggers will overwrite the entry a moment later.
          this.emit(SongCacheEvents.SONG_ENDED)
        }, remainingTime + SongCache.END_OF_TRACK_GRACE_MS)
      }
    }
  }
}
