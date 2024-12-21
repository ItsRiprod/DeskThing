import { describe, expect, it, vi, beforeEach, afterEach, Mock } from 'vitest'

vi.mock('@server/stores/loggingStore', () => ({
  default: {
    log: vi.fn(),
    getInstance: (): { log: Mock } => ({
      log: vi.fn()
    })
  }
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
    }),
    getAll: vi.fn(),
    getAllBase: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    purge: vi.fn(),
    reorder: vi.fn(),
    setItemOrder: vi.fn(),
    getOrder: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    stop: vi.fn(),
    run: vi.fn(),
    start: vi.fn(),
    addURL: vi.fn(),
    addZIP: vi.fn(),
    appendManifest: vi.fn(),
    notify: vi.fn(),
    loadApps: vi.fn()
  },
  AppHandler: {
    getInstance: vi.fn().mockReturnValue({
      get: vi.fn().mockImplementation((appId) => {
        if (appId === 'testApp') {
          return {
            name: 'Test App',
            enabled: true,
            running: false,
            prefIndex: 0,
            func: {
              toClient: vi.fn()
            }
          }
        }
        return undefined
      })
    })
  }
}))

vi.mock('@server/services/client/expressServer', () => ({
  setupExpressServer: vi.fn(),
  default: {
    start: vi.fn(),
    stop: vi.fn(),
    isRunning: vi.fn()
  }
}))

vi.mock('@server/handlers/deviceHandler', () => ({
  default: {
    start: vi.fn(),
    stop: vi.fn(),
    isRunning: vi.fn(),
    getDevices: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn()
  }
}))

vi.mock('@server/index', () => ({
  default: vi.fn(),
  sendIpcAuthMessage: vi.fn(),
  ipcMain: {
    once: vi.fn()
  }
}))

vi.mock('@server/utils/fileHandler', () => ({
  readFromFile: vi.fn(),
  writeToFile: vi.fn(),
  writeToGlobalFile: vi.fn(),
  readFromGlobalFile: vi.fn()
}))

vi.mock('@server/handlers/dataHandler', () => ({
  getData: vi.fn().mockReturnValue({ test: 'data' }),
  setData: vi.fn(),
  addData: vi.fn()
}))

import { handleDataFromApp, sendMessageToApp } from '@server/services/apps/appCommunication'
import { MESSAGE_TYPES, IncomingData, AppInstance } from '@shared/types'

describe('App Communication Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('handleDataFromApp', () => {
    it('should handle get data request', async () => {
      const appData: IncomingData = {
        type: 'get',
        request: 'data'
      }
      const { getData } = await import('@server/services/files/dataService')
      await handleDataFromApp('testApp', appData)
      expect(getData).toHaveBeenCalledWith('testApp')
    })

    it('should handle error type', async () => {
      const appData: IncomingData = {
        type: 'error',
        payload: 'test error'
      }
      const loggingStore = await import('@server/stores/loggingStore')
      await handleDataFromApp('testApp', appData)
      expect(loggingStore.default.log).toHaveBeenCalledWith(
        MESSAGE_TYPES.ERROR,
        'test error',
        'TESTAPP'
      )
    })
  })

  describe('sendMessageToApp', () => {
    it('should handle missing app gracefully', async () => {
      const data: IncomingData = {
        type: 'test',
        payload: 'test'
      }
      const loggingStore = await import('@server/stores/loggingStore')
      await sendMessageToApp('nonexistentApp', data)
      expect(loggingStore.default.log).toHaveBeenCalledWith(
        MESSAGE_TYPES.ERROR,
        'SERVER: App nonexistentApp not found or does not have toClient function. (is it running?)'
      )
    })

    it('should log message sending attempt', async () => {
      const data: IncomingData = {
        type: 'test',
        payload: 'test'
      }
      const loggingStore = await import('@server/stores/loggingStore')
      await sendMessageToApp('testApp', data)
      expect(loggingStore.default.log).toHaveBeenCalledWith(
        MESSAGE_TYPES.LOGGING,
        '[sendMessageToApp] Sending message to testApp with test'
      )
    })
  })
})
