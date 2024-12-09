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

console.log('[Index] Starting')
import { AppIPCData, AuthScopes, Client, UtilityIPCData, MESSAGE_TYPES } from '@shared/types'
import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join, resolve } from 'path'
import icon from '../../resources/icon.png?asset'

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
      preload: join(__dirname, '../preload/index.js'),
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
          const settingsStore = await import('./stores/settingsStore')
          const data = await settingsStore.default.getSettings()
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
          const settingsStore = await import('./stores/settingsStore')
          const data = await settingsStore.default.getSettings()
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
  const [{ default: settingsStore }, { default: loggingStore, ResponseLogger }] = await Promise.all(
    [import('./stores/settingsStore'), import('./stores/loggingStore')]
  )

  // Default handler for unimplemented IPC messages
  const defaultHandler = async (data: AppIPCData): Promise<void> => {
    console.error(`No handler implemented for type: ${data.type} ${data}`)
    loggingStore.log(MESSAGE_TYPES.ERROR, `No handler implemented for type: ${data.type}`)
  }

  // Handle app-related IPC messages
  ipcMain.handle('APPS', async (event, data: AppIPCData) => {
    const { appHandler } = await import('./handlers/appHandler')
    const handler = appHandler[data.type] || defaultHandler
    const replyFn = ResponseLogger(event.sender.send.bind(event.sender))
    try {
      if (handler) {
        return await handler(data, replyFn)
      } else {
        console.error(`No handler found for type: ${data.type}`)
        throw new Error(`Unhandled type: ${data.type}`)
      }
    } catch (error) {
      console.error('Error in IPC handler:', error)
      loggingStore.log(MESSAGE_TYPES.ERROR, `Error in IPC handler: ${error}`)
    }
  })

  // Handle client-related IPC messages
  ipcMain.handle('CLIENT', async (event, data: AppIPCData) => {
    const { clientHandler } = await import('./handlers/clientHandler')
    const handler = clientHandler[data.type] || defaultHandler
    const replyFn = ResponseLogger(event.sender.send.bind(event.sender))
    try {
      if (handler) {
        return await handler(data, replyFn)
      } else {
        console.error(`No handler found for type: ${data.type}`)
        throw new Error(`Unhandled type: ${data.type}`)
      }
    } catch (error) {
      console.error('Error in IPC handler:', error)
      loggingStore.log(MESSAGE_TYPES.ERROR, `Error in IPC handler: ${error}`)
    }
  })

  // Handle utility-related IPC messages
  ipcMain.handle('UTILITY', async (event, data: UtilityIPCData) => {
    const { utilityHandler } = await import('./handlers/utilityHandler')
    const handler = utilityHandler[data.type] || defaultHandler
    const replyFn = ResponseLogger(event.sender.send.bind(event.sender))

    try {
      if (handler) {
        return await handler(data, replyFn)
      } else {
        console.error(`No handler found for type: ${data.type}`)
        throw new Error(`Unhandled type: ${data.type}`)
      }
    } catch (error) {
      console.error('Error in IPC handler:', error)
      loggingStore.log(MESSAGE_TYPES.ERROR, `Error in IPC handler: ${error}`)
    }
  })

  // Set up mapping store listeners
  import('./services/mappings/mappingStore').then(({ default: mappingStore }) => {
    mappingStore.addListener('action', (action) => {
      sendIpcData('action', action)
    })
    mappingStore.addListener('key', (key) => {
      sendIpcData('key', key)
    })
    mappingStore.addListener('profile', (profile) => {
      sendIpcData('profile', profile)
    })
  })

  // Set up logging store listener
  loggingStore.addListener((errorData) => {
    sendIpcData('log', errorData)
  })

  // Set up settings store listener
  settingsStore.addListener((newSettings) => {
    sendIpcData('settings-updated', newSettings)
  })

  // Set up connections store listeners
  import('./stores/connectionsStore').then(({ default: ConnectionStore }) => {
    ConnectionStore.on((clients: Client[]) => {
      sendIpcData('connections', { status: true, data: clients.length, final: true })
      sendIpcData('clients', { status: true, data: clients, final: true })
    })
    ConnectionStore.onDevice((devices: string[]) => {
      sendIpcData('adbdevices', { status: true, data: devices, final: true })
    })
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
    app.on('browser-window-created', (_, window) => {
      const { optimizer } = require('@electron-toolkit/utils')
      optimizer.watchWindowShortcuts(window)
    })

    // Create main window and set up handlers
    mainWindow = createMainWindow()

    mainWindow.once('ready-to-show', () => {
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
  app.on('window-all-closed', async (e) => {
    const { default: settingsStore } = await import('./stores/settingsStore')

    const settings = await settingsStore.getSettings()
    if (settings.minimizeApp) {
      e.preventDefault()
    } else {
      app.quit()
    }
  })
}

/**
 * Handles custom protocol URLs
 * @param url - The URL to handle
 */
function handleUrl(url: string | undefined): void {
  if (url && url.startsWith('deskthing://')) {
    const path = url.replace('deskthing://', '')

    if (mainWindow) {
      mainWindow.webContents.send('handle-protocol-url', path)
    }
  }
}

/**
 * Opens authentication window in default browser
 * @param url - The authentication URL
 */
async function openAuthWindow(url: string): Promise<void> {
  await shell.openExternal(url)
}
async function loadModules(): Promise<void> {
  try {
    import('./handlers/authHandler')

    import('./services/client/websocket').then(({ restartServer }) => {
      restartServer()
    })

    import('./services/apps').then(({ loadAndRunEnabledApps }) => {
      loadAndRunEnabledApps()
    })

    import('./handlers/musicHandler')
  } catch (error) {
    console.error('Error loading modules:', error)
  }
}

async function sendIpcAuthMessage(
  _appName: string,
  requestId: string,
  scope: AuthScopes
): Promise<void> {
  mainWindow?.webContents.send('display-user-form', requestId, scope)
}
async function sendIpcData(dataType: string, data: unknown): Promise<void> {
  mainWindow?.webContents.send(dataType, data)
}

export { sendIpcAuthMessage, openAuthWindow, sendIpcData }
