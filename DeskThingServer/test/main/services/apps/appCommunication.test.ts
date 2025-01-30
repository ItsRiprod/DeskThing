import { describe, expect, it, vi, beforeEach, afterEach, Mock } from 'vitest'

vi.mock('@server/stores', () => ({
  Logger: {
    log: vi.fn(),
    getInstance: (): { log: Mock } => ({
      log: vi.fn()
    })
  }
}))

vi.mock('@server/stores/appStore', () => ({
  default: {
    get: vi.fn().mockImplementation((appId): AppInstance | undefined => {
      if (appId === 'testApp') {
        return {
          name: 'Test App',
          enabled: true,
          running: false,
          timeStarted: 1,
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

import { handleDataFromApp } from '@server/services/apps/appCommunication'
import { MESSAGE_TYPES, AppInstance, FromAppData, IncomingAppDataTypes } from '@shared/types'

describe('App Communication Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('handleDataFromApp', () => {
    it('should handle error type', async () => {
      const appData: FromAppData = {
        type: IncomingAppDataTypes.LOG,
        payload: 'test error'
      }
      const { default: Logger } = await import('@server/utils/logger')
      await handleDataFromApp('testApp', appData)
      expect(Logger.log).toHaveBeenCalledWith(MESSAGE_TYPES.ERROR, 'test error', 'TESTAPP')
    })
  })
})
