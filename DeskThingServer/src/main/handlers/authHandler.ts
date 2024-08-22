import { getAppData } from './configHandler' // Assuming you have a config handler for active apps
import { sendMessageToApp } from './appHandler' // Assuming you have an app handler for sending messages
import http from 'http'
import url from 'url'
import settingsStore, { Settings } from '../stores/settingsStore'
import dataListener, { MESSAGE_TYPES } from '../utils/events'

const successView = '<h1>Success</h1><p>You can now close this window.</p>'

let server: http.Server | null = null
let callBackPort: number

function handleCallback(req: http.IncomingMessage, res: http.ServerResponse): void {
  const parsedUrl = url.parse(req.url || '', true)
  const urlParts = parsedUrl.pathname?.split('/').filter(Boolean)

  if (!urlParts || urlParts.length < 2) {
    res.writeHead(400, { 'Content-Type': 'text/plain' })
    res.end('Invalid callback URL')
    return
  }

  const appName = urlParts[1] // The app name should be the third part after '/callback/'
  const config = getAppData() // Assuming getConfig() returns an object with active apps
  console.log('AUTH DATA: ', config)
  if (!config.apps || !config.apps.some((app) => app.name === appName && app.enabled)) {
    res.writeHead(404, { 'Content-Type': 'text/html' })
    res.end(`<h1>App Not Found</h1><p>App '${appName}' not found or not active.</p>`)
    return
  }

  const code = parsedUrl.query.code as string
  console.log('AUTH CODE: ', code)
  sendMessageToApp(appName, { type: 'callback-data', payload: code })

  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(successView)
}

const startServer = async (): Promise<void> => {
  if (server) {
    await server.close(() => {
      console.log('CALLBACK: Previous server closed.')
    })
  }

  console.log('CALLBACK: Starting server...')
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

  console.log('CALLBACK: Listening...')
  server.listen(callBackPort, () => {
    dataListener.asyncEmit(
      MESSAGE_TYPES.MESSAGE,
      `CALLBACK: running at http://localhost:${callBackPort}/`
    )
  })
}

const initializeServer = async (): Promise<void> => {
  try {
    const settings = (await settingsStore.getSettings()).payload as Settings
    callBackPort = settings.callbackPort
    await startServer()
  } catch (error) {
    console.error('CALLBACK: Failed to get settings or start the server:', error)
  }
}

dataListener.on(MESSAGE_TYPES.SETTINGS, (newSettings) => {
  if (newSettings.payload.callbackPort != callBackPort) {
    callBackPort = newSettings.payload.callbackPort
    startServer()
  } else {
    dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, 'CALLBACK: Not starting - port is not changed')
  }
})

initializeServer()
