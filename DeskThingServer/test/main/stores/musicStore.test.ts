import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { MusicStore } from '../../../src/main/stores/musicStore'
import { SettingsStoreClass } from '@shared/stores/settingsStore'
import { AppStoreClass } from '@shared/stores/appStore'
import { LOGGING_LEVELS } from '@DeskThing/types'
import Logger from '@server/utils/logger'
import { sendMessageToClients } from '../../../src/main/services/client/clientCom'
import { getColorFromImage } from '../../../src/main/services/music/musicUtils'

vi.mock('@server/utils/logger', () => ({
  default: {
    log: vi.fn(),
    info: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('../../../src/main/services/files/appFileService', () => ({
  getAppByName: vi.fn()
}))

vi.mock('../../../src/main/services/client/clientCom', () => ({
  sendMessageToClients: vi.fn()
}))

vi.mock('../../../src/main/services/music/musicUtils', () => ({
  getColorFromImage: vi.fn()
}))

describe('MusicStore', () => {
  let musicStore: MusicStore
  let mockSettingsStore: SettingsStoreClass
  let mockAppStore: AppStoreClass

  beforeEach(() => {
    vi.useFakeTimers()
    mockSettingsStore = {
      getSettings: vi.fn().mockResolvedValue({
        playbackLocation: 'spotify',
        refreshInterval: 1000
      }),
      updateSetting: vi.fn(),
      addListener: vi.fn()
    } as unknown as SettingsStoreClass

    mockAppStore = {
      getAllBase: vi.fn().mockReturnValue([{ name: 'spotify', manifest: { isAudioSource: true } }]),
      sendDataToApp: vi.fn()
    } as unknown as AppStoreClass

    musicStore = new MusicStore(mockSettingsStore, mockAppStore)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('should initialize refresh interval after construction', async () => {
    vi.advanceTimersByTime(3000)
    expect(mockSettingsStore.getSettings).toHaveBeenCalled()
  })

  it('should handle music message with thumbnail', async () => {
    const mockedColors = {
      hex: '#000000',
      value: [],
      rgb: '',
      rgba: '',
      hexa: '',
      isDark: false,
      isLight: false
    }

    vi.mocked(getColorFromImage).mockResolvedValue(mockedColors)

    await musicStore.handleMusicMessage({
      track_name: 'Test Song',
      artist: 'Test Artist',
      thumbnail: 'test.jpg',
      album: null,
      playlist: null,
      playlist_id: null,
      shuffle_state: null,
      repeat_state: 'all',
      is_playing: false,
      can_fast_forward: false,
      can_skip: false,
      can_like: false,
      can_change_volume: false,
      can_set_output: false,
      track_duration: null,
      track_progress: null,
      volume: 0,
      device: null,
      id: null,
      device_id: null
    })

    expect(sendMessageToClients).toHaveBeenCalledWith({
      type: 'song',
      app: 'client',
      payload: expect.objectContaining({
        album: null,
        playlist: null,
        playlist_id: null,
        shuffle_state: null,
        repeat_state: 'all',
        is_playing: false,
        can_fast_forward: false,
        can_skip: false,
        can_like: false,
        can_change_volume: false,
        can_set_output: false,
        track_duration: null,
        track_progress: null,
        volume: 0,
        device: null,
        id: null,
        device_id: null,
        color: mockedColors
      })
    })
  })
  it('should handle invalid refresh intervals', async () => {
    await musicStore.updateRefreshInterval(-1)
    expect(Logger.log).toHaveBeenCalledWith(
      LOGGING_LEVELS.LOG,
      expect.stringContaining('Cancelling')
    )

    await musicStore.updateRefreshInterval(0.5)
    expect(Logger.log).toHaveBeenCalledWith(
      LOGGING_LEVELS.WARN,
      expect.stringContaining('could very well end your system')
    )
  })
})
