/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AppProcessStore } from '../../../src/main/stores/appProcessStore'
import { App } from '@deskthing/types'
import Logger from '@server/utils/logger'
import { stat } from 'node:fs/promises'
import { AppProcessTypes } from '@shared/stores/appProcessStore'

vi.mock('node:worker_threads', () => ({
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    postMessage: vi.fn(),
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    terminate: vi.fn()
  })),
  parentPort: vi.fn()
}))

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/path')
  }
}))

vi.mock('@server/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    log: vi.fn()
  }
}))

vi.mock('node:fs/promises', () => ({
  stat: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn()
}))

describe('AppProcessStore', () => {
  let appProcessStore: AppProcessStore

  beforeEach(() => {
    vi.clearAllMocks()
    appProcessStore = new AppProcessStore()

    vi.spyOn(appProcessStore, 'emit').mockReturnValue(true)
  })

  describe('Process Management', () => {
    it('should fail to spawn process when entry point not found', async () => {
      vi.mocked(stat).mockRejectedValue(new Error('File not found'))

      const result = await appProcessStore.spawnProcess({ name: 'nonexistentApp' } as App)

      expect(appProcessStore.emit).toHaveBeenCalledWith(AppProcessTypes.ERROR, 'nonexistentApp')
      expect(result).toBe(false)
      expect(Logger.error).toHaveBeenCalled()
    })
    it('should handle postMessage errors', async () => {
      await appProcessStore.postMessage('nonexistentApp', { type: 'start' })
      expect(Logger.warn).toHaveBeenCalled()
    })

    it('should prevent spawning duplicate processes', async () => {
      vi.mocked(stat).mockResolvedValue({} as any)

      await appProcessStore.spawnProcess({ name: 'testApp' } as App)
      const result = await appProcessStore.spawnProcess({ name: 'testApp' } as App)

      expect(result).toBe(false)
      expect(Logger.warn).toHaveBeenCalled()
    })
  })
})
