import { Client, Settings, SocketData } from '@shared/types'
import WebSocket, { WebSocketServer } from 'ws'
import { sendMessageToApp, getAppFilePath } from '../services/apps'

import keyMapStore from '../stores/keyMapStore'
import { readData, addData } from './dataHandler'
import dataListener, { MESSAGE_TYPES } from '../utils/events'
import { HandleDeviceData } from './deviceHandler'
import settingsStore from '../stores/settingsStore'
import cors from 'cors'
import crypto, { UUID } from 'crypto'

import * as fs from 'fs'
// App Hosting
import express from 'express'
import { createServer, Server as HttpServer } from 'http'
import { app as electronApp } from 'electron'
import { join } from 'path'
import ConnectionStore from '../stores/connectionsStore'
import AppState from '../services/apps/appState'

let settings: Settings
let httpServer: HttpServer
let server: WebSocketServer | null

const updateServerSettings = (newSettings: Settings): void => {
  if (settings.devicePort !== newSettings.devicePort || settings.address !== newSettings.address) {
    settings = newSettings
    restartServer()
  } else {
    dataListener.asyncEmit(
      MESSAGE_TYPES.LOGGING,
      'WSOCKET: Settings have not changed, not restarting the server'
    )
  }
}

dataListener.on(MESSAGE_TYPES.SETTINGS, (newSettings) => {
  if (settings.payload) {
    updateServerSettings(newSettings.payload)
  } else {
    dataListener.emit(MESSAGE_TYPES.LOGGING, 'WSOCKET: No settings received!')
  }
})

const restartServer = (): void => {
  try {
    if (server) {
      console.log('WSOCKET: Shutting down the WebSocket server...')
      dataListener.emit(MESSAGE_TYPES.LOGGING, 'WSOCKET: Shutting down the WebSocket server...')
      ConnectionStore.removeAllClients()

      server.clients.forEach((client) => {
        client.terminate()
      })

      server.close((err) => {
        if (err) {
          console.error('WSOCKET: Error shutting down WebSocket server:', err)
          dataListener.emit(
            MESSAGE_TYPES.ERROR,
            'WSOCKET: Error shutting down WebSocket server:' + err
          )
        } else {
          console.log('WSOCKET: WebSocket server shut down successfully.')
          dataListener.emit(
            MESSAGE_TYPES.LOGGING,
            'WSOCKET: WebSocket server shut down successfully.'
          )
        }

        if (httpServer && httpServer.listening) {
          console.log('WSOCKET: Stopping HTTP server...')
          httpServer.close((err) => {
            if (err) {
              console.error('WSOCKET: Error stopping HTTP server:', err)
            } else {
              console.log('WSOCKET: HTTP server stopped successfully.')
              setupServer()
            }
          })
        } else {
          setupServer()
        }
      })
    } else {
      console.log('WSOCKET: No WebSocket server running - setting one up')
      if (httpServer && httpServer.listening) {
        console.log('WSOCKET: Stopping HTTP server...')
        httpServer.close((err) => {
          if (err) {
            console.error('WSOCKET: Error stopping HTTP server:', err)
          } else {
            console.log('WSOCKET: HTTP server stopped successfully.')
            setupServer()
          }
        })
      } else {
        setupServer()
      }
    }
  } catch (error) {
    console.error('WSOCKET: Error restarting the WebSocket server:', error)
  }
}

const setupServer = async (): Promise<void> => {
  dataListener.asyncEmit(MESSAGE_TYPES.MESSAGE, 'WSOCKET: Attempting to setup the server')
  if (!settings) {
    // Return if there are no settings
    dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, 'WSOCKET: No settings found, getting them now')
    const socketData = await settingsStore.getSettings()
    settings = socketData.payload as Settings
  }

  const expressApp = express()
  httpServer = createServer(expressApp)

  expressApp.use(cors())

  expressApp.use((req, res, next) => {
    if (req.path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml')
    }
    next()
  })

  // Serve web apps dynamically based on the URL
  expressApp.use('/:appName', (req, res, next) => {
    const appName = req.params.appName
    if (appName === 'client' || appName == null) {
      const userDataPath = electronApp.getPath('userData')
      const webAppDir = join(userDataPath, 'webapp')
      dataListener.asyncEmit(
        MESSAGE_TYPES.LOGGING,
        `WEBSOCKET: Serving ${appName} from ${webAppDir}`
      )

      const clientIp = req.hostname

      const clientPort = req.socket.port

      console.log(`WEBSOCKET: Serving ${appName} from ${webAppDir} to ${clientIp}`)

      if (req.path.endsWith('manifest.js')) {
        const manifestPath = join(webAppDir, 'manifest.js')
        if (fs.existsSync(manifestPath)) {
          let manifestContent = fs.readFileSync(manifestPath, 'utf8')

          const getDeviceType = (userAgent: string | undefined): string => {
            if (!userAgent) return 'unknown'
            userAgent = userAgent.toLowerCase()
            if (userAgent.includes('iphone')) return 'iphone'
            if (userAgent.includes('win')) return 'windows'
            if (userAgent.includes('ipad')) return 'tablet'
            if (userAgent.includes('mac')) return 'mac'
            if (userAgent.includes('android')) {
              if (userAgent.includes('mobile')) return 'android'
              return 'tablet'
            }
            return 'unknown'
          }

          const client: Client = {
            ip: clientIp as string,
            connected: false,
            connectionId: crypto.randomUUID(),
            timestamp: Date.now(),
            userAgent: req.headers['user-agent'] || '',
            hostname: req.hostname || '',
            headers: req.headers,
            device_type: getDeviceType(req.headers['user-agent'])
          }

          ConnectionStore.addClient(client)

          manifestContent = manifestContent.replace(
            /"ip":\s*".*?"/,
            `"ip": "${clientIp === '127.0.0.1' ? 'localhost' : clientIp}"`
          )
          manifestContent = manifestContent.includes('"uuid"')
            ? manifestContent.replace(/"uuid":\s*".*?"/, `"uuid":"${client.connectionId}"`)
            : manifestContent.replace(/{/, `{\n  "uuid": "${client.connectionId}",`)
          manifestContent = manifestContent.replace(
            /"port":\s*".*?"/,
            `"port": "${clientPort || '8891'}"`
          )
          manifestContent = manifestContent.replace(
            /"device_type":\s*".*?"/,
            `"device_type": "${getDeviceType(req.headers['user-agent'])}"`
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
  /*
  expressApp.use('/:appName/icon/', (req, res, next) => {
    const appName = req.params.appName
    const iconPath = join(getAppFilePath(appName), 'icon') // Construct the full file path

    console.log(`WEBSOCKET: Serving ${appName} from ${iconPath}`)

    dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, `WEBSOCKET: Serving ${appName} from ${iconPath}`)

    if (fs.existsSync(iconPath)) {
      express.static(iconPath)(req, res, next) // Serve the SVG file directly
    } else {
      res.status(404).send('File not found')
    }
  })*/

  server = new WebSocketServer({ server: httpServer })

  httpServer.listen(settings.devicePort, settings.address, () => {
    console.log(`CALLBACK: Server listening on ${settings.address}:${settings.devicePort}`)
    dataListener.asyncEmit(
      MESSAGE_TYPES.LOGGING,
      `WEBSOCKET: Server is listening on ${settings.address}:${settings.devicePort}`
    )
  })

  // Handle incoming messages from the client
  server.on('connection', async (socket: WebSocket) => {
    // Handle the incoming connection and add it to the ConnectionStore

    const clientIp = socket._socket.remoteAddress

    const conClient = ConnectionStore.getClients().find((client) => client.ip === clientIp)

    console.log(`WSOCKET: Client connected! Looking for client with IP ${clientIp}`)
    const client: Client = {
      ip: conClient?.ip || (clientIp as string),
      connected: true,
      timestamp: conClient?.timestamp || Date.now(),
      connectionId: conClient?.connectionId || crypto.randomUUID()
    }

    console.log(
      `WSOCKET: Client with id: ${client.connectionId} connected!\nWSOCKET: Sending preferences...`
    )

    if (client && !conClient) {
      ConnectionStore.addClient(client)
      client.connected = true
    } else {
      console.log('Something has gone horribly wrong')
    }

    console.log('WSOCKET: Client connected!\nWSOCKET: Sending preferences...')
    dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, `WEBSOCKET: Sending client preferences...`)

    sendPrefData(socket)
    sendMappings(socket)

    const messageThrottles = new Map()
    const THROTTLE_DELAY = 100 // milliseconds

    socket.on('message', async (message) => {
      try {
        const parsedMessage = JSON.parse(message)
        console.log(`WSOCKET: ${client.connectionId} sent message `, parsedMessage)
        dataListener.asyncEmit(
          MESSAGE_TYPES.LOGGING,
          `WEBSOCKET: Client ${client.connectionId} has sent ${message}`
        )
        if (parsedMessage.app && parsedMessage.app !== 'server') {
          const messageKey = `${parsedMessage.app}-${parsedMessage.type}-${parsedMessage.request}`
          const now = Date.now()
          if (
            !messageThrottles.has(messageKey) ||
            now - messageThrottles.get(messageKey) > THROTTLE_DELAY
          ) {
            messageThrottles.set(messageKey, now)
            sendMessageToApp(parsedMessage.app.toLowerCase(), {
              type: parsedMessage.type,
              request: parsedMessage.request,
              payload: parsedMessage.payload
            })
            messageThrottles.forEach((timestamp, key) => {
              if (now - timestamp > THROTTLE_DELAY) {
                messageThrottles.delete(key)
              }
            })
          }

          // Delete old keys from the throttle
        } else if (parsedMessage.app === 'server') {
          try {
            switch (parsedMessage.type) {
              case 'preferences':
                addData(parsedMessage.request, parsedMessage.payload)
                break
              case 'heartbeat':
                socket.send(
                  JSON.stringify({
                    type: 'heartbeat',
                    app: 'client',
                    payload: new Date().toISOString()
                  })
                )
                break
              case 'set':
                switch (parsedMessage.request) {
                  case 'update_pref_index':
                    if (parsedMessage.payload) {
                      const { app: appName, index: newIndex } = parsedMessage.payload
                      AppState.setItemOrder(appName, newIndex)
                    }
                    break
                  default:
                    break
                }
                break
              case 'get':
                sendPrefData(socket)
                sendMappings(socket)
                sendTime()
                break
              case 'message':
                dataListener.asyncEmit(
                  MESSAGE_TYPES.MESSAGE,
                  `${client.connectionId}: ${parsedMessage.payload}`
                )
                break
              case 'device':
                HandleDeviceData(parsedMessage.payload)
                break
              case 'manifest':
                if (parsedMessage.payload) {
                  const manifest = parsedMessage.payload
                  if (!manifest) return

                  console.log('WSOCKET: Received manifest from client', manifest)

                  // Check if the client already exists
                  const newClient = manifest.uuid
                    ? ConnectionStore.getClients().find(
                        (client) => client.connectionId === manifest.uuid
                      )
                    : null

                  // This means the client already exists
                  if (newClient) {
                    // Remove the old client
                    console.log('WSOCKET: Client already exists, updating...')
                    if (newClient.connectionId != client.connectionId) {
                      ConnectionStore.removeClient(client.connectionId)
                    }

                    // Update the client to the new one
                    client.connected = true
                    client.timestamp = newClient.timestamp
                    client.client_name = manifest.name
                    client.device_type = newClient.device_type || manifest.device_type
                    client.version = manifest.version
                    client.description = manifest.description
                    client.connectionId =
                      newClient.connectionId == null
                        ? (client.connectionId as UUID)
                        : (newClient.connectionId as UUID)
                    ConnectionStore.updateClient(newClient.connectionId, client)
                  } else {
                    // Update the current client
                    console.log('WSOCKET: Client does not exist, adding...')

                    ConnectionStore.updateClient(client.connectionId, {
                      connectionId:
                        manifest.uuid == null
                          ? (client.connectionId as UUID)
                          : (manifest.uuid as UUID),
                      client_name: manifest.name,
                      version: manifest.version,
                      description: manifest.description,
                      connected: true,
                      device_type: manifest.device_type
                    })
                  }
                }
                break
              default:
                break
            }
          } catch (error) {
            console.error('WSOCKET: Error adding data:', error)
            sendError(socket, 'Error updating settings data!')
          }
        }
      } catch (e) {
        console.error('WSOCKET: Error in socketHandler', e)
      }
    })

    socket.on('close', () => {
      dataListener.asyncEmit(
        MESSAGE_TYPES.LOGGING,
        `WSOCKET: Client ${client.connectionId} has disconnected!`
      )
      ConnectionStore.removeClient(client.connectionId)
    })
  })
}

restartServer()
