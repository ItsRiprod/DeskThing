/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AppProcessStore } from '../../../src/main/stores/appProcessStore'
import { AppProcessEvents } from '@shared/stores/appProcessStore'
import { App, SEND_TYPES } from '@deskthing/types'
import Logger from '@server/utils/logger'
import { stat } from 'node:fs/promises'

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
  stat: vi.fn()
}))

describe('AppProcessStore', () => {
  let appProcessStore: AppProcessStore

  beforeEach(() => {
    vi.clearAllMocks()
    appProcessStore = new AppProcessStore()
  })

  describe('Message Handling', () => {
    it('should register and unregister message listeners with filters', () => {
      const mockListener = vi.fn()

      const unsubscribe = appProcessStore.onMessage(SEND_TYPES.TASK, mockListener, {
        app: 'testApp',
        request: 'get'
      })

      appProcessStore.notifyMessageListeners(SEND_TYPES.TASK, {
        type: SEND_TYPES.TASK,
        source: 'testApp',
        request: 'get',
        version: '0.0.0'
      })

      expect(mockListener).toHaveBeenCalled()

      unsubscribe()

      appProcessStore.notifyMessageListeners(SEND_TYPES.TASK, {
        type: SEND_TYPES.TASK,
        source: 'testApp',
        request: 'get',
        version: '0.0.0'
      })

      expect(mockListener).toHaveBeenCalledTimes(1)
    })

    it('should handle process event notifications', () => {
      const mockCallback = vi.fn()
      appProcessStore.onProcessEvent(AppProcessEvents.STARTED, mockCallback)
      appProcessStore.notifyProcessEvent(AppProcessEvents.STARTED, 'testApp')
      expect(mockCallback).toHaveBeenCalledWith('testApp', undefined)
    })
  })

  describe('Process Management', () => {
    it('should fail to spawn process when entry point not found', async () => {
      vi.mocked(stat).mockRejectedValue(new Error('File not found'))

      const result = await appProcessStore.spawnProcess({ name: 'nonexistentApp' } as App)

      expect(result).toBe(false)
      expect(Logger.error).toHaveBeenCalled()
    })

    it('should handle postMessage errors', async () => {
      await expect(
        appProcessStore.postMessage('nonexistentApp', { type: 'start' })
      ).rejects.toThrow('Process nonexistentApp not found')
    })

    it('should prevent spawning duplicate processes', async () => {
      vi.mocked(stat).mockResolvedValue({} as any)

      await appProcessStore.spawnProcess({ name: 'testApp' } as App)
      const result = await appProcessStore.spawnProcess({ name: 'testApp' } as App)

      expect(result).toBe(false)
      expect(Logger.warn).toHaveBeenCalled()
    })
  })

  describe('Process Events', () => {
    it('should handle multiple process event listeners', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      appProcessStore.onProcessEvent(AppProcessEvents.ERROR, listener1)
      appProcessStore.onProcessEvent(AppProcessEvents.ERROR, listener2)

      appProcessStore.notifyProcessEvent(AppProcessEvents.ERROR, 'testApp', 'error message')

      expect(listener1).toHaveBeenCalledWith('testApp', 'error message')
      expect(listener2).toHaveBeenCalledWith('testApp', 'error message')
    })

    it('should properly remove specific event listeners', () => {
      const listener = vi.fn()
      const unsubscribe = appProcessStore.onProcessEvent(AppProcessEvents.RUNNING, listener)

      unsubscribe()

      appProcessStore.notifyProcessEvent(AppProcessEvents.RUNNING, 'testApp')
      expect(listener).not.toHaveBeenCalled()
    })
  })
})
