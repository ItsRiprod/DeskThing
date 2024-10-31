import { AppIPCData, AuthScopes, Client, UtilityIPCData } from '@shared/types'
import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join, resolve } from 'path'
import icon from '../../resources/icon.png?asset'
import ConnectionStore from './stores/connectionsStore'
import settingsStore from './stores/settingsStore'

let mainWindow: BrowserWindow | null = null
let clientWindow: BrowserWindow | null = null
let tray: Tray | null = null

// Setup the scheme handler
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('deskthing', process.execPath, [resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('deskthing')
}

function createMainWindow(): BrowserWindow {
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

  window.on('ready-to-show', () => {
    window.show()
  })

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.setWindowOpenHandler((details) => {
    // Prevent opening new windows for internal URLs
    if (details.url.startsWith('deskthing://')) {
      handleUrl(details.url)
      return { action: 'deny' } // Deny new window creation
    } else {
      shell.openExternal(details.url) // Open external URLs in the browser
      return { action: 'deny' }
    }
  })

  // Load the remote URL for development or the local HTML file for production.
  if (process.env.ELECTRON_RENDERER_URL) {
    window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

function createClientWindow(port: number): BrowserWindow {
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
      contextIsolation: true, // For security
      nodeIntegration: false // For security
    }
  })

  window.webContents.on('did-finish-load', () => {
    window.webContents.executeJavaScript(`
      const topBar = document.createElement('div');
      topBar.style.position = 'absolute';
      topBar.style.top = '0';
      topBar.style.left = '0';
      topBar.style.width = '100%';
      topBar.style.height = '30px'; // Height of the top bar
      topBar.style.backgroundColor = 'rgba(100, 100, 100, 0.1)'; // Invisible background
      topBar.style.zIndex = '9999'; // Ensure it appears on top
      topBar.style.cursor = 'pointer'; // Cursor indicates interaction
      topBar.style.webkitAppRegion = 'drag';
      document.body.appendChild(topBar);
    `)
  })

  window.on('ready-to-show', () => {
    window.show()
  })

  window.on('closed', () => {
    clientWindow = null
  })

  window.loadURL(`http://localhost:${port}/client`, {})
  return window
}

async function initializeTray(): Promise<void> {
  const settingsStore = await import('./stores/settingsStore')

  const trayIcon = nativeImage.createFromPath(join(__dirname, '../../resources/icon2.png'))

  tray = new Tray(trayIcon)

  tray.on('click', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    } else {
      mainWindow = createMainWindow()
    }
  })

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

async function initializeDoc(): Promise<void> {
  const settingsStore = await import('./stores/settingsStore')

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

async function setupIpcHandlers(): Promise<void> {
  const dataListener = (await import('./utils/events')).default
  const { MESSAGE_TYPES } = await import('./utils/events')

  const { appHandler } = await import('./handlers/appHandler')
  const { clientHandler } = await import('./handlers/clientHandler')
  const { utilityHandler } = await import('./handlers/utilityHandler')
  const { ResponseLogger } = await import('./utils/events')

  const defaultHandler = async (data: AppIPCData): Promise<void> => {
    console.error(`No handler implemented for type: ${data.type} ${data}`)
    dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `No handler implemented for type: ${data.type}`)
  }

  ipcMain.handle('APPS', async (event, data: AppIPCData) => {
    const handler = appHandler[data.type] || defaultHandler
    const replyFn = ResponseLogger(event.sender.send.bind(event.sender))
    try {
      if (handler) {
        return await handler(data, replyFn) // Execute the corresponding handler function
      } else {
        console.error(`No handler found for type: ${data.type}`)
        throw new Error(`Unhandled type: ${data.type}`)
      }
    } catch (error) {
      console.error('Error in IPC handler:', error)
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `Error in IPC handler: ${error}`)
    }
  })

  ipcMain.handle('CLIENT', async (event, data: AppIPCData) => {
    const handler = clientHandler[data.type] || defaultHandler
    const replyFn = ResponseLogger(event.sender.send.bind(event.sender))
    try {
      if (handler) {
        return await handler(data, replyFn) // Execute the corresponding handler function
      } else {
        console.error(`No handler found for type: ${data.type}`)
        throw new Error(`Unhandled type: ${data.type}`)
      }
    } catch (error) {
      console.error('Error in IPC handler:', error)
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `Error in IPC handler: ${error}`)
    }
  })

  ipcMain.handle('UTILITY', async (event, data: UtilityIPCData) => {
    console.log('Received IPC data:', data)
    const handler = utilityHandler[data.type] || defaultHandler
    const replyFn = ResponseLogger(event.sender.send.bind(event.sender))

    try {
      if (handler) {
        return await handler(data, replyFn) // Execute the corresponding handler function
      } else {
        console.error(`No handler found for type: ${data.type}`)
        throw new Error(`Unhandled type: ${data.type}`)
      }
    } catch (error) {
      console.error('Error in IPC handler:', error)
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `Error in IPC handler: ${error}`)
    }
  })

  dataListener.on(MESSAGE_TYPES.ERROR, (errorData) => {
    sendIpcData('error', errorData)
  })
  dataListener.on(MESSAGE_TYPES.LOGGING, (errorData) => {
    sendIpcData('log', errorData)
  })
  dataListener.on(MESSAGE_TYPES.MESSAGE, (errorData) => {
    sendIpcData('message', errorData)
  })
  ConnectionStore.on((clients: Client[]) => {
    sendIpcData('connections', { status: true, data: clients.length, final: true })
    sendIpcData('clients', { status: true, data: clients, final: true })
  })
  ConnectionStore.onDevice((devices: string[]) => {
    sendIpcData('adbdevices', { status: true, data: devices, final: true })
  })
  dataListener.on(MESSAGE_TYPES.SETTINGS, (newSettings) => {
    sendIpcData('settings-updated', newSettings)
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    const url = commandLine.find((arg) => arg.startsWith('deskthing://'))
    if (url) {
      handleUrl(url)
    }

    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    } else {
      // mainWindow = createMainWindow()
    }
  })
  app.on('ready', () => setupIpcHandlers())
  app.whenReady().then(async () => {
    // Set app user model id for windows

    app.on('open-url', (event, url) => {
      event.preventDefault()
      handleUrl(url)
    })

    if (process.platform == 'darwin') {
      initializeDoc()
    } else {
      initializeTray()
    }
    app.setAppUserModelId('com.deskthing')

    app.on('browser-window-created', (_, window) => {
      const { optimizer } = require('@electron-toolkit/utils')
      optimizer.watchWindowShortcuts(window)
    })

    mainWindow = createMainWindow()

    mainWindow.once('ready-to-show', () => {
      loadModules()
    })

    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow()
      }
    })
  })

  app.on('window-all-closed', async (e) => {
    // Prevent the app from quitting
    const settings = await settingsStore.getSettings()
    if (settings.minimizeApp) {
      e.preventDefault()
    } else {
      app.quit()
    }
  })
}

function handleUrl(url: string | undefined): void {
  if (url && url.startsWith('deskthing://')) {
    const path = url.replace('deskthing://', '')

    console.log('Handling URL:', url, path)

    if (mainWindow) {
      mainWindow.webContents.send('handle-protocol-url', path)
    }
  }
}
async function openAuthWindow(url: string): Promise<void> {
  await shell.openExternal(url)
}
async function loadModules(): Promise<void> {
  try {
    await import('./handlers/authHandler')

    await import('./services/client/websocket').then(({ restartServer }) => {
      restartServer()
    })

    const { loadAndRunEnabledApps } = await import('./services/apps')
    loadAndRunEnabledApps()

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
