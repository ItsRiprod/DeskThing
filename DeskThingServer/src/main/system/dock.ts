/**
 * Dock menu implementation (macOS only)
 */
import { app, Menu } from 'electron'
import { getMainWindow, getClientWindow } from '../windows/windowManager'

/**
 * Initializes the dock menu (macOS only)
 */
export async function setupDock(): Promise<void> {
  if (process.platform !== 'darwin') return

  // Create dock context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Server',
      click: (): void => {
        getMainWindow()
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
      click: (): void => {
        app.quit()
      }
    }
  ])

  app.dock.setMenu(contextMenu)
}
