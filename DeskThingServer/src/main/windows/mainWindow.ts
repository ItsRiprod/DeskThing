/**
 * Main application window implementation
 */
import { BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import icon from '../../../resources/icon.png?asset'
import { handleUrl } from '../system/protocol'

/**
 * Creates and configures the main application window
 * @returns {BrowserWindow} The configured main window instance
 */
export function createMainWindow(): BrowserWindow {
  // Create window with specific dimensions and settings
  const window = new BrowserWindow({
    width: 1130,
    height: 730,
    minWidth: 500,
    minHeight: 400,
    icon: icon,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon: icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  // Set up Content Security Policy
  window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.github.com;"
        ]
      }
    })
  })

  // Clean up reference when window is closed
  window.on('closed', async () => {
    const { mainWindow } = await import('./windowManager')
    if (mainWindow === window) {
      ;(await import('./windowManager')).mainWindow = null
    }
  })

  // Handle new window creation attempts
  window.webContents.setWindowOpenHandler((details) => {
    // Handle internal protocol links
    if (details.url.startsWith('deskthing://')) {
      handleUrl(details.url)
      return { action: 'deny' }
    } else {
      // Open external links in default browser
      shell.openExternal(details.url)
      return { action: 'deny' }
    }
  })

  // Load appropriate content based on environment
  if (process.env.ELECTRON_RENDERER_URL) {
    window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    window.loadFile(join(__dirname, '../../renderer/index.html'))
  }

  return window
}
