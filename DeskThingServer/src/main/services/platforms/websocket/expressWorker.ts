import express, { NextFunction, Request, Response } from 'express'
import cors from 'cors'
import { Server } from 'node:http'
import { join } from 'node:path'
import fs from 'node:fs'

export class ExpressServer {
  private app: express.Application
  private server: Server | null = null
  private userDataPath: string
  private port: number

  constructor(expressApp: express.Application, userDataPath: string, port: number) {
    this.app = expressApp
    this.port = port
    this.userDataPath = userDataPath
  }

  public initializeServer(): void {
    this.app.use(cors())
    this.app.use(express.json())
    this.setupAppRoutes()
    this.setupResourceRoutes()
    this.setupProxyRoutes()

    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Express error:', err)
      res.status(500).send('Server error')
    })

    this.server = this.app.listen(this.port)

    this.setupClientRoutes()

    // Default all routes to / as a fallback
    this.app.get('/', (_req, res) => {
      res.redirect('/client/')
    })
  }

  public getServer(): Server | null {
    return this.server
  }

  public getApp(): express.Application {
    return this.app
  }

  private setupClientRoutes(): void {
    const webAppDir = join(this.userDataPath, 'webapp')

    this.app.get('/client/manifest.js', async (req: Request, res: Response) => {
      const manifestPath = join(webAppDir, 'manifest.js')
      const clientIp = req.hostname

      if (fs.existsSync(manifestPath)) {
        let manifestContent = fs.readFileSync(manifestPath, 'utf8')
        manifestContent = manifestContent.replace(
          /"ip":\s*".*?"/,
          `"ip": "${clientIp === '127.0.0.1' ? 'localhost' : clientIp}"`
        )
        res.type('application/javascript').send(manifestContent)
        return
      }
      res.sendStatus(404).send('Manifest not found')
      return
    })

    if (fs.existsSync(webAppDir)) {
      this.app.use(
        '/client',
        express.static(webAppDir, {
          index: 'index.html',
          extensions: ['html', 'htm']
        })
      )
    }

    this.app.get('/client/*', (_req, res) => {
      const indexPath = join(webAppDir, 'index.html')
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath)
      } else {
        res.status(404).send('App not found')
      }
    })

    // this.app.get('/client/', (req, res) => {
    //   const indexPath = join(this.userDataPath, 'webapp', 'index.html')
    //   if (fs.existsSync(indexPath)) {
    //     res.sendFile(indexPath)
    //   } else {
    //     res.status(404).send('Index file not found')
    //   }
    // })
  }

  private setupAppRoutes(): void {
    this.app.use('/app/:appName', (req: Request, res: Response, next: NextFunction) => {
      const appName = req.params.appName
      const appPath = join(this.userDataPath, 'apps', appName, 'client')
      const legacyAppPath = join(this.userDataPath, 'apps', appName)

      if (fs.existsSync(appPath)) {
        express.static(appPath, {
          index: 'index.html',
          extensions: ['html', 'htm']
        })(req, res, next)
      } else if (fs.existsSync(legacyAppPath)) {
        express.static(legacyAppPath, {
          index: 'index.html',
          extensions: ['html', 'htm']
        })(req, res, next)
      } else {
        res.status(404).json({
          error: 'App content not found',
          message: 'The app exists but its content could not be located'
        })
      }
    })

    this.app.get('/app/:appName/*', async (req: Request, res: Response, next: NextFunction) => {
      const appName = req.params.appName
      const appPath = join(this.userDataPath, 'apps', appName, 'client')
      const legacyAppPath = join(this.userDataPath, 'apps', appName)

      if (fs.existsSync(appPath)) {
        console.log('Returning app path')
        return express.static(appPath)(req, res, next)
      } else if (fs.existsSync(legacyAppPath)) {
        console.log('Returning legacy app path')
        return express.static(legacyAppPath)(req, res, next)
      } else {
        return res.status(404).json({
          error: 'App content not found',
          message: 'The app exists but its content could not be located'
        })
      }
    })
  }

  private setupResourceRoutes(): void {
    const baseAppPath = join(this.userDataPath, 'apps')

    // Serve icons dynamically based on the URL
    this.app.use(
      '/icons',
      express.static(baseAppPath, {
        maxAge: '1d',
        immutable: true,
        etag: true,
        lastModified: true
      })
    )

    this.app.use(
      '/resource/icons',
      express.static(baseAppPath, {
        maxAge: '1d',
        immutable: true,
        etag: true,
        lastModified: true
      })
    )

    this.app.get('/resource/image/:appName/:imageName', async (req: Request, res: Response) => {
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

    this.app.get('/gen/:appName/*', (req, res) => {
      const appName = req.params.appName
      const filePath = req.params[0]

      const appPath = join(baseAppPath, appName, 'server')
      const fullPath = join(appPath, filePath)

      if (fs.existsSync(appPath)) {
        console.log('Returning file path', fullPath, req.url)
        res.sendFile(fullPath, {
          maxAge: '1d',
          immutable: true,
          etag: true,
          lastModified: true
        })
      } else {
        res.status(404).json({
          error: 'Server content not found',
          message: 'Ensure client is on version v0.10.0 or later'
        })
        return
      }
    })
  }

  private setupProxyRoutes(): void {
    this.app.get('/proxy/fetch/:url(*)', async (req: Request, res: Response) => {
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
          res.sendStatus(204)
        }
      } catch (error) {
        console.log('Error fetching resource', error)
        res.status(500).send('Error fetching resource')
      }
    })
  }

  public shutdown(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve())
      } else {
        resolve()
      }
    })
  }
}
