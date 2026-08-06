/**
 * Central window management system
 */
import { app, BrowserWindow } from 'electron'
import { isDockVisible } from '../system/dockVisibility'
import { createMainWindow } from './mainWindow'
import { createClientWindow } from './clientWindow'
import { createLoadingWindow } from './loadingWindow'
import { uiEventBus } from '../services/events/uiBus'

// Global window references
let mainWindow: BrowserWindow | null = null
let clientWindow: BrowserWindow | null = null
let loadingWindow: BrowserWindow | null = null

/**
 * Get or create the main application window
 */
export function getMainWindow(): BrowserWindow | undefined {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
    return mainWindow
  }

  return
}

export function buildMainWindow(): BrowserWindow {
  // Restore the Dock icon on mac — but only if the user has not deliberately
  // hidden it. This used to call app.dock.show() unconditionally, so anything
  // that opened or activated a window (the tray click, 'activate', the
  // single-instance handler) quietly undid 'Hide Dock Icon' moments after it
  // was chosen. The toggle appeared not to work; in fact it worked and was
  // immediately overridden.
  if (process.platform === 'darwin' && isDockVisible()) {
    app.dock.show()
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus()
    return mainWindow
  } else {
    mainWindow = createMainWindow()
    uiEventBus.setMainWindow(mainWindow)
    return mainWindow
  }
}

/**
 * Get or create the client window
 */
export async function getClientWindow(port?: number): Promise<BrowserWindow | undefined> {
  if (clientWindow && !clientWindow.isDestroyed()) {
    clientWindow.focus()
    return clientWindow
  } else if (port) {
    clientWindow = createClientWindow(port)
    return clientWindow
  } else {
    return
  }
}

/**
 * Create a loading window
 */
export async function getLoadingWindow(open = false): Promise<BrowserWindow | undefined> {
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    loadingWindow.focus()
    return loadingWindow
  }
  if (open) {
    return buildLoadingWindow()
  }
  return
}

export const buildLoadingWindow = async (): Promise<BrowserWindow> => {
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    loadingWindow.focus()
    return loadingWindow
  } else {
    loadingWindow = await createLoadingWindow()
    return loadingWindow
  }
}

/**
 * Close the loading window
 */
export function closeLoadingWindow(): void {
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    console.log('Closing the loading window')
    loadingWindow.close()
    loadingWindow.destroy()
    loadingWindow = null
  } else {
    console.log('Unable to close the loading window')
  }
}

/**
 * Clean up all windows
 */
export function cleanupWindows(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close()
    mainWindow.destroy()
    mainWindow = null
  }
  if (clientWindow && !clientWindow.isDestroyed()) {
    clientWindow.close()
    clientWindow.destroy()
    clientWindow = null
  }
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    loadingWindow.close()
    loadingWindow.destroy()
    loadingWindow = null
  }
}