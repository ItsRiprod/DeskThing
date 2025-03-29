/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ReleaseStore } from '../../../src/main/stores/releaseStore'
import { getLatestRelease, fetchAssetContent } from '@server/services/github/githubService'
import { readAppReleaseData } from '@server/services/files/releaseFileService'
import Logger from '@server/utils/logger'

vi.mock('@server/services/github/githubService', () => ({
  getLatestRelease: vi.fn(),
  fetchAssetContent: vi.fn()
}))

vi.mock('@server/services/files/releaseFileService', () => ({
  readAppReleaseData: vi.fn(),
  readClientReleaseData: vi.fn(),
  saveAppReleaseData: vi.fn(),
  saveClientReleaseData: vi.fn()
}))

vi.mock('@server/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

describe('releaseStore', () => {
  let releaseStore: ReleaseStore

  beforeEach(() => {
    vi.clearAllMocks()
    releaseStore = new ReleaseStore()
  })
  afterEach(() => {
    vi.resetModules()
  })

  describe('Cache Management', () => {
    it('should clear all caches when clearCache is called', async () => {
      await releaseStore.clearCache()
      expect(await releaseStore.getAppReleases()).toEqual([])
      expect(await releaseStore.getClientReleases()).toEqual([])
    })

    it('should refresh data and clear existing cache', async () => {
      const mockRelease = { type: 'single', id: 'test' }
      vi.mocked(getLatestRelease).mockResolvedValueOnce({
        assets: [{ name: 'latest.json' }]
      } as any)
      vi.mocked(fetchAssetContent).mockResolvedValueOnce(mockRelease as any)

      await releaseStore.refreshData(true)
      expect(getLatestRelease).toHaveBeenCalled()
    })
  })

  describe('Release Management', () => {
    it('should remove app release successfully', async () => {
      const mockRelease = {
        type: 'single',
        id: 'test-app',
        repository: 'test/repo'
      }
      vi.mocked(readAppReleaseData).mockResolvedValueOnce({
        releases: [mockRelease],
        references: [{ repository: 'test/repo', added: true }],
        timestamp: Date.now()
      } as any)

      await releaseStore.removeAppRelease('test/repo')
      expect(Logger.info).toHaveBeenCalledWith(
        'App release removed successfully',
        expect.any(Object)
      )
    })
  })

  describe('Event Listeners', () => {
    it('should properly handle multiple listeners for different events', () => {
      const appListener = vi.fn()
      const communityListener = vi.fn()

      const unsubscribeApp = releaseStore.on('app', appListener)
      const unsubscribeCommunity = releaseStore.on('community', communityListener)

      releaseStore['notifyListeners']('app', [])
      releaseStore['notifyListeners']('community', [])

      expect(appListener).toHaveBeenCalled()
      expect(communityListener).toHaveBeenCalled()

      unsubscribeApp()
      unsubscribeCommunity()

      releaseStore['notifyListeners']('app', [])
      releaseStore['notifyListeners']('community', [])

      expect(appListener).toHaveBeenCalledTimes(1)
      expect(communityListener).toHaveBeenCalledTimes(1)
    })
  })
})
