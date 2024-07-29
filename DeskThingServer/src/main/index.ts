import { app, shell, BrowserWindow, ipcMain, Tray, Menu, dialog } from 'electron'
import { join } from 'path'
import path from 'path'
import icon from '../../resources/icon.ico?asset'
import { GithubRelease } from './types/types'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

const IPC_CHANNELS = {
  PING: 'ping',
  GET_CONNECTIONS: 'get-connections',
  ADD_APP: 'add-app',
  RUN_STOP_APP: 'stop-app',
  GET_APPS: 'get-apps',
  GET_MAPS: 'get-maps',
  SET_MAP: 'set-maps',
  STOP_APP: 'stop-app',
  DISABLE_APP: 'disable-app',
  PURGE_APP: 'purge-app',
  HANDLE_ZIP: 'handle-zip',
  USER_DATA_RESPONSE: 'user-data-response',
  SELECT_ZIP_FILE: 'select-zip-file',
  DEV_ADD_APP: 'dev-add-app'
}

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 950,
    height: 670,
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
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the remote URL for development or the local HTML file for production.
  if (process.env.ELECTRON_RENDERER_URL) {
    window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

function initializeTray(): void {
  tray = new Tray(icon)

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
      label: 'Open Window',
      click: (): void => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.focus()
        } else {
          mainWindow = createMainWindow()
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

async function setupIpcHandlers(): Promise<void> {
  const { getAppData } = await import('./handlers/configHandler')
  const {
    handleZipFromUrl,
    addApp,
    sendMessageToApp,
    handleZip,
    disableApp,
    stopApp,
    purgeAppData
  } = await import('./handlers/appHandler')
  import { getMappings } from './handlers/keyMapHandler'
  const { handleAdbCommands } = await import('./handlers/adbHandler')
  const { sendData } = await import('./handlers/websocketServer')
  const { getReleases } = await import('./handlers/githubHandler')
  const { HandleWebappZipFromUrl, HandlePushWebApp } = await import('./handlers/deviceHandler')
  const dataListener = (await import('./utils/events')).default
  const { MESSAGE_TYPES } = await import('./utils/events')

  let connections = 0
  ipcMain.on(IPC_CHANNELS.PING, () => console.log('pong'))

  ipcMain.on(IPC_CHANNELS.GET_CONNECTIONS, async (event) => {
    event.sender.send('connections', connections)
    console.log('SERVER: connections', connections)
  })

  ipcMain.on(IPC_CHANNELS.ADD_APP, async (event, appName: string) => {
    await addApp(event, appName)
  })
  ipcMain.on(IPC_CHANNELS.DEV_ADD_APP, async (event, appPath: string) => {
    await addApp(event, 'developer-app', appPath)
  })
  ipcMain.on(IPC_CHANNELS.GET_APPS, (event) => {
    const data = getAppData()
    event.sender.send('app-data', data)
  })
  ipcMain.on(IPC_CHANNELS.STOP_APP, async (_event, appName: string) => {
    await stopApp(appName)
  })
  ipcMain.on(IPC_CHANNELS.DISABLE_APP, async (_event, appName: string) => {
    await disableApp(appName)
  })
  ipcMain.on(IPC_CHANNELS.PURGE_APP, async (_event, appName: string) => {
    console.log(`====== PURGING APP ${appName} ========`)
    await purgeAppData(appName)
  })
  ipcMain.on(IPC_CHANNELS.HANDLE_ZIP, async (event, zipFilePath: string) => {
    console.log('SERVER: handling zip file event', event)
    const returnData = await handleZip(zipFilePath) // Extract to user data folder
    console.log('SERVER: Return Data after Extraction:', returnData)
    event.reply('zip-name', returnData)
  })
  ipcMain.on('extract-webapp-zip', async (event, zipFileUrl) => {
    try {
      HandleWebappZipFromUrl(event.reply, zipFileUrl)
    } catch (error) {
      console.error('Error extracting zip file:', error)
      event.reply('zip-extracted', { success: false, error: error })
    }
  })
  ipcMain.on('extract-app-zip-url', async (event, zipFileUrl) => {
    console.log('SERVER: handling zip file event', event)
    const returnData = await handleZipFromUrl(zipFileUrl, event.reply) // Extract to user data folder
    console.log('SERVER: Return Data after Extraction:', returnData)
  })
  ipcMain.on('push-staged', async (event) => {
    try {
      HandlePushWebApp(event.reply)
    } catch (error) {
      event.reply('pushed-staged', { success: false, error: error })
      console.error('Error extracting zip file:', error)
      dataListener.emit(MESSAGE_TYPES.ERROR, error)
    }
  })
  ipcMain.on(
    IPC_CHANNELS.USER_DATA_RESPONSE,
    (event, requestId: string, type: string, ...args: any[]) => {
      console.log(event)
      sendMessageToApp(requestId, type, args)
    }
  )

  ipcMain.handle(IPC_CHANNELS.SELECT_ZIP_FILE, async () => {
    if (!mainWindow) return null

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'ZIP Files', extensions: ['zip'] }]
    })
    if (result.canceled) return null

    const filePath = result.filePaths[0]
    return { path: filePath, name: path.basename(filePath) }
  })

  ipcMain.handle('run-adb-command', async (_event, command) => {
    return await handleAdbCommands(command)
  })
  ipcMain.handle('fetch-github-releases', async (_event, url): Promise<GithubRelease[]> => {
    try {
      return await getReleases(url)
    } catch (error) {
      dataListener.emit(MESSAGE_TYPES.ERROR, error)
      return []
    }
  })
  ipcMain.handle('run-device-command', async (_event, type, command) => {
    const data = { app: 'client', type: type, data: JSON.parse(command) }
    console.log('Sending data', data)
    return await sendData(null, data)
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
  dataListener.on(MESSAGE_TYPES.CONNECTION, (numConnections) => {
    sendIpcData('connections', numConnections)
    connections = numConnections
    console.log('Number of clients', numConnections)
  })
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    } else {
      mainWindow = createMainWindow()
    }
  })
  app.on('ready', () => setupIpcHandlers())
  app.whenReady().then(async () => {
    // Set app user model id for windows
    app.setAppUserModelId('com.electron')

    app.on('browser-window-created', (_, window) => {
      const { optimizer } = require('@electron-toolkit/utils')
      optimizer.watchWindowShortcuts(window)
    })

    mainWindow = createMainWindow()
    initializeTray()

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

  app.on('window-all-closed', (e) => {
    // Prevent the app from quitting
    e.preventDefault()
  })
}

async function openAuthWindow(url: string): Promise<void> {
  await shell.openExternal(url)
}
async function loadModules(): Promise<void> {
  try {
    await import('./handlers/authHandler')
    await import('./handlers/websocketServer')
    const { loadAndRunEnabledApps } = await import('./handlers/appHandler')
    loadAndRunEnabledApps()

    const { setupFirewall } = await import('./handlers/firewallHandler')
    setupFirewall(8891).catch(console.error)
  } catch (error) {
    console.error('Error loading modules:', error)
  }
}

async function sendIpcAuthMessage(_appName: string, requestId: string, scope: any): Promise<void> {
  mainWindow?.webContents.send('display-user-form', requestId, scope)
}
async function sendIpcData(dataType: string, data: any): Promise<void> {
  mainWindow?.webContents.send(dataType, data)
}

export { sendIpcAuthMessage, openAuthWindow, sendIpcData }
