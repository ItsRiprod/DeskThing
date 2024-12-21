/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import LoggingStore, { ResponseLogger } from '@server/stores/loggingStore'
import { MESSAGE_TYPES, LOGGING_LEVEL } from '@shared/types'

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

describe('LoggingStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fs.writeFileSync).mockImplementation(() => undefined)
    vi.mocked(fs.existsSync).mockReturnValue(true)
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('Log Level Filtering', () => {
    it('should not log LOGGING messages when logLevel is PRODUCTION', async () => {
      const store = LoggingStore
      store.setLogLevel(LOGGING_LEVEL.PRODUCTION)
      const consoleSpy = vi.spyOn(console, 'log')

      await store.log(MESSAGE_TYPES.LOGGING, 'test message')

      expect(consoleSpy).not.toHaveBeenCalled()
    })

    it('should log non-LOGGING messages in PRODUCTION mode', async () => {
      const store = LoggingStore
      store.setLogLevel(LOGGING_LEVEL.PRODUCTION)
      const consoleSpy = vi.spyOn(console, 'log')

      vi.mocked(fs.writeFile).mockImplementation((_, __, callback: any) => callback(null))
      vi.mocked(fs.appendFile).mockImplementation((_, __, callback: any) => callback(null))

      await store.log(MESSAGE_TYPES.WARNING, 'test warning')

      expect(consoleSpy).toHaveBeenCalledWith(
        '\x1b[33m%s\x1b[0m',
        expect.stringContaining('[server] WARNING: test warning')
      )
    })
  })

  describe('File Operations', () => {
    it('should handle file write errors gracefully', async () => {
      const mockError = new Error('Write error')
      vi.mocked(fs.writeFile).mockImplementation((_, __, callback: (error: Error) => void) =>
        callback(mockError)
      )
      const consoleSpy = vi.spyOn(console, 'error')

      await expect(LoggingStore.log(MESSAGE_TYPES.ERROR, 'test error')).rejects.toThrow(
        'Write error'
      )

      expect(consoleSpy).toHaveBeenCalledWith('Failed to write to log file:', mockError)
    })
    it('should return empty array when log file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const logs = await LoggingStore.getLogs()

      expect(logs).toEqual([])
    })
  })

  describe('Listener Management', () => {
    it('should notify multiple listeners with log data', async () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      const store = LoggingStore

      vi.mocked(fs.writeFile).mockImplementation((_, __, callback: any) => callback(null))
      vi.mocked(fs.appendFile).mockImplementation((_, __, callback: any) => callback(null))

      store.addListener(listener1)
      store.addListener(listener2)
      await store.log(MESSAGE_TYPES.ERROR, 'test')

      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()
    })
  })

  describe('ResponseLogger', () => {
    it('should log response data and call original reply function', async () => {
      const mockReply = vi.fn()
      const wrappedReply = ResponseLogger(mockReply)
      const logSpy = vi.spyOn(LoggingStore, 'log')

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
