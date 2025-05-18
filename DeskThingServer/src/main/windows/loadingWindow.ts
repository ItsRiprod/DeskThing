/**
 * Loading window implementation
 */
import { BrowserWindow } from 'electron'
import { join } from 'node:path'
import icon from '../../../resources/icon.png?asset'
import { getLoadingWindow } from './windowManager'

/**
 * Creates a minimal loading window
 */
export async function createLoadingWindow(): Promise<BrowserWindow> {
  const window = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    icon: icon,
    show: true,
    webPreferences: {
      preload: join(__dirname, '../preload/loading.mjs'),
      sandbox: false
    }
  })

  // Load loading screen content
  if (process.env.ELECTRON_RENDERER_URL) {
    window.loadURL(`${process.env.ELECTRON_RENDERER_URL}/loading.html`)
  } else {
    window.loadFile(join(__dirname, '../renderer/loading.html'))
  }

  return window
}

/**
 * Shows the loading window and returns it
 */
export function showLoadingWindow(): Promise<BrowserWindow> {
  return getLoadingWindow()
}

/**
 * Updates the loading window with a progress message
 * 
 * @param message The message to display
 * @param error The error to display in the console (optional)
 */
export async function updateLoadingStatus(message: string, error?: unknown): Promise<void> {
  console.log('[preload]: ', message, error)

  const { loadingWindow } = await import('./windowManager')
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    loadingWindow.webContents.send('loading-status', message)
  } else {
    console.error('[preload]: No loading window found')
  }
}
