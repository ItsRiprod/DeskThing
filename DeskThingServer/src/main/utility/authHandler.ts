import { getAppData } from './configHandler' // Assuming you have a config handler for active apps
import { sendMessageToApp } from './appHandler' // Assuming you have an app handler for sending messages
import http from 'http'
import url from 'url'
const PORT = 8888

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
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end(`App '${appName}' not found or not active.`)
    return
  }

  const code = parsedUrl.query.code as string
  console.log('AUTH CODE: ', code)
  sendMessageToApp(appName, 'callback-data', { code })

  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(`Callback data received and sent to '${appName}'`)
}

const server = http.createServer((req, res) => {
  // Handle only POST requests to /callback/*

  const parsedUrl = new URL(`http://${req.headers.host}${req.url}`)
  const pathname = parsedUrl.pathname
  if (pathname.startsWith('/callback/')) {
    handleCallback(req, res)
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found ' + req.url)
  }
})

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`)
})
