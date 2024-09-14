import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  dialog,
  nativeImage,
  NativeImage
} from 'electron'
import { join } from 'path'
import path from 'path'
import icon from '../../resources/icon.ico?asset'
import linuxIcon from '../../resources/icon.png?asset'
import { Client, GithubRelease } from './types/types'
import { ServerManifest } from './handlers/deviceHandler'
import { Settings } from './stores/settingsStore'
import { socketData } from './handlers/websocketServer'
import ConnectionStore from './stores/connectionsStore'

let mainWindow: BrowserWindow | null = null
let clientWindow: BrowserWindow | null = null
let tray: Tray | null = null

export interface ReplyData {
  status: boolean
  data: any
  final: boolean
  error?: string
}

const IPC_CHANNELS = {
  PING: 'ping',
  GET_CONNECTIONS: 'get-connections',
  REMOVE_CONNECTIONS: 'remove-connection',
  ADD_APP: 'add-app',
  RUN_STOP_APP: 'stop-app',
  RUN_ADB: 'run-adb-command',
  RUN_DEVICE_COMMAND: 'run-device-command',
  GET_SETTINGS: 'get-settings',
  SAVE_SETTINGS: 'save-settings',
  GET_APPS: 'get-apps',
  GET_APP_DATA: 'get-app-data',
  GET_GITHUB: 'fetch-github-releases',
  GET_LOGS: 'get-logs',
  GET_MAPS: 'get-maps',
  SET_MAP: 'set-maps',
  GET_CLIENT_MANIFEST: 'get-client-manifest',
  SET_CLIENT_MANIFEST: 'set-client-manifest',
  SET_APP_DATA: 'set-app-data',
  STOP_APP: 'stop-app',
  DISABLE_APP: 'disable-app',
  PURGE_APP: 'purge-app',
  HANDLE_ZIP: 'handle-zip',
  USER_DATA_RESPONSE: 'user-data-response',
  SELECT_ZIP_FILE: 'select-zip-file',
  EXTRACT_WEBAPP_ZIP: 'extract-webapp-zip',
  EXTRACT_APP_ZIP_URL: 'extract-app-zip-url',
  PUSH_STAGED_WEBAPP: 'push-staged',
  PUSH_PROXY_SCRIPT: 'push-proxy-script',
  SHUTDOWN: 'shutdown',
  DEV_ADD_APP: 'dev-add-app',
  SEND_TO_APP: 'send-to-app',
  OPEN_LOG_FOLDER: 'open-log-folder'
}

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1035,
    height: 730,
    minWidth: 500,
    minHeight: 400,
    icon: icon,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon: linuxIcon } : {}),
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

  window.loadURL(`http://localhost:${port}/client`, {
    userAgent:
      'Mozilla/5.0 (Linux; Android 4.2.1; en-us; Nexus 5 Build/JOP40D) AppleWebKit/535.19 (KHTML, like Gecko; googleweblight) Chrome/38.0.1025.166 Mobile Safari/535.19'
  })
  return window
}

async function initializeTray(): Promise<void> {
  const settingsStore = await import('./stores/settingsStore')

  let trayIcon: NativeImage
  if (process.platform === 'win32') {
    trayIcon = nativeImage.createFromPath(join(__dirname, '../../resources/icon.ico'))
  } else {
    trayIcon = nativeImage.createFromPath(join(__dirname, '../../resources/icon.png'))
  }

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
          if (data.payload) {
            clientWindow = createClientWindow(data.payload.devicePort)
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
          if (data.payload) {
            clientWindow = createClientWindow(data.payload.devicePort)
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
  const settingsStore = await import('./stores/settingsStore')
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
  const { getData, setData } = await import('./handlers/dataHandler')
  const { loadMappings, setMappings } = await import('./handlers/keyMapHandler')
  const { handleAdbCommands } = await import('./handlers/adbHandler')
  const { sendData, disconnectClient } = await import('./handlers/websocketServer')
  const { getReleases } = await import('./handlers/githubHandler')
  const {
    HandleWebappZipFromUrl,
    HandlePushWebApp,
    SetupProxy,
    handleClientManifestUpdate,
    getClientManifest
  } = await import('./handlers/deviceHandler')
  const dataListener = (await import('./utils/events')).default
  const { MESSAGE_TYPES } = await import('./utils/events')

  const { setupFirewall } = await import('./handlers/firewallHandler')
  const payload = (await settingsStore.default.getSettings()).payload as Settings
  if (payload) {
    setupFirewall(payload.devicePort).catch(console.error)
  } else {
    dataListener.asyncEmit(MESSAGE_TYPES.ERROR, 'No settings found!')
  }

  ipcMain.on(IPC_CHANNELS.PING, () => console.log('pong'))
  ipcMain.on(IPC_CHANNELS.GET_CONNECTIONS, async (event) => {
    const clients = await ConnectionStore.getClients()
    event.reply('connections', { status: true, data: clients.length, final: false })
    event.reply('clients', { status: true, data: clients, final: true })
  })

  ipcMain.on(IPC_CHANNELS.REMOVE_CONNECTIONS, async (event, connectionId: string) => {
    disconnectClient(connectionId)
    event.reply('logging', { status: true, data: 'Finished', final: true })
  })

  ipcMain.on(IPC_CHANNELS.ADD_APP, async (event, appName: string) => {
    await addApp(event, appName)
    event.reply('logging', { status: true, data: 'Finished', final: true })
  })
  ipcMain.on(IPC_CHANNELS.DEV_ADD_APP, async (event, appPath: string) => {
    await addApp(event, 'developer-app', appPath)
    event.reply('logging', { status: true, data: 'Finished', final: true })
  })
  ipcMain.on(IPC_CHANNELS.GET_APPS, (event) => {
    event.reply('logging', { status: true, data: 'Getting data', final: false })
    const data = getAppData()
    event.reply('logging', { status: true, data: 'Finished', final: true })
    event.reply('app-data', { status: true, data: data, final: true })
  })
  ipcMain.on(IPC_CHANNELS.STOP_APP, async (event, appName: string) => {
    event.reply('logging', { status: true, data: 'Stopping App', final: false })
    await stopApp(appName)
    event.reply('logging', { status: true, data: 'Finished', final: true })
  })
  ipcMain.on(IPC_CHANNELS.DISABLE_APP, async (event, appName: string) => {
    event.reply('logging', { status: true, data: 'Disabling App', final: false })
    await disableApp(appName)
    event.reply('logging', { status: true, data: 'Finished', final: true })
  })
  ipcMain.on(IPC_CHANNELS.PURGE_APP, async (event, appName: string) => {
    event.reply('logging', { status: true, data: 'Purging App', final: false })
    console.log(`====== PURGING APP ${appName} ========`)
    await purgeAppData(appName)
    event.reply('logging', { status: true, data: 'Finished', final: true })
  })
  ipcMain.on(IPC_CHANNELS.HANDLE_ZIP, async (event, zipFilePath: string) => {
    event.reply('logging', { status: true, data: 'Handling zipped app', final: false })

    const returnData = await handleZip(zipFilePath, event) // Extract to user data folder

    event.reply('logging', { status: true, data: 'Finished', final: true })
    event.reply('zip-name', { status: true, data: returnData, final: true })
  })
  ipcMain.on(IPC_CHANNELS.EXTRACT_WEBAPP_ZIP, async (event, zipFileUrl) => {
    try {
      event.reply('logging', { status: true, data: 'Handling web app from URL', final: false })
      HandleWebappZipFromUrl(event.reply, zipFileUrl)
    } catch (error) {
      console.error('Error extracting zip file:', error)
      event.reply('zip-extracted', { success: false, error: error })
    }
  })
  ipcMain.on(IPC_CHANNELS.EXTRACT_APP_ZIP_URL, async (event, zipFileUrl) => {
    event.reply('logging', { status: true, data: 'Handling app from URL...', final: false })
    const returnData = await handleZipFromUrl(zipFileUrl, event) // Extract to user data folder
    console.log('SERVER: Return Data after Extraction:', returnData)
  })
  ipcMain.on(IPC_CHANNELS.SHUTDOWN, async () => {
    app.quit()
  })
  ipcMain.on(IPC_CHANNELS.PUSH_STAGED_WEBAPP, async (event, deviceId) => {
    try {
      console.log('Pushing staged webapp...')
      HandlePushWebApp(event.reply, deviceId)
    } catch (error) {
      event.reply(IPC_CHANNELS.PUSH_STAGED_WEBAPP, { success: false, error: error })
      console.error('Error extracting zip file:', error)
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, error)
    }
  })
  ipcMain.on(IPC_CHANNELS.PUSH_PROXY_SCRIPT, async (event, deviceId) => {
    try {
      console.log('Pushing proxy script...')
      SetupProxy(event.reply, deviceId)
    } catch (error) {
      event.reply(IPC_CHANNELS.PUSH_PROXY_SCRIPT, { success: false, error: error })
      console.error('Error pushing proxy script:', error)
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, error)
    }
  })
  ipcMain.on(IPC_CHANNELS.USER_DATA_RESPONSE, (event, requestId: string, data: any) => {
    console.log(event)
    sendMessageToApp(requestId, data)
  })

  ipcMain.handle(IPC_CHANNELS.SEND_TO_APP, async (event, data: socketData) => {
    console.log('sending data to app: ', data.app, data)
    await sendMessageToApp(data.app, data)
    event.sender.emit('logging', { status: true, data: 'Finished', final: true })
  })

  ipcMain.handle(
    IPC_CHANNELS.SET_APP_DATA,
    async (event, appId: string, data: { [key: string]: string }) => {
      console.log('Saving app data: ', data)
      dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, 'SERVER: Saving ' + appId + "'s data " + data)
      await setData(appId, data)
      event.sender.emit('logging', { status: true, data: 'Finished', final: true })
    }
  )

  ipcMain.handle(IPC_CHANNELS.GET_APP_DATA, async (event, appId: string) => {
    try {
      const data = await getData(appId)
      event.sender.emit('logging', { status: true, data: 'Finished', final: true })
      return data
    } catch (error) {
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, 'SERVER: Error saving manifest' + error)
      console.error('Error setting client manifest:', error)
      event.sender.emit('logging', { status: false, data: 'Unfinished', error: error, final: true })
      return null
    }
  })
  ipcMain.handle(
    IPC_CHANNELS.SET_CLIENT_MANIFEST,
    async (event, manifest: Partial<ServerManifest>) => {
      try {
        await handleClientManifestUpdate(event.sender, manifest)
      } catch (error) {
        dataListener.asyncEmit(MESSAGE_TYPES.ERROR, 'SERVER: Error saving manifest' + error)
        console.error('Error setting client manifest:', error)
      }
    }
  )
  ipcMain.handle(IPC_CHANNELS.GET_CLIENT_MANIFEST, async (event) => {
    try {
      const manifest = await getClientManifest(event.sender)
      return manifest
    } catch (error) {
      console.error('Error getting client manifest:', error)
      return null
    }
  })
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

  ipcMain.handle(IPC_CHANNELS.RUN_ADB, async (event, command) => {
    return await handleAdbCommands(command, event)
  })
  ipcMain.handle(IPC_CHANNELS.GET_LOGS, async () => {
    const Logger = await import('./utils/logger')
    return await Logger.default.getLogs()
  })
  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, async () => {
    return await settingsStore.default.getSettings()
  })
  ipcMain.handle(IPC_CHANNELS.SAVE_SETTINGS, async (_event, settings) => {
    return await settingsStore.default.saveSettings(settings)
  })
  ipcMain.handle(IPC_CHANNELS.GET_MAPS, async (event) => {
    event.sender.send('logging', { status: true, data: 'Maps Retrieved!', final: true })
    return await loadMappings()
  })
  ipcMain.handle(IPC_CHANNELS.SET_MAP, async (event, name, map) => {
    event.sender.send('logging', { status: true, data: 'Maps Saved!', final: true })
    await setMappings(name, map)
  })
  ipcMain.handle(IPC_CHANNELS.GET_GITHUB, async (_event, url): Promise<GithubRelease[]> => {
    try {
      return await getReleases(url)
    } catch (error) {
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, error)
      return []
    }
  })
  ipcMain.handle(IPC_CHANNELS.RUN_DEVICE_COMMAND, async (event, type, command) => {
    const data = { app: 'client', type: type, data: JSON.parse(command) }
    console.log('Sending data', data)
    event.sender.send('logging', { status: true, data: 'Finished', final: true })
    return await sendData(null, data)
  })

  ipcMain.handle(IPC_CHANNELS.OPEN_LOG_FOLDER, async () => {
    const logPath = path.join(app.getPath('userData'))
    await shell.openPath(logPath)
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
    sendIpcData('connections', { status: true, data: clients.length, final: false })
    sendIpcData('clients', { status: true, data: clients, final: true })
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

    if (process.platform == 'darwin') {
      initializeDoc()
    } else {
      initializeTray()
    }
    app.setAppUserModelId('com.electron')

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
