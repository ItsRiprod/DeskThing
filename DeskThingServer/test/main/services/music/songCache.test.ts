import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { SongData } from '@deskthing/types'
import { SongCache, SongCacheEvents } from '../../../../src/main/services/music/songCache'

vi.mock('@server/utils/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(), log: vi.fn() }
}))

// songCache writes thumbnails through electron's userData path; no test here
// exercises a thumbnail, but the import has to resolve.
vi.mock('electron', () => ({ app: { getPath: () => '/tmp/deskthing-test', getVersion: () => '0.0.0' } }))

const track = (over: Partial<SongData> = {}): SongData =>
  ({
    version: 2,
    track_name: 'Vindicated',
    artist: 'Dashboard Confessional',
    album: 'Spider-Man 2',
    is_playing: true,
    track_duration: 200000,
    track_progress: 10000,
    abilities: [],
    source: 'test',
    id: 'track-1',
    ...over
  }) as SongData

describe('SongCache', () => {
  let cache: SongCache

  beforeEach(() => {
    vi.useFakeTimers()
    cache = new SongCache()
  })

  afterEach(() => {
    cache.clear()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('what counts as a change', () => {
    it('does not treat ordinary playback progress as a song change', () => {
      const changed = vi.fn()
      cache.updateSong(track())
      cache.on(SongCacheEvents.SONG_CHANGED, changed)

      // A poll a couple of seconds later: same track, further along.
      cache.updateSong(track({ track_progress: 12000 }))

      expect(changed).not.toHaveBeenCalled()
      expect(cache.getCurrentSong()?.track_progress).toBe(12000)
    })

    it('treats a different track as a change', () => {
      const changed = vi.fn()
      cache.updateSong(track())
      cache.on(SongCacheEvents.SONG_CHANGED, changed)

      cache.updateSong(track({ track_name: 'Signal Fire', id: 'track-2' }))

      expect(changed).toHaveBeenCalledTimes(1)
    })

    it('treats pausing as a change', () => {
      const changed = vi.fn()
      cache.updateSong(track())
      cache.on(SongCacheEvents.SONG_CHANGED, changed)

      cache.updateSong(track({ is_playing: false }))

      expect(changed).toHaveBeenCalledTimes(1)
    })

    it('does not mistake a long gap between polls for a seek', () => {
      // The cached progress advances in real time, so comparing against it
      // stays correct however far apart the polls are. Comparing against the
      // last *polled* value instead would make every poll longer than the
      // tolerance — i.e. every poll at the default 15s cadence — look like a
      // seek, and rearm the end-of-track timer each time.
      const changed = vi.fn()
      cache.updateSong(track({ track_progress: 10000 }))
      cache.on(SongCacheEvents.SONG_CHANGED, changed)

      vi.advanceTimersByTime(15000)
      cache.updateSong(track({ track_progress: 25000 }))

      expect(changed).not.toHaveBeenCalled()
    })

    it('treats a seek as a change, because it moves the end of the track', () => {
      const changed = vi.fn()
      cache.updateSong(track())
      cache.on(SongCacheEvents.SONG_CHANGED, changed)

      cache.updateSong(track({ track_progress: 120000 }))

      expect(changed).toHaveBeenCalledTimes(1)
    })
  })

  describe('end-of-track scheduling', () => {
    it('announces the end just after the track actually runs out', () => {
      const ended = vi.fn()
      cache.on(SongCacheEvents.SONG_ENDED, ended)

      cache.updateSong(track({ track_duration: 200000, track_progress: 195000 }))

      // 5s of track left. Nothing yet at the boundary itself.
      vi.advanceTimersByTime(5000)
      expect(ended).not.toHaveBeenCalled()

      // A short grace later, so the provider has caught up.
      vi.advanceTimersByTime(1000)
      expect(ended).toHaveBeenCalledTimes(1)
    })

    it('schedules for a track first seen at progress 0', () => {
      // Regression: `song.track_progress &&` made progress 0 falsy, so a track
      // caught right at its start got no end timer at all.
      const ended = vi.fn()
      cache.on(SongCacheEvents.SONG_ENDED, ended)

      cache.updateSong(track({ track_duration: 30000, track_progress: 0 }))

      vi.advanceTimersByTime(31000)
      expect(ended).toHaveBeenCalledTimes(1)
    })

    it('keeps the song cached after it ends', () => {
      // Regression: clearing here left a client that connected during the gap
      // with nothing to show.
      cache.on(SongCacheEvents.SONG_ENDED, () => {})
      cache.updateSong(track({ track_duration: 20000, track_progress: 19000 }))

      vi.advanceTimersByTime(5000)

      expect(cache.getCurrentSong()).not.toBeNull()
      expect(cache.getCurrentSong()?.track_name).toBe('Vindicated')
    })

    it('announces the end exactly once', () => {
      // Regression: an interval and a timeout both used to fire it.
      const ended = vi.fn()
      cache.on(SongCacheEvents.SONG_ENDED, ended)

      cache.updateSong(track({ track_duration: 20000, track_progress: 19000 }))
      vi.advanceTimersByTime(60000)

      expect(ended).toHaveBeenCalledTimes(1)
    })

    it('does not schedule an end for a paused track', () => {
      const ended = vi.fn()
      cache.on(SongCacheEvents.SONG_ENDED, ended)

      cache.updateSong(track({ is_playing: false }))
      vi.advanceTimersByTime(500000)

      expect(ended).not.toHaveBeenCalled()
    })

    it('rearms against the new end when the listener seeks', () => {
      const ended = vi.fn()
      cache.on(SongCacheEvents.SONG_ENDED, ended)

      cache.updateSong(track({ track_duration: 200000, track_progress: 10000 }))
      // Jump most of the way through the track.
      cache.updateSong(track({ track_duration: 200000, track_progress: 195000 }))

      vi.advanceTimersByTime(6000)
      expect(ended).toHaveBeenCalledTimes(1)
    })
  })

  describe('cached progress', () => {
    it('advances while the track plays so a late joiner is told the truth', () => {
      cache.updateSong(track({ track_progress: 10000 }))

      vi.advanceTimersByTime(3000)

      expect(cache.getCurrentSong()?.track_progress).toBe(13000)
    })

    it('never runs past the end of the track', () => {
      cache.updateSong(track({ track_duration: 12000, track_progress: 10000 }))

      vi.advanceTimersByTime(30000)

      expect(cache.getCurrentSong()!.track_progress!).toBeLessThanOrEqual(12000)
    })
  })
})
