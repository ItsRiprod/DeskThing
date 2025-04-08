/**
 * Client window implementation
 */
import { BrowserWindow } from 'electron'
import icon from '../../../resources/icon.png?asset'

/**
 * Creates a new client window for the application.
 * @param port - The port number to use for the client window.
 * @returns {BrowserWindow} The created client window instance
 */
export function createClientWindow(port: number): BrowserWindow {
  // Create window with specific dimensions and settings for client
  const window = new BrowserWindow({
    width: 800,
    height: 480,
    minWidth: 500,
    minHeight: 140,
    show: false,
    frame: true,
    icon: icon,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#202020',
      symbolColor: '#606060',
      height: 20
    },
    webPreferences: {
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Add custom draggable title bar
  window.webContents.on('did-finish-load', () => {
    window.webContents.executeJavaScript(`
      const topBar = document.createElement('div');
      topBar.style.position = 'absolute';
      topBar.style.top = '0';
      topBar.style.left = '0';
      topBar.style.width = '100%';
      topBar.style.height = '30px';
      topBar.style.backgroundColor = 'rgba(100, 100, 100, 0.1)';
      topBar.style.zIndex = '9999';
      topBar.style.cursor = 'pointer';
      topBar.style.webkitAppRegion = 'drag';
      document.body.appendChild(topBar);
    `)
  })

  // Set up CORS for localhost
  window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Access-Control-Allow-Origin': ['*'],
        'Access-Control-Allow-Methods': ['GET, POST, OPTIONS'],
        'Access-Control-Allow-Headers': ['Content-Type']
      }
    })
  })

  // Show window when ready
  window.on('ready-to-show', () => {
    window.show()
  })

  // Clean up reference when window is closed
  window.on('closed', async () => {
    const { clientWindow } = await import('./windowManager')
    if (clientWindow === window) {
      ;(await import('./windowManager')).clientWindow = null
    }
  })

  // Load client URL
  window.loadURL(`http://localhost:${port}/`, {})
  return window
}
