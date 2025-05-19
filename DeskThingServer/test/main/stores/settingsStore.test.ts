import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { SettingsStore } from '@server/stores/settingsStore'
import { Settings } from '@shared/types'
import * as os from 'os'
import { readFromFile, writeToFile } from '@server/services/files/fileService'

vi.mock('os', () => ({
  default: {
    networkInterfaces: vi.fn()
  },
  networkInterfaces: vi.fn()
}))

vi.mock('@server/utils/logger', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
    info: vi.fn()
  }
}))

vi.mock('@server/services/files/fileService', () => ({
  writeToFile: vi.fn(),
  readFromFile: vi.fn()
}))

vi.mock('electron', () => {
  return {
    app: {
      getVersion: vi.fn().mockReturnValue('0.10.4')
    }
  }
})

vi.mock('auto-launch', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      enable: vi.fn(),
      disable: vi.fn()
    }))
  }
})

describe('SettingsStore', () => {
  let settingsStore: SettingsStore

  beforeEach(() => {
    settingsStore = new SettingsStore()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('IP Address Detection', () => {
    it('should return loopback when no network interfaces are available', async () => {
      vi.mocked(os.networkInterfaces).mockReturnValue({})
      const settings = await settingsStore.loadSettings()
      expect(settings.localIp).toEqual(['127.0.0.1'])
    })
  })

  describe('Settings Management', () => {
    it('should create default settings when file version is outdated', async () => {
      vi.mocked(readFromFile).mockResolvedValue({
        version: '0.1.0',
        callbackPort: 8888
      } as Settings)

      const settings = await settingsStore.loadSettings()
      expect(settings.version).toBe('0.10.4')
      expect(writeToFile).toHaveBeenCalled()
    })

    it('should handle multiple setting updates in sequence', async () => {
      await settingsStore.updateSetting('callbackPort', 9999)
      await settingsStore.updateSetting('devicePort', 9998)
      const settings = await settingsStore.getSettings()
      expect(settings?.callbackPort).toBe(9999)
      expect(settings?.devicePort).toBe(9998)
    })

    it('should notify listeners when settings are updated', async () => {
      const mockListener = vi.fn()
      settingsStore.addListener(mockListener)
      await settingsStore.updateSetting('minimizeApp', false)
      expect(mockListener).toHaveBeenCalled()
    })
  })

  describe('Cache Management', () => {
    it('should maintain settings after cache clear', async () => {
      await settingsStore.updateSetting('minimizeApp', false)
      await settingsStore.clearCache()
      const settings = await settingsStore.getSettings()
      expect(settings?.minimizeApp).toBe(false)
    })

    it('should save settings to file when requested', async () => {
      await settingsStore.saveToFile()
      expect(writeToFile).toHaveBeenCalled()
    })
  })
})
