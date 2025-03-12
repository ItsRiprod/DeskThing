import { AuthStoreClass, authStoreEventTypes } from '@shared/stores/authStore'
import { EventEmitter } from 'node:events'
import { Server, createServer, IncomingMessage, ServerResponse } from 'http'
import { parse, URL } from 'url'
import { getAppData } from '../services/files/appFileService'
import Logger from '../utils/logger'
import { SettingsStoreClass } from '@shared/stores/settingsStore'

const successView = '<h1>Success</h1><p>You can now close this window.</p>'

export class AuthStore extends EventEmitter<authStoreEventTypes> implements AuthStoreClass {
  private server: Server | null = null
  private callbackPort: number = 8888
  private settingStore: SettingsStoreClass

  constructor(settingStore: SettingsStoreClass) {
    super()
    this.settingStore = settingStore
    this.initializeServer()
    this.initializeListeners()
  }

  private async initializeServer(): Promise<void> {
    try {
      const settings = await this.settingStore.getSettings()
      if (settings && settings.callbackPort) {
        this.setCallbackPort(settings.callbackPort)
      }
    } catch (error) {
      Logger.error('Failed to start the server', {
        error: error as Error,
        source: 'authStore',
        function: 'initializeServer'
      })
    }
  }

  private async initializeListeners(): Promise<void> {
    this.settingStore.addListener((settings) => {
      if (settings?.callbackPort && settings.callbackPort != this.callbackPort) {
        this.setCallbackPort(settings.callbackPort)
      }
    })
  }

  private async startServer(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server?.close(() => {
          Logger.info('Shutting down the server...', {
            source: 'authStore',
            function: 'startServer'
          })
          resolve()
        })
      })
    }

    this.server = createServer((req, res) => {
      const parsedUrl = new URL(`http://${req.headers.host}${req.url}`)
      const pathname = parsedUrl.pathname
      if (pathname.startsWith('/callback/')) {
        this.handleCallback(req, res)
      } else {
        res.writeHead(404, { 'Content-Type': 'text/html' })
        res.end('<h1>Not Found</h1><p>The requested URL was not found on this server.</p>')
      }
    })

    this.server.listen(this.callbackPort, () => {
      Logger.debug(`running at http://localhost:${this.callbackPort}/`, {
        source: 'authStore',
        function: 'startServer'
      })
    })
  }

  private async handleCallback(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const parsedUrl = parse(req.url || '', true)
    Logger.debug(`AUTH: Received callback request for ${parsedUrl.pathname}`)

    const urlParts = parsedUrl.pathname?.split('/').filter(Boolean)

    if (!urlParts || urlParts.length < 2) {
      res.writeHead(400, { 'Content-Type': 'text/plain' })
      res.end('Invalid callback URL')
      return
    }

    const appName = urlParts[1]

    const appData = await getAppData()

    if (!appData || !appData[appName] || !appData[appName].enabled) {
      res.writeHead(404, { 'Content-Type': 'text/html' })
      res.end(`<h1>App Not Found</h1><p>App '${appName}' not found or not active.</p>`)
      return
    }

    const code = parsedUrl.query.code as string
    this.emit('appData', { app: appName, callbackData: code })

    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(successView)
  }

  public handleProtocol = async (protocol: string): Promise<void> => {
    try {
      const parsedUrl = new URL(protocol)
      // First try to get app from query parameter
      let appName = parsedUrl.searchParams.get('app')

      // If not found, fall back to the pathname (original behavior)
      if (!appName) {
        const pathParts = parsedUrl.href.split('/').filter(Boolean)
        if (pathParts.length > 0) {
          appName = pathParts[0]
        }
      }

      Logger.debug(`Received protocol request for ${appName}`, {
        source: 'authStore',
        function: 'handleProtocol'
      })

      const code = parsedUrl.searchParams.get('code')
      if (appName && code) {
        Logger.debug(`Emitting appData to app ${appName}`, {
          source: 'authStore',
          function: 'handleProtocol'
        })
        this.emit('appData', { app: appName, callbackData: code })
      } else {
        Logger.error(`Invalid protocol request: ${protocol}`, {
          source: 'authStore',
          function: 'handleProtocol'
        })
      }
    } catch (error) {
      Logger.error(`Error parsing URL ${protocol}`, {
        error: error as Error,
        source: 'authStore',
        function: 'handleProtocol'
      })
    }
  }

  setCallbackPort(port: number): void {
    this.callbackPort = port
    this.startServer()
  }
}
