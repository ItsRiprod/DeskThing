import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { SettingsStore } from '@server/stores/settingsStore'
import { writeToFile } from '@server/services/files/fileService'

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
  default: {
    writeToFile: vi.fn(),
    readFromFile: vi.fn()
  },
  writeToFile: vi.fn(),
  readFromFile: vi.fn()
}))

vi.mock('electron/main', () => {
  return {
    app: {
      getVersion: vi.fn().mockReturnValue('0.10.8')
    }
  }
})

vi.mock('electron', () => {
  return {
    app: {
      getVersion: vi.fn().mockReturnValue('0.10.8')
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

  beforeEach(async () => {
    settingsStore = new SettingsStore()
    await settingsStore.initialize()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('Settings Management', () => {

    it('should handle multiple setting updates in sequence', async () => {
      await settingsStore.saveSetting('server_callbackPort', 9999)
      await settingsStore.saveSetting('device_devicePort', 9998)
      const settings = await settingsStore.getSettings()
      expect(settings?.server_callbackPort).toBe(9999)
      expect(settings?.device_devicePort).toBe(9998)
    })

    it('should notify listeners when settings are updated', async () => {
      const mockListener = vi.fn()
      settingsStore.addSettingsListener(mockListener)
      await settingsStore.saveSetting('server_minimizeApp', false)
      expect(mockListener).toHaveBeenCalled()
    })
  })

  describe('Cache Management', () => {
    it('should maintain settings after cache clear', async () => {
      await settingsStore.saveSetting('server_minimizeApp', false)
      await settingsStore.clearCache()
      const settings = await settingsStore.getSettings()
      expect(settings?.server_minimizeApp).toBe(false)
    })

    it('should save settings to file when requested', async () => {
      await settingsStore.saveToFile()
      expect(writeToFile).toHaveBeenCalled()
    })
  })
})
