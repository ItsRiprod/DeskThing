import { describe, expect, it, vi, beforeEach } from 'vitest'
import { loadAndRunEnabledApps } from '@server/services/apps/appRunner'
import loggingStore from '@server/stores/loggingStore'
import { MESSAGE_TYPES } from '@shared/types'

vi.mock('@server/stores/loggingStore', () => ({
  default: {
    log: vi.fn(),
    getInstance: vi.fn().mockReturnValue({
      log: vi.fn()
    })
  }
}))

vi.mock('@server/handlers/appHandler', () => ({
  default: {
    getInstance: vi.fn().mockReturnValue({
      getAll: vi.fn(),
      run: vi.fn()
    })
  }
}))

vi.mock('@server/index', () => ({
  default: vi.fn(),
  sendIpcAuthMessage: vi.fn(),
  sendIpcData: vi.fn(),
  ipcMain: {
    once: vi.fn()
  }
}))

vi.mock('@server/handlers/dataHandler', () => ({
  purgeAppData: vi.fn()
}))

vi.mock('@server/handlers/configHandler', () => ({
  getAppData: vi.fn().mockReturnValue({
    apps: [
      { name: 'app1', enabled: true, running: false },
      { name: 'app2', enabled: true, running: false },
      { name: 'app3', enabled: false, running: false }
    ]
  }),
  setAppData: vi.fn()
}))

vi.mock('@server/services/apps/appUtils', () => ({
  getManifest: vi.fn(),
  getAppFilePath: vi.fn()
}))

vi.mock('@server/utils/fileHandler', () => ({
  readFromFile: vi.fn(),
  writeToFile: vi.fn(),
  writeToGlobalFile: vi.fn(),
  readFromGlobalFile: vi.fn()
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

vi.mock('@server/services/client/expressServer', () => ({
  setupExpressServer: vi.fn(),
  default: {
    start: vi.fn(),
    stop: vi.fn(),
    isRunning: vi.fn()
  }
}))

describe('appRunner', () => {
  // Mock AppHandler directly since we're using dynamic imports in appRunner.ts
  vi.mock('@server/services/apps/appState', () => ({
    AppHandler: {
      getInstance: vi.fn().mockReturnValue({
        getAll: vi.fn(),
        run: vi.fn()
      })
    }
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockAppHandlerInstance: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const { AppHandler } = await import('@server/services/apps/appState')
    mockAppHandlerInstance = AppHandler.getInstance()

    mockAppHandlerInstance.getAll = vi.fn()
    mockAppHandlerInstance.run = vi.fn()
  })

  it('should run all enabled apps successfully', async () => {
    const mockApps = [
      { name: 'app1', enabled: true, running: false },
      { name: 'app2', enabled: true, running: false },
      { name: 'app3', enabled: false, running: false }
    ]
    mockAppHandlerInstance.getAll.mockReturnValue(mockApps)
    mockAppHandlerInstance.run.mockImplementation((appName) => {
      const app = mockApps.find((a) => a.name === appName)
      if (app) app.running = true
      return Promise.resolve()
    })
    await loadAndRunEnabledApps()

    expect(mockAppHandlerInstance.run).toHaveBeenCalledTimes(2)
    expect(mockAppHandlerInstance.run).toHaveBeenCalledWith('app1')
    expect(mockAppHandlerInstance.run).toHaveBeenCalledWith('app2')
  })

  it('should not run apps that are already running', async () => {
    const mockApps = [
      { name: 'app1', enabled: true, running: false },
      { name: 'app2', enabled: true, running: true }
    ]
    mockAppHandlerInstance.getAll.mockReturnValue(mockApps)
    mockAppHandlerInstance.run.mockImplementation((appName) => {
      const app = mockApps.find((a) => a.name === appName)
      if (app) app.running = true
      return Promise.resolve()
    })

    await loadAndRunEnabledApps()

    expect(mockAppHandlerInstance.run).toHaveBeenCalledTimes(1)
    expect(mockAppHandlerInstance.run).toHaveBeenCalledWith('app1')
    expect(loggingStore.log).toHaveBeenCalledWith(
      MESSAGE_TYPES.LOGGING,
      'SERVER: Loaded apps config. Running apps...'
    )
  })

  it('should handle errors during app loading', async () => {
    mockAppHandlerInstance.getAll.mockImplementation(() => {
      throw new Error('Failed to load apps')
    })

    await loadAndRunEnabledApps()

    expect(loggingStore.log).toHaveBeenCalledWith(
      MESSAGE_TYPES.ERROR,
      'SERVER: Error loading and running enabled apps'
    )
  })

  it('should handle errors during app running', async () => {
    const mockApps = [{ name: 'app1', enabled: true, running: false }]
    mockAppHandlerInstance.getAll.mockReturnValue(mockApps)
    mockAppHandlerInstance.run.mockRejectedValue(new Error('Failed to run app'))

    await loadAndRunEnabledApps()

    expect(mockAppHandlerInstance.run).toHaveBeenCalledWith('app1')
    expect(loggingStore.log).toHaveBeenCalledWith(
      MESSAGE_TYPES.ERROR,
      'SERVER: Error loading and running enabled apps'
    )
  })

  it('should not run disabled apps', async () => {
    const mockApps = [
      { name: 'app1', enabled: false, running: false },
      { name: 'app2', enabled: false, running: false }
    ]
    mockAppHandlerInstance.getAll.mockReturnValue(mockApps)

    await loadAndRunEnabledApps()

    expect(mockAppHandlerInstance.run).not.toHaveBeenCalled()
    expect(loggingStore.log).toHaveBeenCalledWith(
      MESSAGE_TYPES.LOGGING,
      'SERVER: Loaded apps config. Running apps...'
    )
  })
})
