/**
 * System tray implementation
 */
import { Tray, Menu, app, nativeImage } from 'electron'
import { join } from 'node:path'
import { getMainWindow, getClientWindow } from '../windows/windowManager'

// Global tray reference to prevent garbage collection
let tray: Tray | null = null

/**
 * Initializes the system tray icon and menu
 */
export async function setupTray(): Promise<void> {
  const trayIcon = nativeImage.createFromPath(join(__dirname, '../../resources/icon2.png'))

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
    }
  })

  // Create tray context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Server',
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
        }
      }
    },
    {
      label: 'Open Client',
      click: async (): Promise<void> => {
        const { storeProvider } = await import('../stores/storeProvider')
        const settingsStore = await storeProvider.getStore('settingsStore')
        const data = await settingsStore.getSettings()
        if (data) {
          getClientWindow(data.devicePort)
        }
      }
    },
    {
      label: 'Quit',
      click: async (): Promise<void> => {
        app.quit()
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
