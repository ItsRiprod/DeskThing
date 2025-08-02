/**
 * Main application window implementation
 */
import { BrowserWindow, shell, Menu, MenuItem } from 'electron'
import { join } from 'node:path'
import icon from '../../../resources/icon.png?asset'
import { handleUrl } from '../system/protocol'
import { getMainWindow } from './windowManager'

// Add context menu support
const setupContextMenu = (window: BrowserWindow): void => {
  window.webContents.on('context-menu', (_event, params) => {
    const menu = new Menu()

    // Add each spelling suggestion
    for (const suggestion of params.dictionarySuggestions) {
      menu.append(
        new MenuItem({
          label: suggestion,
          click: () => window.webContents.replaceMisspelling(suggestion)
        })
      )
    }

    // Allow users to add the misspelled word to the dictionary
    if (params.misspelledWord) {
      menu.append(
        new MenuItem({
          label: 'Add to dictionary',
          click: () =>
            window.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
        })
      )
    }

    // Standard editing commands
    if (params.isEditable) {
      if (menu.items.length > 0) {
        menu.append(new MenuItem({ type: 'separator' }))
      }

      menu.append(
        new MenuItem({
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          enabled: params.editFlags.canCut,
          click: () => window.webContents.cut()
        })
      )

      menu.append(
        new MenuItem({
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          enabled: params.editFlags.canCopy,
          click: () => window.webContents.copy()
        })
      )

      menu.append(
        new MenuItem({
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          enabled: params.editFlags.canPaste,
          click: () => window.webContents.paste()
        })
      )

      menu.append(
        new MenuItem({
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          enabled: params.editFlags.canSelectAll,
          click: () => window.webContents.selectAll()
        })
      )
    }

    // Show the menu
    if (menu.items.length > 0) {
      menu.popup({ window })
    }
  })
}

/**
 * Creates and configures the main application window
 * @returns {BrowserWindow} The configured main window instance
 */
export function createMainWindow(): BrowserWindow {
  // Create window with specific dimensions and settings
  console.log('Creating a main window')
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
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: deskthing: http://localhost:* https://thingify.tools https://*.thingify.tools https://avatars.githubusercontent.com; connect-src 'self' https://api.github.com https://thingify.tools;"
        ]
      }
    })
  })

  window.on('ready-to-show', () => {
    window.focus()
    window.show()
  })

  // Clean up reference when window is closed
  window.on('closed', async () => {
    const mainWindow = getMainWindow()
    if (mainWindow === window) {
      mainWindow.destroy()
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
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  setupContextMenu(window)

  return window
}
