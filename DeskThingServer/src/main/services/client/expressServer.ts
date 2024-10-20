import dataListener, { MESSAGE_TYPES } from '../../utils/events'
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
    dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, `WEBSOCKET: Serving ${appName} from ${webAppDir}`)

    const clientIp = req.hostname

    console.log(`WEBSOCKET: Serving ${appName} from ${webAppDir} to ${clientIp}`)

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
  }

  expressApp.use('/', (req, res, next) => {
    handleClientConnection('client', req, res, next)
  })

  // Serve web apps dynamically based on the URL
  expressApp.use('/:appName', (req, res, next) => {
    const appName = req.params.appName
    if (appName === 'client' || appName == null) {
      handleClientConnection(appName, req, res, next)
    } else {
      const appPath = getAppFilePath(appName)
      dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, `WEBSOCKET: Serving ${appName} from ${appPath}`)

      if (fs.existsSync(appPath)) {
        express.static(appPath)(req, res, next)
      } else {
        res.status(404).send('App not found')
      }
    }
  })
}
