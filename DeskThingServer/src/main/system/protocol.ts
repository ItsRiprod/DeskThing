/**
 * Protocol handler for custom deskthing:// URLs
 */
import { app, BrowserWindow } from 'electron'
import { resolve } from 'node:path'
import { getMainWindow, getClientWindow } from '../windows/windowManager'
import { net, protocol } from 'electron/main'
import { getSetting } from '@server/services/initialize/getVersion'

/**
 * Set up the custom protocol handler
 */
export function setupProtocolHandler(): void {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('deskthing', process.execPath, [resolve(process.argv[1])])
    }
  } else {
    app.setAsDefaultProtocolClient('deskthing')
  }

  // Handle protocol URLs
  app.on('open-url', (event, url) => {
    event.preventDefault()
    handleUrl(url)
  })
}

export const setupInternalProtocolHandler = (): void => {
  protocol.handle('deskthing', async (request) => {
    const url = request.url.replace('deskthing://', '')
    // Map deskthing:// URLs to local resources
    // Example: deskthing://resource/task/discord/taskId
    const devicePort = await getSetting('device_devicePort')
    return net.fetch(`http://localhost:${devicePort || '8888'}/` + url)
  })
}

/**
 * Handle custom protocol URLs
 */
export async function handleUrl(
  url: string | undefined,
  window: BrowserWindow | undefined = getMainWindow()
): Promise<void> {
  if (url && url.startsWith('deskthing://')) {
    const path = url.replace('deskthing://', '')

    if (path.startsWith('a?') || path.startsWith('a/?')) {
      const { default: Logger } = await import('../utils/logger')

      Logger.debug('Attempting to handle with authStore', {
        source: 'handleUrl',
        function: 'handleUrl'
      })
      const { storeProvider } = await import('../stores/storeProvider')
      const authStore = await storeProvider.getStore('authStore')
      authStore.handleProtocol(url)

      return
    }
    console.log('Sending path to webContents for handling')

    const clientWindow = await getClientWindow()

    const targetWindow = clientWindow && !clientWindow.isDestroyed() ? clientWindow : window

    if (targetWindow) {
      targetWindow.webContents.send('handle-protocol-url', path)
    } else {
      console.log('No window available to handle URL:', url)
    }
  }
}
