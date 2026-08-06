import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { APP_REQUESTS, AUDIO_REQUESTS, SongData, SongEvent } from '@deskthing/types'

vi.mock('@server/utils/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(), log: vi.fn() }
}))
vi.mock('electron', () => ({
  app: { getPath: () => '/tmp/deskthing-test', getVersion: () => '0.0.0' }
}))
vi.mock('../../../../src/main/services/files/appFileService', () => ({
  getAppByName: vi.fn(async () => ({ name: 'spotify', running: true }))
}))
// Colour extraction hits the network for real artwork; irrelevant here.
vi.mock('../../../../src/main/services/music/ColorExtractor', () => ({
  ColorExtractor: class {
    async extractFromImage() {
      return undefined
    }
  }
}))

import { MusicService } from '../../../../src/main/services/music/MusicService'

const song = (over: Partial<SongData> = {}): SongData =>
  ({
    version: 2,
    track_name: 'Town Called Malice',
    artist: 'The Jam',
    album: 'The Gift',
    is_playing: true,
    track_duration: 180000,
    track_progress: 30000,
    abilities: [],
    source: 'spotify',
    id: 'track-a',
    ...over
  }) as SongData

/**
 * Stands in for the source app. The important property is that answering is
 * ASYNCHRONOUS: a refresh request is acknowledged immediately and the song
 * arrives later on a separate message, exactly as the real app behaves.
 */
const buildHarness = (answerAfterMs: number, opts: { refreshInterval?: number; clients?: number } = {}) => {
  let songHandler: ((d: { app: string; payload: SongData }) => Promise<void>) | null = null
  let current = song()
  const requests: unknown[] = []

  const appStore = {
    initialize: vi.fn(async () => {}),
    onAppMessage: vi.fn((request: string, handler: never) => {
      if (request === APP_REQUESTS.SONG) songHandler = handler
      return vi.fn()
    }),
    getAllBase: vi.fn(() => []),
    sendDataToApp: vi.fn(async (_app: string, data: { request?: string }) => {
      requests.push(data)
      if (data.request !== AUDIO_REQUESTS.REFRESH) return
      // Answer later, like a real network round trip.
      setTimeout(() => {
        songHandler?.({ app: 'spotify', payload: current })
      }, answerAfterMs)
    })
  }

  const settingsStore = {
    initialize: vi.fn(async () => {}),
    getSettings: vi.fn(async () => ({
      music_playbackLocation: 'spotify',
      // Default: no scheduled poll, so the chase tests measure the chase alone.
      music_refreshInterval: opts.refreshInterval ?? -1
    })),
    saveSetting: vi.fn(async () => {}),
    on: vi.fn(() => vi.fn())
  }

  const platformStore = {
    on: vi.fn(() => vi.fn()),
    broadcastToClients: vi.fn(async () => {}),
    sendDataToClient: vi.fn(async () => {}),
    getClients: vi.fn(() => new Array(opts.clients ?? 0).fill({ clientId: 'c' }))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = new MusicService(settingsStore as any, appStore as any, platformStore as any)

  return {
    service,
    appStore,
    platformStore,
    requests,
    advanceToNextTrack: (next: SongData) => {
      current = next
    },
    seedCurrentSong: async () => {
      await songHandler?.({ app: 'spotify', payload: current })
      // Seeding also triggers the service's one-off startup refresh. Drop it
      // so the counts below describe the chase alone.
      await new Promise((resolve) => setTimeout(resolve, 50))
      requests.length = 0
    },
    refreshCount: () =>
      requests.filter((r) => (r as { request?: string }).request === AUDIO_REQUESTS.REFRESH).length
  }
}

const skip = (service: MusicService) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service.handleClientRequest({
    app: 'music',
    type: SongEvent.SET,
    request: AUDIO_REQUESTS.NEXT
  } as any)

/**
 * handleClientRequest starts the chase without awaiting it, so tests have to
 * give it real time to run. Without this the assertions run before a single
 * request is sent and pass against an empty transcript.
 */
const settle = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const lastBroadcastTrack = (platformStore: { broadcastToClients: { mock: { calls: unknown[][] } } }) => {
  const calls = platformStore.broadcastToClients.mock.calls
  const last = calls[calls.length - 1]?.[0] as { payload?: SongData } | undefined
  return last?.payload?.track_name
}

describe('chasing a track change', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('finds the new track even though the answer arrives after the request', async () => {
    // Regression: the chase used to look at the cache immediately after
    // sending the refresh. The answer cannot have arrived yet, so every
    // attempt read the track being left, the chase gave up, and the update
    // waited for the next scheduled poll — a full cycle instead of ~1s.
    const h = buildHarness(250)
    await h.seedCurrentSong()
    h.platformStore.broadcastToClients.mockClear()

    h.advanceToNextTrack(song({ track_name: 'When It Started', id: 'track-b', track_progress: 0 }))
    await skip(h.service)
    await settle(1200)

    expect(h.refreshCount()).toBeGreaterThanOrEqual(1)
    expect(lastBroadcastTrack(h.platformStore)).toBe('When It Started')
    // Settled early rather than running the whole ladder.
    expect(h.refreshCount()).toBeLessThanOrEqual(2)
  })

  it('gives up after a bounded number of attempts when nothing changes', async () => {
    // An unbounded retry against a provider that never advances is how an
    // account earns a long Retry-After.
    const h = buildHarness(50)
    await h.seedCurrentSong()

    // Track deliberately never changes.
    await skip(h.service)
    await settle(9000)

    expect(h.refreshCount()).toBeGreaterThanOrEqual(2)
    expect(h.refreshCount()).toBeLessThanOrEqual(5)
  }, 20000) // the full ladder is ~7s by design

  it('stops chasing once playback has stopped', async () => {
    const h = buildHarness(50)
    await h.seedCurrentSong()

    h.advanceToNextTrack(song({ is_playing: false }))
    await skip(h.service)
    await settle(3000)

    expect(h.refreshCount()).toBeGreaterThanOrEqual(1)
    expect(h.refreshCount()).toBeLessThanOrEqual(2)
  })

  it('does not run two chases at once', async () => {
    const h = buildHarness(250)
    await h.seedCurrentSong()

    // Two skips in quick succession, as an impatient double-press would send.
    await skip(h.service)
    await skip(h.service)
    h.advanceToNextTrack(song({ track_name: 'Ghosts', id: 'track-c', track_progress: 0 }))
    await settle(1500)

    // Two overlapping ladders would roughly double this.
    expect(h.refreshCount()).toBeLessThanOrEqual(2)
  })

  it('polls often while someone is watching something play', async () => {
    // The only way to notice playback changed in the provider's own app on
    // another device. At the configured 15s that change took up to 15s to
    // appear even after the boundary work.
    const h = buildHarness(50, { refreshInterval: 15000, clients: 1 })
    await h.seedCurrentSong()

    await settle(5200)

    // ~2s cadence gives at least a couple of looks in 5s; the configured 15s
    // would give none.
    expect(h.refreshCount()).toBeGreaterThanOrEqual(2)
  }, 20000)

  it('falls back to the configured rate when nobody is connected', async () => {
    // A poll nobody can see is pure rate-limit cost.
    const h = buildHarness(50, { refreshInterval: 15000, clients: 0 })
    await h.seedCurrentSong()

    await settle(5200)

    expect(h.refreshCount()).toBe(0)
  }, 20000)

  it('falls back to the configured rate while playback is paused', async () => {
    const h = buildHarness(50, { refreshInterval: 15000, clients: 1 })
    h.advanceToNextTrack(song({ is_playing: false }))
    await h.seedCurrentSong()

    await settle(5200)

    expect(h.refreshCount()).toBe(0)
  }, 20000)

  it('never polls faster than the configured rate', async () => {
    // A user who deliberately set a slow cadence must not be overridden.
    const h = buildHarness(50, { refreshInterval: 30000, clients: 1 })
    await h.seedCurrentSong()

    await settle(5200)

    expect(h.refreshCount()).toBeGreaterThanOrEqual(2)
  }, 20000)

  it('lets a later chase replace an earlier one instead of dropping it', async () => {
    // Regression: a plain "already chasing" flag made the second skip a no-op,
    // so it fell through to the scheduled poll. Worse, a chase that never
    // finished left the flag set and disabled every future chase — which is
    // what stopped the chase running at all on the device.
    const h = buildHarness(250)
    await h.seedCurrentSong()

    await skip(h.service)
    await settle(300) // first chase mid-flight
    h.platformStore.broadcastToClients.mockClear()

    // A second skip must still produce requests of its own.
    const before = h.refreshCount()
    await skip(h.service)
    h.advanceToNextTrack(song({ track_name: 'Start!', id: 'track-d', track_progress: 0 }))
    await settle(1200)

    expect(h.refreshCount()).toBeGreaterThan(before)
    expect(lastBroadcastTrack(h.platformStore)).toBe('Start!')
  })
})
