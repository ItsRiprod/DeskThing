import { parentPort, workerData } from 'node:worker_threads'
import express, { NextFunction, Request, Response } from 'express'
import cors from 'cors'
import { Server } from 'node:http'
import { join } from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'

// Receive configuration from main thread
const { userDataPath, port, isDevelopment, staticPath } = workerData

// Store for caching data from main thread
const pendingRequests = new Map()

// Create Express app
const app = express()
let server: Server | null = null

function initializeServer(): void {
  // Configure middleware
  app.use(cors())
  app.use(express.json())

  // Standard API routes
  setupClientRoutes()
  setupAppRoutes()
  setupResourceRoutes()
  setupProxyRoutes()

  // Error handling middleware
  app.use((err: Error, _req: Request, res: Response) => {
    console.error('Express error:', err)
    parentPort?.postMessage({
      type: 'error',
      error: err.message
    })
    res.status(500).send('Server error')
  })

  // Start server
  server = app.listen(port, () => {
    parentPort?.postMessage({
      type: 'server_started',
      port
    })
  })
}

// Client web app and manifest handling
function setupClientRoutes(): void {
  app.get('/client/*', async (req, res, next) => {
    const webAppDir = join(userDataPath, 'webapp')
    const clientIp = req.hostname

    try {
      // Handle manifest file specifically
      if (req.path.endsWith('manifest.js')) {
        const manifestPath = join(webAppDir, 'manifest.js')
        if (fs.existsSync(manifestPath)) {
          let manifestContent = fs.readFileSync(manifestPath, 'utf8')

          // Update IP in manifest
          manifestContent = manifestContent.replace(
            /"ip":\s*".*?"/,
            `"ip": "${clientIp === '127.0.0.1' ? 'localhost' : clientIp}"`
          )

          parentPort?.postMessage({
            type: 'client_connected',
            clientId: crypto.randomUUID(),
            clientInfo: { ip: clientIp }
          })

          return res.type('application/javascript').send(manifestContent)
        }
        return res.status(404).send('Manifest not found')
      }

      // Serve static files from webapp directory
      if (fs.existsSync(webAppDir)) {
        return express.static(webAppDir)(req, res, next)
      } else {
        return res.status(404).send('App not found')
      }
    } catch (error) {
      parentPort?.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : String(error)
      })
      return res.status(500).send('Server error')
    }
  })
}

// App-related endpoints
function setupAppRoutes(): void {
  // Get app by name - served from filesystem
  app.get('/app/:appName/*', async (req: Request, res: Response, next: NextFunction) => {
    const appName = req.params.appName
    const appPath = join(userDataPath, 'apps', appName, 'client')
    const legacyAppPath = join(userDataPath, 'apps', appName)

    if (fs.existsSync(appPath)) {
      return express.static(appPath)(req, res, next)
    } else if (fs.existsSync(legacyAppPath)) {
      return express.static(legacyAppPath)(req, res, next)
    } else {
      return res.status(404).json({
        error: 'App content not found',
        message: 'The app exists but its content could not be located'
      })
    }
  })
}

// Resource endpoints
function setupResourceRoutes(): void {
  const baseAppPath = join(userDataPath, 'apps')

  // Serve icons
  // localhost:8891/resource/icons/spotify/icons/iconName.png
  app.use(
    '/resource/icons',
    express.static(baseAppPath, {
      maxAge: '1d',
      immutable: true,
      etag: true,
      lastModified: true
    })
  )

  // Serve app-specific images
  app.get('/resource/image/:appName/:imageName', async (req: Request, res: Response) => {
    const { appName, imageName } = req.params

    if (!imageName) {
      res.status(400).send('Image name is required')
      return
    }

    const imagePath = join(baseAppPath, appName, 'images', imageName)

    if (fs.existsSync(imagePath)) {
      res.sendFile(imagePath)
    } else {
      res.status(404).send('Image not found')
    }
  })

  // Server-generated content
  app.get('/gen/:appName/*', (req, res, next) => {
    const appName = req.params.appName

    const appPath = join(baseAppPath, appName, 'server')
    const legacyAppPath = join(baseAppPath, appName)

    if (fs.existsSync(appPath)) {
      return express.static(appPath)(req, res, next)
    } else if (fs.existsSync(legacyAppPath)) {
      return express.static(legacyAppPath)(req, res, next)
    } else {
      return res.status(404).json({
        error: 'Server content not found',
        message: 'Ensure client is on version v0.10.0 or later'
      })
    }
  })
}

// External resource proxy
function setupProxyRoutes(): void {
  app.get('/proxy/fetch/:url(*)', async (req, res) => {
    try {
      const url = decodeURIComponent(req.params.url)

      const response = await fetch(url)
      const contentType = response.headers.get('content-type')

      if (contentType) {
        res.setHeader('Content-Type', contentType)
      }

      if (response.body) {
        const reader = response.body.getReader()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          res.write(value)
        }

        res.end()
      } else {
        res.status(204).end()
      }
    } catch (error) {
      parentPort?.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : String(error)
      })
      res.status(500).send('Error fetching resource')
    }
  })
}

// Handle messages from main thread
parentPort?.on('message', (message) => {
  switch (message.type) {
    case 'shutdown':
      // Graceful shutdown
      if (server) {
        server.close(() => {
          parentPort?.postMessage({ type: 'shutdown_complete' })
        })
      } else {
        parentPort?.postMessage({ type: 'shutdown_complete' })
      }
      break

    case 'api_response':
      {
        // Handle response from main thread for a pending request
        const pendingRequest = pendingRequests.get(message.requestId)
        if (pendingRequest) {
          clearTimeout(pendingRequest.timeoutId)
          pendingRequests.delete(message.requestId)
          pendingRequest.resolve(message.data)
        }
      }
      break
  }
})

initializeServer()
