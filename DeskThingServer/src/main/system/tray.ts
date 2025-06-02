/**
 * System tray implementation
 */
import { Tray, Menu, app, nativeImage, NativeImage } from 'electron'
import { join } from 'node:path'
import { getMainWindow, getClientWindow, buildMainWindow } from '../windows/windowManager'

// Global tray reference to prevent garbage collection
let tray: Tray | null = null

/**
 * Initializes the system tray icon and menu
 */
export async function setupTray(): Promise<void> {
  let trayIcon: NativeImage

  if (process.platform === 'darwin') {
    trayIcon = nativeImage.createFromPath(join(__dirname, '../../resources/iconTrayMacSm.png'))
  } else {
    trayIcon = nativeImage.createFromPath(join(__dirname, '../../resources/iconTray.png'))
  }

  tray = new Tray(trayIcon)

  // Handle tray icon click
  tray.on('click', () => {
    const mainWindow = getMainWindow()

    // Ensure the window is visible and focused
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      if (!mainWindow.isVisible()) {
        mainWindow.show()
      }
      mainWindow.focus()
    } else {
      buildMainWindow()
    }
  })

  // Create tray context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: `DeskThing v${app.getVersion()}`,
      enabled: false
    },
    {
      type: 'separator'
    },
    {
      label: 'Open Desktop',
      click: (): void => {
        const mainWindow = getMainWindow()

        // Ensure the window is visible and focused
        if (mainWindow) {
          if (mainWindow.isMinimized()) {
            mainWindow.restore()
          }
          if (!mainWindow.isVisible()) {
            mainWindow.show()
          }
          mainWindow.focus()
        } else {
          buildMainWindow()
        }
      }
    },
    {
      label: 'Open DeskThing Client',
      click: async (): Promise<void> => {
        const { storeProvider } = await import('../stores/storeProvider')
        const settingsStore = await storeProvider.getStore('settingsStore')
        const data = await settingsStore.getSetting('device_devicePort')
        if (data) {
          getClientWindow(data)
        }
      }
    },
    ...(process.platform === 'darwin'
      ? [
          {
            label: 'Toggle Dock Icon',
            click: (): void => {
              app.dock.isVisible() ? app.dock.hide() : app.dock.show()
            },
            id: 'show-hide-icon'
          }
        ]
      : []),
    {
      label: 'Quit Application',
      click: async (): Promise<void> => {
        app.quit()
        if (process.platform == 'darwin') {
          // force quit on mac for some reason
          app.exit()
        }
      }
    }
  ])

  tray.setToolTip('DeskThing Server')
  tray.setContextMenu(contextMenu)
}

/**
 * Get the tray instance
 */
export function getTray(): Tray | null {
  return tray
}
