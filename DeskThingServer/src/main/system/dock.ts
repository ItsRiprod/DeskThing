/**
 * Dock menu implementation (macOS only)
 */
import { app, BrowserWindow, Menu } from 'electron'
import { getMainWindow, getClientWindow, buildMainWindow } from '../windows/windowManager'

/**
 * Initializes the dock menu (macOS only)
 */
export async function setupDock(): Promise<void> {
  if (process.platform !== 'darwin') return

  // Create dock context menu
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
    {
      label: 'Hide Tray Icon',
      click: (): void => {
        app.dock.hide()
      }
    },
    {
      label: 'Force Quit',
      click: (): void => {
        console.log('Quitting')
        BrowserWindow.getAllWindows().forEach((window) => window.destroy())
        app.quit()
      }
    }
  ])

  app.dock.setMenu(contextMenu)
}
