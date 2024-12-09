console.log('[Auth Handler] Starting')
import { getAppData } from './configHandler' // Assuming you have a config handler for active apps
import { sendMessageToApp } from '../services/apps' // Assuming you have an app handler for sending messages
import http from 'http'
import url from 'url'
import settingsStore from '../stores/settingsStore'
import loggingStore from '../stores/loggingStore'
import { Settings, MESSAGE_TYPES } from '@shared/types'

const successView = '<h1>Success</h1><p>You can now close this window.</p>'

let server: http.Server | null = null
let callBackPort: number

function handleCallback(req: http.IncomingMessage, res: http.ServerResponse): void {
  const parsedUrl = url.parse(req.url || '', true)

  loggingStore.log(
    MESSAGE_TYPES.LOGGING,
    `AUTH: Received callback request for ${parsedUrl.pathname}`
  )

  const urlParts = parsedUrl.pathname?.split('/').filter(Boolean)

  if (!urlParts || urlParts.length < 2) {
    res.writeHead(400, { 'Content-Type': 'text/plain' })
    res.end('Invalid callback URL')
    return
  }

  const appName = urlParts[1] // The app name should be the third part after '/callback/'
  const config = getAppData() // Assuming getConfig() returns an object with active apps
  if (!config.apps || !config.apps.some((app) => app.name === appName && app.enabled)) {
    res.writeHead(404, { 'Content-Type': 'text/html' })
    res.end(`<h1>App Not Found</h1><p>App '${appName}' not found or not active.</p>`)
    return
  }

  const code = parsedUrl.query.code as string
  sendMessageToApp(appName, { type: 'callback-data', payload: code })

  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(successView)
}

const startServer = async (): Promise<void> => {
  if (server) {
    await server.close(() => {
      loggingStore.log(MESSAGE_TYPES.LOGGING, 'CALLBACK: Shutting down the server...')
    })
  }

  server = http.createServer((req, res) => {
    const parsedUrl = new URL(`http://${req.headers.host}${req.url}`)
    const pathname = parsedUrl.pathname
    if (pathname.startsWith('/callback/')) {
      handleCallback(req, res)
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html' })
      res.end('<h1>Not Found</h1><p>The requested URL was not found on this server.</p>')
    }
  })

  server.listen(callBackPort, () => {
    loggingStore.log(
      MESSAGE_TYPES.MESSAGE,
      `CALLBACK: running at http://localhost:${callBackPort}/`
    )
  })
}

const initializeServer = async (): Promise<void> => {
  try {
    const settings = (await settingsStore.getSettings()) as Settings
    callBackPort = settings.callbackPort
    await startServer()
  } catch (error) {
    console.error('CALLBACK: Failed to get settings or start the server:', error)
  }
}

settingsStore.addListener((newSettings) => {
  try {
    if (newSettings.callbackPort != callBackPort) {
      callBackPort = newSettings.callbackPort
      startServer()
    } else {
      loggingStore.log(MESSAGE_TYPES.LOGGING, 'CALLBACK: Not starting - port is not changed')
    }
  } catch (error) {
    if (error instanceof Error) {
      loggingStore.log(MESSAGE_TYPES.ERROR, 'CALLBACK: Error updating with settings' + error)
    }
  }
})

initializeServer()
