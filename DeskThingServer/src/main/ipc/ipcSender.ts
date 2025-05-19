/**
 * IPC sending utilities
 */
import { BrowserWindow } from 'electron'
import { ServerIPCData } from '@shared/types'
import { getLoadingWindow, getMainWindow } from '../windows/windowManager'

/**
 * Sends IPC data to renderer processes
 * @deprecated - use uiBus instead
 */
export async function sendIpcData({ type, payload, window }: ServerIPCData): Promise<void> {
  const mainWindow = getMainWindow()
  if (window && window instanceof BrowserWindow) {
    window.webContents.send(type, payload)
  } else {
    mainWindow?.webContents.send(type, payload)
  }
}

/**
 * Sends a message to the loading window
 */
export async function sendLoadingMessage(message: string): Promise<void> {
  const loadingWindow = await getLoadingWindow()
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    loadingWindow.webContents.send('loading-status', message)
  }
}
