import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { BrowserWindow } from 'electron'
import { ServerIPCData } from '@shared/types'

// Mock electron modules
vi.mock('electron', () => {
  const mockWebContents = {
    session: {
      webRequest: {
        onHeadersReceived: vi.fn((callback) => {
          callback(
            {
              responseHeaders: {}
            },
            (details) => details
          )
        })
      }
    },
    setWindowOpenHandler: vi.fn((handler) => {
      handler({ url: 'deskthing://test' })
      handler({ url: 'https://external.com' })
    }),
    on: vi.fn(),
    executeJavaScript: vi.fn(),
    send: vi.fn()
  }

  const BrowserWindowMock = vi.fn().mockImplementation(() => ({
    loadURL: vi.fn().mockResolvedValue(undefined),
    loadFile: vi.fn().mockResolvedValue(undefined),
    on: vi.fn((event, callback) => {
      if (event === 'ready-to-show') callback()
      if (event === 'closed') callback()
    }),
    show: vi.fn(),
    focus: vi.fn(),
    isMinimized: vi.fn().mockReturnValue(false),
    restore: vi.fn(),
    isDestroyed: vi.fn().mockReturnValue(false),
    webContents: mockWebContents
  }))

  Object.defineProperty(BrowserWindowMock, Symbol.hasInstance, {
    value: () => true
  })

  return {
    app: {
      whenReady: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      quit: vi.fn(),
      setAsDefaultProtocolClient: vi.fn(),
      requestSingleInstanceLock: vi.fn().mockReturnValue(true),
      setAppUserModelId: vi.fn(),
      getPath: vi.fn().mockReturnValue('/fake/path'),
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
      on: vi.fn((event, callback) => {
        if (event === 'click') callback()
      })
    })),
    Menu: {
      buildFromTemplate: vi.fn().mockReturnValue({})
    },
    shell: {
      openExternal: vi.fn().mockResolvedValue(undefined)
    },
    nativeImage: {
      createFromPath: vi.fn().mockReturnValue({})
    }
  }
})

vi.mock('node:path', () => ({
  join: vi.fn((...args) => args.join('/')),
  resolve: vi.fn((path) => path),
  dirname: vi.fn((path) => path)
}))

vi.mock('../../src/main/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    addListener: vi.fn()
  },
  ResponseLogger: vi.fn((fn) => fn)
}))

vi.mock('../../src/main/stores/storeProvider', () => ({
  storeProvider: {
    getStore: vi.fn().mockResolvedValue({
      getSettings: vi.fn().mockResolvedValue({ devicePort: 8080, minimizeApp: false })
    })
  }
}))

vi.mock('../../src/main/services/events/uiBus', () => ({
  uiEventBus: {
    setMainWindow: vi.fn()
  }
}))

describe('Main Process', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('ELECTRON_RENDERER_URL', 'http://localhost:5173')
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('Window Creation', () => {
    it('should create main window and handle lifecycle events', async () => {
      const { createMainWindow } = await import('../../src/main/windows/mainWindow')
      const window = createMainWindow()

      expect(window.webContents.session.webRequest.onHeadersReceived).toHaveBeenCalled()
      expect(window.on).toHaveBeenCalledWith('ready-to-show', expect.any(Function))
      expect(window.on).toHaveBeenCalledWith('closed', expect.any(Function))
      expect(window.webContents.setWindowOpenHandler).toHaveBeenCalled()
      expect(window.loadURL).toHaveBeenCalledWith('http://localhost:5173')
    })

    it('should create client window with custom configuration', async () => {
      const { createClientWindow } = await import('../../src/main/windows/clientWindow')
      const port = 8080
      const window = createClientWindow(port)

      expect(window.webContents.on).toHaveBeenCalledWith('did-finish-load', expect.any(Function))
      expect(window.webContents.session.webRequest.onHeadersReceived).toHaveBeenCalled()
      expect(window.loadURL).toHaveBeenCalledWith('http://localhost:8080/', {})
    })
  })
})