/**
 * System tray implementation
 */
import { Tray, Menu, app, nativeImage, NativeImage } from 'electron'
import { join } from 'node:path'
import { getMainWindow, getClientWindow, buildMainWindow } from '../windows/windowManager'
import {
  initDockVisibility,
  isDockVisible,
  onDockVisibilityChange,
  toggleDockVisible
} from './dockVisibility'

// Global tray reference to prevent garbage collection
let tray: Tray | null = null

/**
 * Initializes the system tray icon and menu
 */
export async function setupTray(): Promise<void> {
  // Creating a second Tray would put a second icon in the menubar, so setup
  // runs once and later changes go through refreshTrayMenu().
  if (tray) {
    refreshTrayMenu()
    return
  }

  let trayIcon: NativeImage

  if (process.platform === 'darwin') {
    trayIcon = nativeImage.createFromPath(join(__dirname, '../../resources/iconTrayMacSm.png'))
    // The macOS asset is a template image: black plus alpha, which the system
    // recolours for the current menubar. Without this flag it is drawn as
    // literal black and disappears against a dark menubar.
    trayIcon.setTemplateImage(true)
  } else {
    trayIcon = nativeImage.createFromPath(join(__dirname, '../../resources/iconTray.png'))
  }

  tray = new Tray(trayIcon)

  if (process.platform === 'darwin') {
    initDockVisibility(app.dock, app.dock.isVisible())
    onDockVisibilityChange(() => refreshTrayMenu())
  }

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

  tray.setToolTip('DeskThing Server')
  refreshTrayMenu()
}

/** Builds the menu fresh, so every label reflects current state. */
function buildContextMenu(): Menu {
  return Menu.buildFromTemplate([
    {
      label: `DeskThing v${app.getVersion()}`,
      enabled: false
    },
    {
      type: 'separator'
    },
    {
      label: 'Open DeskThing',
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
            // Say what the click will do, not what the thing is called. The
            // label is built from the requested state, which updates
            // synchronously, so it is correct the instant it is clicked.
            label: isDockVisible() ? 'Hide Dock Icon' : 'Show Dock Icon',
            click: (): void => {
              void toggleDockVisible()
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

}

/** Rebuilds the menu so every label reflects the current state. */
function refreshTrayMenu(): void {
  if (!tray) return
  tray.setContextMenu(buildContextMenu())
}

/**
 * Get the tray instance
 */
export function getTray(): Tray | null {
  return tray
}
