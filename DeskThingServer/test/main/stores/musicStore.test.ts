import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { MusicStore } from '../../../src/main/stores/musicStore'
import { SettingsStoreClass } from '@shared/stores/settingsStore'
import { AppStoreClass } from '@shared/stores/appStore'
import { MusicEventPayloads } from '@deskthing/types'
import { PlatformStoreClass } from '@shared/stores/platformStore'
import { MusicService } from '../../../src/main/services/music/MusicService'
import { MediaStore } from '@server/stores/mediaStore'

vi.mock('@server/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    log: vi.fn()
  }
}))

vi.mock('../../../src/main/services/music/MusicService')

describe('MusicStore', () => {
  let musicStore: MusicStore
  let mockSettingsStore: SettingsStoreClass
  let mockAppStore: AppStoreClass
  let mockPlatformStore: PlatformStoreClass
  let mockMediaStore: MediaStore

  beforeEach(() => {
    mockSettingsStore = {} as SettingsStoreClass
    mockAppStore = {} as AppStoreClass
    mockPlatformStore = {} as PlatformStoreClass
    mockMediaStore = {} as MediaStore
    musicStore = new MusicStore(mockSettingsStore, mockAppStore, mockPlatformStore, mockMediaStore)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize the music service', async () => {
    await musicStore.initialize()
    expect(MusicService.prototype.initialize).toHaveBeenCalled()
  })

  it('should clear cache through music service', async () => {
    await musicStore.clearCache()
    expect(MusicService.prototype.clearCache).toHaveBeenCalled()
  })

  it('should save to file through music service', async () => {
    await musicStore.saveToFile()
    expect(MusicService.prototype.saveToFile).toHaveBeenCalled()
  })

  it('should update refresh interval through music service', async () => {
    const refreshRate = 1000
    await musicStore.updateRefreshInterval(refreshRate)
    expect(MusicService.prototype.updateRefreshInterval).toHaveBeenCalledWith(refreshRate)
  })

  it('should set audio source through music service', async () => {
    const source = 'test-source'
    await musicStore.setAudioSource(source)
    expect(MusicService.prototype.setAudioSource).toHaveBeenCalledWith(source)
  })

  it('should handle client request through music service', async () => {
    const request: MusicEventPayloads = {} as MusicEventPayloads
    await musicStore.handleClientRequest(request)
    expect(MusicService.prototype.handleClientRequest).toHaveBeenCalledWith(request)
  })

  it('should check initialized state from music service', () => {
    vi.spyOn(MusicService.prototype, 'initialized', 'get').mockReturnValue(true)
    expect(musicStore.initialized).toBe(true)
  })
})
