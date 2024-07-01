import { app, shell, BrowserWindow, ipcMain, Tray, Menu, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.ico?asset'
import { getAppData } from './utility/configHandler'
import {
  addApp,
  sendMessageToApp,
  handleZip,
  loadAndRunEnabledApps,
  disableApp,
  stopApp,
  purgeAppData
} from './utility/appHandler'
import './utility/authHandler'
import './utility/websocketServer'
import path from 'path'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

loadAndRunEnabledApps()

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 950,
    height: 670,
    icon: icon,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')
  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.on('add-app', async (event, appName: string) => {
    addApp(event, appName)
  })
  ipcMain.on('get-apps', async (event) => {
    const data = getAppData()
    event.sender.send('app-data', data)
  })
  ipcMain.on('stop-app', async (_event, appName: string) => {
    stopApp(appName)
  })
  ipcMain.on('disable-app', async (_event, appName: string) => {
    disableApp(appName)
  })
  ipcMain.on('purge-app', async (_event, appName: string) => {
    console.log(`====== PURGING APP ${appName} ========`)
    purgeAppData(_event, appName)
  })

  ipcMain.on('handle-zip', async (event, zipFilePath: string) => {
    console.log('SERVER: handling zip file event', event)
    const returnData = await handleZip(zipFilePath) // Extract to user data folder
    console.log('SERVER: Return Data after Extraction:', returnData)
    event.sender.send('zip-name', returnData)
  })

  ipcMain.on('user-data-response', (event, requestId: string, type: string, ...args: any[]) => {
    console.log(event)
    sendMessageToApp(requestId, type, args)
  })

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus()
  } else {
    createWindow()
  }

  tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Window',
      click: async (): Promise<void> => {
        // Check if mainWindow exists and is not destroyed
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.focus()
        } else {
          createWindow()
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

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', (e) => {
  // Prevent the app from quitting
  e.preventDefault()
})

function openAuthWindow(url: string): void {
  const authWindow = new BrowserWindow({
    width: 850,
    height: 600,
    show: true,
    webPreferences: {
      nodeIntegration: false, // Ensure to set nodeIntegration to false for security reasons
      contextIsolation: true,
      sandbox: true // Enable sandbox to enhance security
    }
  })

  authWindow.loadURL(url)

  authWindow.on('closed', () => {
    // Dereference the window object
    authWindow.destroy()
  })
}

async function sendIpcMessage(
  appName: string,
  requestId: string,
  scope: Array<string>
): Promise<void> {
  console.log('Sending Ipc message to main process:', appName, requestId, scope)
  mainWindow?.webContents.send('display-user-form', requestId, scope)
}
async function sendIpcData(dataType: string, data: any): Promise<void> {
  console.log('Sending Ipc message to main process:', dataType, data)
  mainWindow?.webContents.send(dataType, data)
}

ipcMain.handle('select-zip-file', async () => {
  if (mainWindow === null) {
    return null
  }
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'ZIP Files', extensions: ['zip'] }]
  })
  if (result.canceled) {
    return null
  } else {
    const filePath = result.filePaths[0]
    const fileName = path.basename(filePath)
    return { path: filePath, name: fileName }
  }
})

export { sendIpcMessage, openAuthWindow, sendIpcData }
