/**
 * Single instance lock handler
 */
import { app } from 'electron'
import { getMainWindow, buildMainWindow } from '../windows/windowManager'
import { handleUrl } from './protocol'

/**
 * Sets up single instance lock and handlers
 * @returns {boolean} True if this is the first instance, false otherwise
 */
export function setupSingleInstance(): boolean {
  const gotTheLock = app.requestSingleInstanceLock()

  if (!gotTheLock) {
    return false
  }

  // Handle second instance launch
  app.on('second-instance', (_event, commandLine) => {
    const url = commandLine.find((arg) => arg.startsWith('deskthing://'))
    if (url) {
      handleUrl(url)
    }

    // Focus the main window if it exists
    const mainWindow = getMainWindow()
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    } else {
      buildMainWindow()
    }
  })

  return true
}
