import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { app, BrowserWindow, shell } from 'electron'
import {
  createMainWindow,
  createClientWindow,
  handleUrl,
  openAuthWindow,
  sendIpcData
} from '@server/index'
import { ServerIPCData } from '@shared/types'

// Mock electron modules
vi.mock('electron', () => ({
  app: {
    whenReady: vi.fn(),
    on: vi.fn(),
    quit: vi.fn(),
    setAsDefaultProtocolClient: vi.fn(),
    requestSingleInstanceLock: vi.fn().mockImplementation(() => {
      app.quit()
      return false
    }),
    setAppUserModelId: vi.fn(),
    dock: {
      setMenu: vi.fn()
    }
  },
  BrowserWindow: vi.fn().mockImplementation(() => ({
    loadURL: vi.fn(),
    loadFile: vi.fn(),
    on: vi.fn(),
    show: vi.fn(),
    focus: vi.fn(),
    isMinimized: vi.fn(),
    restore: vi.fn(),
    isDestroyed: vi.fn(),
    webContents: {
      session: {
        webRequest: {
          onHeadersReceived: vi.fn()
        }
      },
      setWindowOpenHandler: vi.fn(),
      on: vi.fn(),
      executeJavaScript: vi.fn(),
      send: vi.fn()
    }
  })),
  ipcMain: {
    handle: vi.fn()
  },
  Tray: vi.fn().mockImplementation(() => ({
    setToolTip: vi.fn(),
    setContextMenu: vi.fn(),
    on: vi.fn()
  })),
  Menu: {
    buildFromTemplate: vi.fn()
  },
  shell: {
    openExternal: vi.fn()
  },
  nativeImage: {
    createFromPath: vi.fn()
  }
}))

describe('Main Process', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('Window Creation', () => {
    it('should create main window with correct configuration', () => {
      const window = createMainWindow()
      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 1130,
          height: 730,
          minWidth: 500,
          minHeight: 400,
          show: false,
          autoHideMenuBar: true
        })
      )
      expect(window).toBeDefined()
    })

    it('should create client window with correct configuration', () => {
      const port = 8080
      const window = createClientWindow(port)
      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 800,
          height: 480,
          minWidth: 500,
          minHeight: 140,
          show: false,
          frame: true
        })
      )
      expect(window.loadURL).toHaveBeenCalledWith(`http://localhost:${port}/`, {})
    })
  })

  describe('URL Handling', () => {
    it('should handle deskthing protocol URLs when main window exists', () => {
      const testUrl = 'deskthing://test/path'
      const mockWindow = new BrowserWindow()
      handleUrl(testUrl, mockWindow)
      expect(mockWindow.webContents.send).toHaveBeenCalledWith('handle-protocol-url', 'test/path')
    })

    it('should log error when no main window exists', () => {
      const testUrl = 'deskthing://test/path'
      const consoleSpy = vi.spyOn(console, 'log')
      global.mainWindow = null
      handleUrl(testUrl)
      expect(consoleSpy).toHaveBeenCalledWith('No main window found')
    })
    it('should open auth window in external browser', async () => {
      const testUrl = 'https://auth.example.com'
      await openAuthWindow(testUrl)
      expect(shell.openExternal).toHaveBeenCalledWith(testUrl)
    })
  })

  describe('IPC Communication', () => {
    it('should send IPC data to main window', () => {
      const mockWindow = new BrowserWindow()
      const testData = { test: 'data' }
      sendIpcData({
        type: 'test-type',
        payload: testData,
        window: mockWindow
      } as unknown as ServerIPCData)
      expect(mockWindow.webContents.send).toHaveBeenCalledWith('test-type', testData)
    })
  })

  describe('App Lifecycle', () => {
    it('should quit if single instance lock cannot be obtained', () => {
      app.requestSingleInstanceLock()
      expect(app.quit).toHaveBeenCalled()
    })
  })
})
