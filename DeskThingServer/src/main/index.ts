/**
 * Main entry point for the Electron application.
 * Handles window creation, IPC communication, tray/dock setup, and application lifecycle.
 *
 * Features:
 * - Creates and manages main application window and client windows
 * - Sets up system tray and dock menu integration
 * - Handles custom protocol (deskthing://) for deep linking
 * - Manages IPC communication between main and renderer processes
 * - Implements single instance locking
 * - Handles application lifecycle events
 * - Manages module loading and initialization
 */
import {
  AppIPCData,
  UtilityIPCData,
  ServerIPCData,
  ClientIPCData,
  IPCData,
  UTILITY_TYPES
} from '@shared/types'
import { App } from '@deskthing/types'
import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join, resolve, dirname } from 'node:path'
import icon from '../../resources/icon.png?asset'
import dotenv from 'dotenv'
import { nextTick } from 'node:process'

if (process.env.NODE_ENV === 'development') {
  dotenv.config()
} else {
  const userDataPath = dirname(app.getPath('exe'))
  const envPath = join(userDataPath, '.env.production')
  dotenv.config({ path: envPath })
}

// Global window and tray references to prevent garbage collection
let mainWindow: BrowserWindow | null = null
let clientWindow: BrowserWindow | null = null
let tray: Tray | null = null

// Setup the custom protocol handler for deep linking
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('deskthing', process.execPath, [resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('deskthing')
}

/**
 * Creates and configures the main application window
 * @returns {BrowserWindow} The configured main window instance
 */
function createMainWindow(): BrowserWindow {
  // Create window with specific dimensions and settings
  const window = new BrowserWindow({
    width: 1130,
    height: 730,
    minWidth: 500,
    minHeight: 400,
    icon: icon,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon: icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  // Set up Content Security Policy
  window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.github.com;"
        ]
      }
    })
  })

  // Show window when ready
  window.on('ready-to-show', () => {
    window.show()
  })

  // Clean up reference when window is closed
  window.on('closed', () => {
    mainWindow = null
  })

  // Handle new window creation attempts
  window.webContents.setWindowOpenHandler((details) => {
    // Handle internal protocol links
    if (details.url.startsWith('deskthing://')) {
      handleUrl(details.url)
      return { action: 'deny' }
    } else {
      // Open external links in default browser
      shell.openExternal(details.url)
      return { action: 'deny' }
    }
  })

  // Load appropriate content based on environment
  if (process.env.ELECTRON_RENDERER_URL) {
    window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

/**
 * Creates a new client window for the application.
 * @param port - The port number to use for the client window.
 * @returns {BrowserWindow} The created client window instance
 */
function createClientWindow(port: number): BrowserWindow {
  // Create window with specific dimensions and settings for client
  const window = new BrowserWindow({
    width: 800,
    height: 480,
    minWidth: 500,
    minHeight: 140,
    show: false,
    frame: true,
    icon: icon,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#202020',
      symbolColor: '#606060',
      height: 20
    },
    webPreferences: {
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Add custom draggable title bar
  window.webContents.on('did-finish-load', () => {
    window.webContents.executeJavaScript(`
      const topBar = document.createElement('div');
      topBar.style.position = 'absolute';
      topBar.style.top = '0';
      topBar.style.left = '0';
      topBar.style.width = '100%';
      topBar.style.height = '30px';
      topBar.style.backgroundColor = 'rgba(100, 100, 100, 0.1)';
      topBar.style.zIndex = '9999';
      topBar.style.cursor = 'pointer';
      topBar.style.webkitAppRegion = 'drag';
      document.body.appendChild(topBar);
    `)
  })

  // Set up CORS for localhost:8891
  window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Access-Control-Allow-Origin': ['*'],
        'Access-Control-Allow-Methods': ['GET, POST, OPTIONS'],
        'Access-Control-Allow-Headers': ['Content-Type']
      }
    })
  })

  // Show window when ready
  window.on('ready-to-show', () => {
    window.show()
  })

  // Clean up reference when window is closed
  window.on('closed', () => {
    clientWindow = null
  })

  // Load client URL
  window.loadURL(`http://localhost:${port}/`, {})
  return window
}
/**
 * Initializes the system tray icon and menu
 */
async function initializeTray(): Promise<void> {
  const trayIcon = nativeImage.createFromPath(join(__dirname, '../../resources/icon2.png'))

  tray = new Tray(trayIcon)

  // Handle tray icon click
  tray.on('click', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    } else {
      mainWindow = createMainWindow()
    }
  })

  // Create tray context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Server',
      click: (): void => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.focus()
        } else {
          mainWindow = createMainWindow()
        }
      }
    },
    {
      label: 'Open Client',
      click: async (): Promise<void> => {
        if (clientWindow && !clientWindow.isDestroyed()) {
          clientWindow.focus()
        } else {
          const { storeProvider } = await import('./stores/storeProvider')
          const settingsStore = await storeProvider.getStore('settingsStore')
          const data = await await settingsStore.getSettings()
          if (data) {
            clientWindow = createClientWindow(data.devicePort)
          }
        }
      }
    },
    {
      label: 'Quit',
      click: (): void => {
        app.quit()
      }
    }
  ])
  tray.setToolTip('DeskThing Server')
  tray.setContextMenu(contextMenu)
}

/**
 * Initializes the dock menu (macOS only)
 */
async function initializeDoc(): Promise<void> {
  // Create dock context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Server',
      click: (): void => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.focus()
        } else {
          mainWindow = createMainWindow()
        }
      }
    },
    {
      label: 'Open Client',
      click: async (): Promise<void> => {
        if (clientWindow && !clientWindow.isDestroyed()) {
          clientWindow.focus()
        } else {
          const { storeProvider } = await import('./stores/storeProvider')
          const settingsStore = await storeProvider.getStore('settingsStore')
          const data = await settingsStore.getSettings()
          if (data) {
            clientWindow = createClientWindow(data.devicePort)
          }
        }
      }
    },
    {
      label: 'Quit',
      click: (): void => {
        app.quit()
      }
    }
  ])

  app.dock.setMenu(contextMenu)
}

/**
 * Sets up IPC handlers for communication between main and renderer processes
 */
async function setupIpcHandlers(): Promise<void> {
  // Import required stores
  const { default: Logger, ResponseLogger } = await import('./utils/logger')
  // Default handler for unimplemented IPC messages
  const defaultHandler = async (data: IPCData): Promise<void> => {
    Logger.error(`No handler implemented for type: ${data.type}`, {
      domain: 'server',
      source: 'ipcHandlers',
      function: 'defaultHandler',
      error: new Error(`Unhandled type: ${data.type}`)
    })
  }

  // Handle app-related IPC messages
  ipcMain.handle('APPS', async (event, data: AppIPCData) => {
    const { appHandler } = await import('./handlers/appHandler')
    const handler = appHandler[data.type] || defaultHandler
    const replyFn = ResponseLogger(event.sender.send.bind(event.sender))
    try {
      if (handler) {
        return await handler(data as Extract<AppIPCData, { type: keyof UTILITY_TYPES }>, replyFn)
      } else {
        Logger.error(`No handler found for type: ${data.type}`, {
          domain: 'server',
          source: 'ipcHandlers',
          function: 'APPS',
          error: new Error(`Unhandled type: ${data.type}`)
        })
      }
    } catch (error) {
      Logger.error(`Error in IPC handler with event ${data.type}: ${error}`, {
        domain: 'server',
        source: 'ipcHandlers',
        function: 'APPS',
        error: error instanceof Error ? error : new Error(String(error))
      })
    }
  })

  // Handle client-related IPC messages
  ipcMain.handle('CLIENT', async (event, data: ClientIPCData) => {
    const { clientHandler } = await import('./handlers/clientHandler')
    const handler = clientHandler[data.type] || defaultHandler
    const replyFn = ResponseLogger(event.sender.send.bind(event.sender))
    try {
      if (handler) {
        return await handler(data, replyFn)
      } else {
        Logger.error(`No handler found for type: ${data.type}`, {
          domain: 'server',
          source: 'ipcHandlers',
          function: 'CLIENT',
          error: new Error(`Unhandled type: ${data.type}`)
        })
      }
    } catch (error) {
      Logger.error(`Error in IPC handler with event ${data.type}: ${error}`, {
        domain: 'server',
        source: 'ipcHandlers',
        function: 'CLIENT',
        error: error instanceof Error ? error : new Error(String(error))
      })
    }
  })

  // Handle utility-related IPC messages
  ipcMain.handle('UTILITY', async (event, data: UtilityIPCData) => {
    const { utilityHandler } = await import('./handlers/utilityHandler')
    const replyFn = ResponseLogger(event.sender.send.bind(event.sender))
    const handler = utilityHandler[data.type]

    try {
      if (handler) {
        return await handler(
          data as Extract<UtilityIPCData, { type: keyof UTILITY_TYPES }>,
          replyFn
        )
      } else {
        Logger.error(`No handler found for type: ${data.type}`, {
          domain: 'server',
          source: 'ipcHandlers',
          function: 'UTILITY',
          error: new Error(`Unhandled type: ${data.type}`)
        })
      }
    } catch (error) {
      Logger.error(`Error in IPC handler with event ${data.type}: ${error}`, {
        domain: 'server',
        source: 'ipcHandlers',
        function: 'UTILITY',
        error: error instanceof Error ? error : new Error(String(error))
      })
    }
  })

  // Set up logging store listener
  Logger.addListener((logData) => {
    sendIpcData({
      type: 'log',
      payload: logData
    })
  })

  import('./services/updater/autoUpdater').then(async ({ checkForUpdates }) => {
    Logger.debug('[INDEX] Checking for updates...')
    checkForUpdates()
  })
}

// Ensure single instance of the application
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  // Handle second instance launch
  app.on('second-instance', (_event, commandLine) => {
    const url = commandLine.find((arg) => arg.startsWith('deskthing://'))
    if (url) {
      handleUrl(url)
    }

    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    } else {
      mainWindow = createMainWindow()
    }
  })

  // Initialize application when ready
  app.whenReady().then(async () => {
    // Handle custom protocol URLs
    app.on('open-url', (event, url) => {
      event.preventDefault()
      handleUrl(url)
    })

    // Initialize dock or tray based on platform
    if (process.platform == 'darwin') {
      initializeDoc()
    } else {
      initializeTray()
    }
    app.setAppUserModelId('com.deskthing')

    // Set up window optimization
    app.on('browser-window-created', async (_, window) => {
      const { optimizer } = await import('@electron-toolkit/utils')
      optimizer.watchWindowShortcuts(window)
    })

    // Create main window and set up handlers
    mainWindow = createMainWindow()

    mainWindow.on('ready-to-show', () => {
      mainWindow?.show()
    })

    nextTick(async () => {
      loadModules()
      setupIpcHandlers()
    })

    // Handle window recreation on macOS
    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow()
      }
    })
  })

  // Handle window closure
  app.on('window-all-closed', async () => {
    const { storeProvider } = await import('./stores/storeProvider')
    const settingsStore = await storeProvider.getStore('settingsStore')
    const settings = await settingsStore.getSettings()
    if (settings?.minimizeApp) {
      // Clear cache from everywhere
      const { default: cacheManager } = await import('./services/cache/cacheManager')
      await cacheManager.hibernateAll()
    } else {
      app.quit()
    }
  })
}

/**
 * Handles custom protocol URLs
 * @param url - The URL to handle
 */
async function handleUrl(
  url: string | undefined,
  window: BrowserWindow | null = mainWindow
): Promise<void> {
  if (url && url.startsWith('deskthing://')) {
    const path = url.replace('deskthing://', '')

    if (path.startsWith('a?') || path.startsWith('a/?')) {
      const { default: Logger } = await import('./utils/logger')

      Logger.debug('Attempting to handle with authStore', {
        source: 'handleUrl',
        function: 'handleUrl'
      })
      const { storeProvider } = await import('./stores/storeProvider')
      const authStore = await storeProvider.getStore('authStore')
      authStore.handleProtocol(url)

      return
    }
    console.log('Sending path to webContents for handling')

    const targetWindow = clientWindow && !clientWindow.isDestroyed() ? clientWindow : window

    if (targetWindow) {
      targetWindow.webContents.send('handle-protocol-url', path)
    } else {
      console.log('No window available to handle URL:', url)
    }
  }
}
async function loadModules(): Promise<void> {
  try {
    // Store listeners
    // const { storeProvider } = await import('./stores/storeProvider')

    // const expressServerStore = await storeProvider.getStore('expressServerStore')
    // expressServerStore.start()

    const { initializePlatforms } = await import('./services/platforms/platformInitializer')
    await initializePlatforms()

    const { initializeStores } = await import('./services/cache/storeInitializer')
    await initializeStores()
  } catch (error) {
    console.error('Error loading modules: ', error)
  }
}

export type IpcDataTypes = {
  dataType: ''
  data: App[]
}

async function sendIpcData({ type, payload, window }: ServerIPCData): Promise<void> {
  if (window && window instanceof BrowserWindow) {
    window.webContents.send(type, payload)
  } else {
    mainWindow?.webContents.send(type, payload)
  }
}

export { sendIpcData, createMainWindow, createClientWindow, handleUrl }
