import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { BrowserWindow, shell } from 'electron'
import {
  createMainWindow,
  createClientWindow,
  handleUrl,
  openAuthWindow,
  sendIpcData
} from '../../src/main'
import { ServerIPCData } from '@shared/types'

// Mock electron modules
vi.mock('electron', () => {
  const BrowserWindowMock = vi.fn().mockImplementation(() => ({
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
  }))

  // Ensure instanceof checks work correctly
  Object.defineProperty(BrowserWindowMock, Symbol.hasInstance, {
    value: () => true
  })

  return {
    app: {
      whenReady: vi.fn(),
      on: vi.fn(),
      quit: vi.fn(),
      setAsDefaultProtocolClient: vi.fn(),

      requestSingleInstanceLock: vi.fn().mockReturnValue(false),
      setAppUserModelId: vi.fn(),
      dock: {
        setMenu: vi.fn()
      }
    },
    BrowserWindow: BrowserWindowMock,
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
  }
})

// Mock path module
vi.mock('path', () => ({
  join: vi.fn(),
  resolve: vi.fn()
}))

// Mock logger
vi.mock('../../src/main/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    addListener: vi.fn()
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

          autoHideMenuBar: true,
          webPreferences: expect.objectContaining({
            sandbox: false
          })
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

          frame: true,
          webPreferences: expect.objectContaining({
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false
          })
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

      handleUrl(testUrl, null)
      expect(consoleSpy).toHaveBeenCalledWith('No main window found')
    })

    it('should open auth window in external browser', async () => {
      const testUrl = 'https://auth.example.com'
      await openAuthWindow(testUrl)
      expect(shell.openExternal).toHaveBeenCalledWith(testUrl)
    })
  })

  describe('IPC Communication', () => {
    it('should send IPC data to specified window', () => {
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
})
