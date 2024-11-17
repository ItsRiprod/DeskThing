import loggingStore from '../../stores/loggingStore'
import { MESSAGE_TYPES } from '@shared/types'
import { app as electronApp } from 'electron'
import { join } from 'path'
import { getAppFilePath } from '../apps'
import cors from 'cors'
import express from 'express'
import * as fs from 'fs'

export const setupExpressServer = async (expressApp: express.Application): Promise<void> => {
  expressApp.use(cors())

  expressApp.use((req, res, next) => {
    if (req.path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml')
    }
    next()
  })

  const handleClientConnection = (
    appName: string,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
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

          res.type('application/javascript').send(manifestContent)
        } else {
          res.status(404).send('Manifest not found')
        }
      } else {
        if (fs.existsSync(webAppDir)) {
          express.static(webAppDir)(req, res, next)
        } else {
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

  expressApp.use(['/', '/client/'], (req, res, next) => {
    handleClientConnection('client', req, res, next)
  })

  // Serve web apps dynamically based on the URL
  expressApp.use(['/app/:appName', '/:appName'], (req, res, next) => {
    const appName = req.params.appName
    if (appName === 'client' || appName == null) {
      handleClientConnection(appName, req, res, next)
    } else {
      const appPath = getAppFilePath(appName)
      loggingStore.log(MESSAGE_TYPES.LOGGING, `WEBSOCKET: Serving ${appName} from ${appPath}`)

      if (fs.existsSync(appPath)) {
        express.static(appPath)(req, res, next)
      } else {
        res.status(404).send('App not found')
      }
    }
  })

  // Serve icons dynamically based on the URL
  expressApp.use('/icon/:appName/:iconName', (req, res, next) => {
    const iconName = req.params.iconName
    const appName = req.params.appName
    if (iconName != null) {
      const appPath = getAppFilePath(appName)
      loggingStore.log(MESSAGE_TYPES.LOGGING, `WEBSOCKET: Serving ${appName} from ${appPath}`)

      if (fs.existsSync(join(appPath, 'icons', iconName))) {
        express.static(join(appPath, 'icons'))(req, res, next)
      } else {
        res.status(404).send('Icon not found')
      }
    }
  })

  // Serve icons dynamically based on the URL
  expressApp.use('/image/:appName/:imageName', (req, res, next) => {
    const imageName = req.params.imageName
    const appName = req.params.appName
    if (imageName != null) {
      const appPath = getAppFilePath(appName)
      loggingStore.log(MESSAGE_TYPES.LOGGING, `WEBSOCKET: Serving ${appName} from ${appPath}`)

      if (fs.existsSync(join(appPath, 'images', imageName))) {
        express.static(join(appPath, 'icons'))(req, res, next)
      } else {
        res.status(404).send('Icon not found')
      }
    }
  })

  // Proxy external resources
  expressApp.use('/fetch/:url(*)', async (req, res) => {
    try {
      const url = decodeURIComponent(req.params.url)
      loggingStore.log(MESSAGE_TYPES.LOGGING, `WEBSOCKET: Fetching external resource from ${url}`)

      const response = await fetch(url)
      const contentType = response.headers.get('content-type')

      if (contentType) {
        res.setHeader('Content-Type', contentType)
      }
      if (response.body) {
        response.body.pipeTo(res)
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
