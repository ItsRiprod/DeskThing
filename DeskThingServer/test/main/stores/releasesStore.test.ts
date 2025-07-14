/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ReleaseStore } from '../../../src/main/stores/releaseStore'
import {
  readAppReleaseData,
  readClientReleaseData
} from '@server/services/files/releaseFileService'
import Logger from '@server/utils/logger'
import { ClientReleaseFile01111 } from '@shared/types'
import {  ClientLatestJSON } from '@deskthing/types'

vi.mock('@server/services/files/releaseFileService')
vi.mock('@server/services/events/progressBus')
vi.mock('@server/services/releases/releaseUtils')
vi.mock('@server/services/files/fileService', () => ({
  writeToFile: vi.fn(),
  readFromFile: vi.fn(),
  readFile: vi.fn()
}))
vi.mock('@server/utils/logger', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
    info: vi.fn(),
    setupSettingsListener: vi.fn(),
    createLogger: vi.fn(() => ({
      debug: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      log: vi.fn(),
      info: vi.fn()
    }))
  }
}))

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/'),
    getVersion: vi.fn(() => '0.11.0')
  }
}))

vi.mock('electron/main', () => ({
  app: {
    getPath: vi.fn(() => '/'),
    getVersion: vi.fn(() => '0.11.0')
  }
}))

describe('ReleaseStore', () => {
  let releaseStore: ReleaseStore

  beforeEach(() => {
    vi.clearAllMocks()
    releaseStore = new ReleaseStore()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('Initialization', () => {
    it('should initialize only once', async () => {
      expect(releaseStore.initialized).toBe(false)
      await releaseStore.initialize()
      expect(releaseStore.initialized).toBe(true)
      await releaseStore.initialize()
      expect(releaseStore.initialized).toBe(true)
    })
  })

  describe('Cache Management', () => {
    it('should clear cache when requested', async () => {
      await releaseStore.clearCache()
      expect(vi.mocked(readAppReleaseData)).not.toHaveBeenCalled()
      expect(vi.mocked(readClientReleaseData)).not.toHaveBeenCalled()
    })
  })

  describe('Release Data Management', () => {
    it('should get app releases', async () => {
      const mockReleases = {
        releases: [{ id: 'test-app' }],
        repositories: ['test-repo'],
        timestamp: Date.now()
      }
      vi.mocked(readAppReleaseData).mockResolvedValueOnce(mockReleases as any)

      const releases = await releaseStore.getAppReleases()
      expect(releases).toEqual(mockReleases.releases)
    })

    it('should get client releases', async () => {
      const mockReleases: ClientReleaseFile01111 = {
        releases: [
          {
            id: 'test-client',
            type: 'client',
            mainRelease: {} as ClientLatestJSON,
            lastUpdated: 0,
            totalDownloads: 0
          }
        ],
        repositories: ['test-repo'],
        timestamp: Date.now(),
        version: '0.11.11',
        type: 'client'
      }
      vi.mocked(readClientReleaseData).mockResolvedValueOnce(mockReleases as any)

      const releases = await releaseStore.getClientReleases()
      expect(releases).toEqual(mockReleases.releases)
    })


    it('should get specific client release', async () => {
      const mockReleases = {
        releases: [{ id: 'test-client' }],
        repositories: ['test-repo'],
        timestamp: Date.now()
      }
      vi.mocked(readClientReleaseData).mockResolvedValueOnce(mockReleases as any)

      const release = await releaseStore.getClientRelease('test-client')
      expect(release).toEqual(mockReleases.releases[0])
    })
  })

  describe('Repository Management', () => {
    it('should get community apps', async () => {
      const mockReleases = {
        releases: [],
        repositories: ['test-repo'],
        timestamp: Date.now()
      }
      vi.mocked(readAppReleaseData).mockResolvedValueOnce(mockReleases as any)

      const repos = await releaseStore.getCommunityApps()
      expect(repos).toEqual(mockReleases.repositories)
    })

    it('should get community clients', async () => {
      const mockReleases = {
        releases: [],
        repositories: ['test-repo'],
        timestamp: Date.now()
      }
      vi.mocked(readClientReleaseData).mockResolvedValueOnce(mockReleases as any)

      const repos = await releaseStore.getCommunityClients()
      expect(repos).toEqual(mockReleases.repositories)
    })
  })

  describe('Error Handling', () => {
    it('should handle errors when reading releases', async () => {
      vi.mocked(readAppReleaseData).mockRejectedValueOnce(new Error('Test error'))

      const releases = await releaseStore.getAppReleases()
      expect(releases).toBeUndefined()
      expect(vi.mocked(Logger.warn)).toHaveBeenCalled()
    })
  })
})
