console.log('[ClientExpress Service] Starting')
import loggingStore from '../../stores/loggingStore'
import { MESSAGE_TYPES } from '@shared/types'
import { app, app as electronApp } from 'electron'
import { join } from 'path'
import { getAppFilePath } from '../apps'
import cors from 'cors'
import express, { Request, NextFunction, Response } from 'express'
import * as fs from 'fs'

const isDevelopment = process.env.NODE_ENV === 'development'
const staticPath = isDevelopment
  ? join(__dirname, '..', '..', 'resources', 'static')
  : join(process.resourcesPath, 'static')

export const setupExpressServer = async (expressApp: express.Application): Promise<void> => {
  expressApp.use(cors())

  const handleClientConnection = async (
    appName: string,
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const userDataPath = electronApp.getPath('userData')
    const webAppDir = join(userDataPath, 'webapp')
    loggingStore.log(MESSAGE_TYPES.LOGGING, `WEBSOCKET: Serving ${appName} from ${webAppDir}`)

    const clientIp = req.hostname

    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `WEBSOCKET: Serving ${appName} from ${webAppDir} to ${clientIp}`
    )
    try {
      if (req.path.endsWith('manifest.js')) {
        const manifestPath = join(webAppDir, 'manifest.js')
        if (fs.existsSync(manifestPath)) {
          let manifestContent = fs.readFileSync(manifestPath, 'utf8')

          manifestContent = manifestContent.replace(
            /"ip":\s*".*?"/,
            `"ip": "${clientIp === '127.0.0.1' ? 'localhost' : clientIp}"`
          )
          console.log('Sending Manifest:', manifestContent)
          res.type('application/javascript').send(manifestContent)
        } else {
          console.error('WEBSOCKET: Manifest not found')
          res.status(404).send('Manifest not found')
        }
      } else {
        if (fs.existsSync(webAppDir)) {
          const indexPath = join(webAppDir)
          console.log('Sending Manifest:', indexPath)
          express.static(indexPath)(req, res, next)
        } else {
          console.error('WEBSOCKET: Manifest not found', webAppDir, req.path)
          res.status(404).send('App not found')
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('WEBSOCKET: Error serving app:', error.message)
      } else {
        console.error('WEBSOCKET: Error serving app:', error)
      }
    }
  }

  expressApp.use(['/', '/client/'], async (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/icon') || req.path.startsWith('/app')) {
      next()
      return
    }
    console.log('WEBSOCKET: Serving client', req.path)
    handleClientConnection('client', req, res, next)
  })

  expressApp.use('/:root', async (req: Request, res: Response, next: NextFunction) => {
    const root = req.params.root

    if (
      root != 'client' &&
      root != 'fetch' &&
      root != 'icons' &&
      root != 'image' &&
      root != 'app'
    ) {
      loggingStore.log(
        MESSAGE_TYPES.WARNING,
        `WEBSOCKET: Client is not updated! Please update to v0.9.1 or later ${root}`
      )
      const ErrorPage = fs.readFileSync(join(staticPath, 'Error.html'), 'utf-8')

      res.send(ErrorPage)
    } else {
      next()
    }
  })

  // Serve web apps dynamically based on the URL
  expressApp.use('/app/:appName', async (req: Request, res: Response, next: NextFunction) => {
    console.log('Got an app request', req.path)
    const appName = req.params.appName

    if (appName === 'client' || appName == null) {
      handleClientConnection(appName, req, res, next)
    } else {
      const appPath = getAppFilePath(appName)
      loggingStore.log(MESSAGE_TYPES.LOGGING, `WEBSOCKET: Serving ${appName} from ${appPath}`)

      if (fs.existsSync(appPath)) {
        express.static(appPath)(req, res, next)
      } else {
        loggingStore.log(
          MESSAGE_TYPES.WARNING,
          `WEBSOCKET: Client is not updated! Please update to v0.9.1 or later`
        )
        const ErrorPage = fs.readFileSync(join(staticPath, 'Error.html'), 'utf-8')

        res.status(404).send(ErrorPage)
      }
    }
  })

  const baseAppPath = join(app.getPath('userData'), 'apps')

  // Serve icons dynamically based on the URL
  expressApp.use(
    '/icons',
    express.static(baseAppPath, {
      maxAge: '1d',
      immutable: true,
      etag: true,
      lastModified: true
    })
  )

  // Serve icons dynamically based on the URL
  expressApp.use(
    '/image/:appName/:imageName',
    async (req: Request, res: Response, next: NextFunction) => {
      const imageName = req.params.imageName
      const appName = req.params.appName
      if (imageName != null) {
        const appPath = getAppFilePath(appName)
        loggingStore.log(MESSAGE_TYPES.LOGGING, `WEBSOCKET: Serving ${appName} from ${appPath}`)

        if (fs.existsSync(join(appPath, imageName))) {
          console.log('Serving image:', join(appPath, 'images', imageName))
          express.static(join(appPath, 'images', imageName))(req, res, next)
        } else {
          console.log('image not found:', imageName)
          res.status(404).send('Icon not found')
        }
      }
    }
  )

  // Proxy external resources
  expressApp.use('/fetch/:url(*)', async (req: Request, res: Response) => {
    try {
      const url = decodeURIComponent(req.params.url)
      loggingStore.log(MESSAGE_TYPES.LOGGING, `WEBSOCKET: Fetching external resource from ${url}`)

      const response = await fetch(url)
      const contentType = response.headers.get('content-type')

      if (contentType) {
        res.setHeader('Content-Type', contentType)
      }
      if (response.body) {
        const reader = response.body.getReader()
        let flag = true
        while (flag) {
          const { done, value } = await reader.read()
          if (done) {
            flag = false
            break
          }
          res.write(value)
        }
        res.end()
      }
    } catch (error) {
      if (error instanceof Error) {
        loggingStore.log(
          MESSAGE_TYPES.LOGGING,
          `WEBSOCKET: Error fetching external resource: ${error.message}`
        )
      }
      res.status(500).send('Error fetching resource')
    }
  })
}
