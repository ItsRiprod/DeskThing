/**
 * Manages application lifecycle events
 */
import { app, BrowserWindow, NativeImage, nativeImage, Notification } from 'electron'
import { setupProtocolHandler } from '../system/protocol'
import { setupTray } from '../system/tray'
import { setupDock } from '../system/dock'
import { setupIpcHandlers } from '../ipc/ipcManager'
import { loadModules } from './moduleLoader'
import { closeLoadingWindow, buildMainWindow } from '../windows/windowManager'
import { nextTick } from 'node:process'
import { updateLoadingStatus } from '@server/windows/loadingWindow'
import { join } from 'node:path'
import { checkFlag } from './lifecycleCheck'

/**
 * Initialize the application lifecycle
 */
export async function initializeAppLifecycle(): Promise<void> {
  // Set up protocol handler
  setupProtocolHandler()

  // Set up platform-specific UI elements
  if (process.platform === 'darwin') {
    setupDock()
  }

  setupTray()

  // Set app ID for Windows
  app.setAppUserModelId('com.deskthing')

  // Optimize window shortcuts
  app.on('browser-window-created', async (_, window) => {
    const { optimizer } = await import('@electron-toolkit/utils')
    optimizer.watchWindowShortcuts(window)
  })

  const startMinimized = await checkFlag('server_startMinimized')
  // Create main window after loading is complete
  if (!startMinimized) {
    await updateLoadingStatus('Creating main window')
    const mainWindow = buildMainWindow()
    mainWindow.once('ready-to-show', async () => {
      await updateLoadingStatus('Finishing Up...')
      closeLoadingWindow()
      mainWindow.show()
    })
  }

  // Load modules and set up IPC handlers
  nextTick(async () => {
    await setupIpcHandlers()
    await loadModules()
    if (startMinimized) {
      await updateLoadingStatus('Start Minimized: TRUE')
      setTimeout(() => {
        closeLoadingWindow() // ensure the loading window is closed
      }, 3000)
    }
  })

  setTimeout(async () => {
    try {
      const { afterStartTasks } = await import('@server/services/initialization/AfterStartupTasks')

      afterStartTasks()
    } catch (error) {
      console.error('Failed to run startup tasks', error)
    }
  }, 10000)

  app.on('before-quit', async () => {
    console.log('Quitting app')
    const { default: cacheManager } = await import('../services/cache/cacheManager')
    await cacheManager.hibernateAll() // hibernate all before closing to ensure all cache is saved
  })

  // Handle window recreation on macOS
  app.on('activate', function () {
    console.log('Handling recreation on MacOS')
    const windows = BrowserWindow.getAllWindows()
    if (windows.length === 0) {
      buildMainWindow()
    } else {
      console.log(
        `Not creating due to ${windows.length} already existing. The window is `,
        windows.map((w) => w.getTitle())
      )
    }
  })

  // Handle window closure
  app.on('window-all-closed', async () => {
    const { storeProvider } = await import('../stores/storeProvider')
    const settingsStore = await storeProvider.getStore('settingsStore')
    const settings = await settingsStore.getSettings()

    if (settings?.flag_firstClose === true) {
      let trayIcon: NativeImage
      if (process.platform === 'darwin') {
        trayIcon = nativeImage.createFromPath(join(__dirname, '../../resources/iconTrayMacSm.png'))
      } else {
        trayIcon = nativeImage.createFromPath(join(__dirname, '../../resources/iconTray.png'))
      }

      new Notification({
        title: 'DeskThing is now in the background!',
        body: 'DeskThing will continue to work.',
        icon: trayIcon
      }).show()
      settingsStore.saveSetting('flag_firstClose', false)
    }

    if (settings?.server_minimizeApp) {
      // Clear cache from everywhere
      const { default: cacheManager } = await import('../services/cache/cacheManager')
      await cacheManager.hibernateAll()
    } else {
      app.quit()
    }
  })
}
