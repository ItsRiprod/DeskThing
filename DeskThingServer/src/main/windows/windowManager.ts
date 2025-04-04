/**
 * Central window management system
 */
import { BrowserWindow } from 'electron'
import { createMainWindow } from './mainWindow'
import { createClientWindow } from './clientWindow'
import { createLoadingWindow } from './loadingWindow'
import { uiEventBus } from '../services/events/uiBus'
import logger from '@server/utils/logger'

// Global window references
let mainWindow: BrowserWindow | null = null
let clientWindow: BrowserWindow | null = null
let loadingWindow: BrowserWindow | null = null

/**
 * Get or create the main application window
 */
export function getMainWindow(): BrowserWindow {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
    return mainWindow
  } else {
    logger.debug('Creating main window')
    mainWindow = createMainWindow()
    uiEventBus.setMainWindow(mainWindow)
    return mainWindow
  }
}

/**
 * Get or create the client window
 */
export async function getClientWindow(port: number): Promise<BrowserWindow> {
  if (clientWindow && !clientWindow.isDestroyed()) {
    clientWindow.focus()
    return clientWindow
  } else {
    clientWindow = createClientWindow(port)
    return clientWindow
  }
}

/**
 * Create a loading window
 */
export async function getLoadingWindow(): Promise<BrowserWindow> {
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
    loadingWindow.close()
    loadingWindow = null
  }
}

/**
 * Clean up all windows
 */
export function cleanupWindows(): void {
  if (mainWindow) mainWindow = null
  if (clientWindow) clientWindow = null
  if (loadingWindow) loadingWindow = null
}

export { mainWindow, clientWindow, loadingWindow }
