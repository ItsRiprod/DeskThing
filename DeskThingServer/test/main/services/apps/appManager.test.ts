import { describe, expect, it, vi, beforeEach, afterEach, Mock } from 'vitest'
import { clearCache, purgeApp } from '@server/services/apps/appManager'
import fs from 'node:fs'
import loggingStore from '@server/stores/loggingStore'
import { MESSAGE_TYPES, AppInstance } from '@shared/types'

vi.mock('node:fs', () => ({
  readdirSync: vi.fn(),
  existsSync: vi.fn(),
  default: {
    existsSync: vi.fn(),
    rmSync: vi.fn(),
    unlinkSync: vi.fn(),
    rmdirSync: vi.fn(),
    readdirSync: vi.fn(),
    lstatSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(),
    copyFileSync: vi.fn(),
    renameSync: vi.fn(),
    chmodSync: vi.fn(),
    statSync: vi.fn(),
    promises: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      unlink: vi.fn(),
      rmdir: vi.fn(),
      mkdir: vi.fn(),
      readdir: vi.fn(),
      stat: vi.fn()
    }
  }
}))
vi.mock('@server/stores/loggingStore', () => ({
  default: {
    log: vi.fn(),
    getInstance: (): { log: Mock } => ({
      log: vi.fn()
    })
  }
}))
vi.mock('@server/handlers/dataHandler', () => ({
  purgeAppData: vi.fn()
}))
vi.mock('@server/handlers/configHandler', () => ({
  purgeAppConfig: vi.fn()
}))
vi.mock('@server/services/mappings/mappingStore', () => ({
  default: {
    removeSource: vi.fn()
  }
}))
vi.mock('@server/services/apps/appUtils', () => ({
  getAppFilePath: vi.fn().mockReturnValue('/mock/path')
}))
vi.mock('@server/services/apps/appState', () => ({
  default: {
    get: vi.fn().mockImplementation((appId): AppInstance | undefined => {
      if (appId === 'testApp') {
        return {
          name: 'Test App',
          enabled: true,
          running: false,
          prefIndex: 0,
          func: {
            toClient: async (): Promise<void> => {}
          }
        }
      }
      return undefined
    })
  }
}))

describe('AppManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('clearCache', () => {
    it('should handle empty directory', async () => {
      vi.spyOn(fs, 'readdirSync').mockReturnValue([])
      await clearCache('testApp')
      expect(loggingStore.log).toHaveBeenCalledWith(
        MESSAGE_TYPES.WARNING,
        'SERVER: Directory /mock/path is empty'
      )
    })

    it('should clear cache for files in directory', async () => {
      vi.spyOn(fs, 'readdirSync').mockReturnValue([
        {
          name: 'file1.js',
          isDirectory: () => false,
          isFile: () => true
        } as fs.Dirent,
        {
          name: 'file2.js',
          isDirectory: () => false,
          isFile: () => true
        } as fs.Dirent
      ])
      vi.spyOn(fs, 'statSync').mockReturnValue({
        isDirectory: () => false,
        isFile: () => true
      } as fs.Stats)

      await clearCache('testApp')
      expect(loggingStore.log).toHaveBeenCalled()
    })

    it('should handle errors when clearing cache', async () => {
      vi.spyOn(fs, 'readdirSync').mockImplementation(() => {
        throw new Error('Read error')
      })

      await clearCache('testApp')
      expect(loggingStore.log).toHaveBeenCalledWith(
        MESSAGE_TYPES.WARNING,
        'SERVER: Directory /mock/path is empty'
      )
    })
  })

  describe('purgeApp', () => {
    it('should not delete developer-app files', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true)
      await purgeApp('developer-app')
      expect(fs.rmSync).not.toHaveBeenCalled()
    })

    it('should handle non-existent app directory', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false)
      await purgeApp('testApp')
      expect(fs.rmSync).not.toHaveBeenCalled()
    })

    it('should clean up all app resources', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true)
      await purgeApp('testApp')
      expect(loggingStore.log).toHaveBeenCalledWith(
        MESSAGE_TYPES.LOGGING,
        'SERVER: Purging App testApp'
      )
    })
  })
})
