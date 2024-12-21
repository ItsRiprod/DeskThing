import { describe, expect, it, vi, beforeEach, afterEach, Mock } from 'vitest'
import { AppHandler } from '@server/services/apps/appState'

vi.mock('@server/utils/fileHandler', () => ({
  readFromFile: vi.fn(),
  writeToFile: vi.fn(),
  readFromGlobalFile: vi.fn(),
  writeToGlobalFile: vi.fn()
}))

vi.mock('@server/handlers/adbHandler', () => ({
  default: {
    start: vi.fn(),
    stop: vi.fn(),
    isRunning: vi.fn(),
    getDevices: vi.fn()
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
  default: vi.fn()
}))

vi.mock('@server/stores/loggingStore', () => ({
  default: {
    log: vi.fn(),
    getInstance: (): { log: Mock } => ({
      log: vi.fn()
    })
  }
}))

describe('AppState', () => {
  let appState: AppHandler

  beforeEach(() => {
    appState = new AppHandler()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('order property', () => {
    it('should initialize with empty array', () => {
      expect(appState['order']).toEqual([])
    })

    it('should maintain order when adding items', () => {
      appState['order'] = ['app1', 'app2', 'app3']
      expect(appState['order']).toHaveLength(3)
      expect(appState['order']).toEqual(['app1', 'app2', 'app3'])
    })

    it('should allow clearing order array', () => {
      appState['order'] = ['app1', 'app2']
      appState['order'] = []
      expect(appState['order']).toEqual([])
    })

    it('should handle duplicate entries', () => {
      appState['order'] = ['app1', 'app1', 'app2']
      expect(appState['order']).toEqual(['app1', 'app1', 'app2'])
    })

    it('should preserve order type as string array', () => {
      appState['order'] = ['1', '2', '3']
      expect(Array.isArray(appState['order'])).toBe(true)
      expect(appState['order'].every((item) => typeof item === 'string')).toBe(true)
    })
  })
})
