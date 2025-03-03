import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import Logger, { ResponseLogger } from '@server/utils/logger'
import { LOGGING_LEVELS } from '@DeskThing/types'
import { LOG_FILTER } from '@shared/types'
vi.mock('fs')
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/path')
  }
}))

vi.mock('@server/stores/settingsStore', () => ({
  default: {
    addListener: vi.fn()
  }
}))

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fs.writeFileSync).mockImplementation(() => undefined)
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.renameSync).mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('Log Level Filtering', () => {
    it('should not log LOGGING messages when logLevel is PRODUCTION', async () => {
      const store = Logger
      store.setLogLevel(LOG_FILTER.PRODUCTION)
      const consoleSpy = vi.spyOn(console, 'log')

      await store.log(LOGGING_LEVELS.LOG, 'test message', { domain: 'test' })

      expect(consoleSpy).not.toHaveBeenCalled()
    })

    it('should log non-LOGGING messages in PRODUCTION mode', async () => {
      const store = Logger
      store.setLogLevel(LOG_FILTER.PRODUCTION)
      const consoleSpy = vi.spyOn(console, 'warn')

      vi.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined)
      vi.spyOn(fs.promises, 'appendFile').mockResolvedValue(undefined)

      await store.log(LOGGING_LEVELS.WARN, 'test warning')

      expect(consoleSpy).toHaveBeenCalledWith(
        '\x1b[33m%s\x1b[0m',
        expect.stringContaining('server') &&
          expect.stringContaining('WARNING') &&
          expect.stringContaining('test warning')
      )
    })
  })

  describe('File Operations', () => {
    it('should handle file write errors gracefully', async () => {
      const mockError = new Error('Write error')
      vi.spyOn(fs.promises, 'writeFile').mockRejectedValue(mockError)
      const consoleSpy = vi.spyOn(console, 'error')

      await expect(Logger.log(LOGGING_LEVELS.ERROR, 'test error')).rejects.toThrow('Write error')

      expect(consoleSpy).toHaveBeenCalledWith('Failed to write to log file:', mockError)
    })

    it('should return empty array when log file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const logs = await Logger.getLogs()

      expect(logs).toEqual([])
    })
  })

  describe('Listener Management', () => {
    it('should notify multiple listeners with log data', async () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      const store = Logger

      vi.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined)
      vi.spyOn(fs.promises, 'appendFile').mockResolvedValue(undefined)

      store.addListener(listener1)
      store.addListener(listener2)
      await store.log(LOGGING_LEVELS.ERROR, 'test')

      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()
    })
  })

  describe('ResponseLogger', () => {
    it('should log response data and call original reply function', async () => {
      const mockReply = vi.fn()
      const wrappedReply = ResponseLogger(mockReply)
      const logSpy = vi.spyOn(Logger, 'log')

      vi.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined)
      vi.spyOn(fs.promises, 'appendFile').mockResolvedValue(undefined)

      await wrappedReply('test-channel', {
        data: { success: true },
        status: false,
        final: false
      })

      expect(logSpy).toHaveBeenCalled()
      expect(mockReply).toHaveBeenCalledWith('test-channel', {
        data: { success: true },
        status: false,
        final: false
      })
    })
  })
})
