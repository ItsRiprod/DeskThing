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
import { createServer, Server as HttpServer, IncomingMessage } from 'http'
import { app as electronApp } from 'electron'
import { join } from 'path'
import ConnectionStore from '../stores/connectionsStore'
import AppState from '../services/apps/appState'
import { getDeviceType } from '../services/client/clientUtils'

// Create a WebSocket server that listens on port 8891
// const server = new WebSocketServer({ port: 8891 })
// const server = new WebSocketServer({ port: 8891 })
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

const sendMessageToClients = async (message: SocketData): Promise<void> => {
  if (server) {
    server.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(message))
      }
    })
  } else {
    dataListener.emit(MESSAGE_TYPES.LOGGING, 'WSOCKET: No server running - setting one up')
  }
}

const sendResponse = async (socket, message): Promise<void> => {
  try {
    sendData(socket, { app: 'client', type: 'response', payload: message })
  } catch (error) {
    console.error('WSOCKET: Error sending message:', error)
  }
}
const sendData = async (socket, socketData: SocketData): Promise<void> => {
  try {
    if (socket != null) {
      socket.send(
        JSON.stringify({ app: socketData.app, type: socketData.type, payload: socketData.payload })
      )
    } else {
      sendMessageToClients({
        app: socketData.app,
        type: socketData.type,
        payload: socketData.payload
      })
    }
  } catch (error) {
    console.error('WSOCKET: Error sending message:', error)
  }
}

const sendError = async (socket, error): Promise<void> => {
  try {
    sendData(socket, { app: 'client', type: 'error', payload: error })
  } catch (error) {
    console.error('WSOCKET: Error sending message:', error)
  }
}

const sendPrefData = async (socket: WebSocket | null = null): Promise<void> => {
  try {
    const appData = await AppState.getAllBase()
    const config = await readData()
    if (!appData) {
      throw new Error('Invalid configuration format')
    }

    const settings = {}

    if (appData && appData) {
      appData.map((app) => {
        if (app && app.manifest) {
          const appConfig = config[app.manifest.id]
          if (appConfig?.settings) {
            settings[app.manifest.id] = appConfig.settings
          }
        }
      })
    } else {
      console.error('appData or appData.apps is undefined or null', appData)
    }

    sendData(socket, { app: 'client', type: 'config', payload: appData })
    sendData(socket, { app: 'client', type: 'settings', payload: settings })
    console.log('WSOCKET: Preferences sent!')
  } catch (error) {
    console.error('WSOCKET: Error getting config data:', error)
    sendError(socket, 'WSOCKET: Error getting config data')
  }
}

const sendMappings = async (socket: WebSocket | null = null): Promise<void> => {
  try {
    const mappings = keyMapStore.getMapping()
    if (socket) {
      sendData(socket, { app: 'client', type: 'button_mappings', payload: mappings })
      console.log('WSOCKET: Button mappings sent!')
      dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, `WEBSOCKET: Client has been sent button maps!`)
    } else {
      sendMessageToClients({ app: 'client', type: 'button_mappings', payload: mappings })
      dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, `WEBSOCKET: Client has been sent button maps!`)
    }
  } catch (error) {
    console.error('WSOCKET: Error getting button mappings:', error)
    if (socket) sendError(socket, 'WSOCKET: Error getting button mappings')
  }
}

const sendTime = async (): Promise<void> => {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const formattedHours = hours % 12 || 12
  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes
  const time = `${formattedHours}:${formattedMinutes} ${ampm}`
  sendMessageToClients({ app: 'client', type: 'time', payload: time })
  console.log(time)
}
const getDelayToNextMinute = async (): Promise<number> => {
  const now = new Date()
  const seconds = now.getSeconds()
  const milliseconds = now.getMilliseconds()
  return (60 - seconds) * 1000 - milliseconds
}

const initializeTimer = async (): Promise<void> => {
  setTimeout(
    () => {
      // Send time immediately at the full minute
      sendTime()

      // Set an interval to send time every minute
      setInterval(() => sendTime(), 60000)
    },
    await getDelayToNextMinute()
  )
}

initializeTimer()

export const disconnectClient = (connectionId: string): void => {
  const client = ConnectionStore.getClients().find((c) => c.connectionId === connectionId)
  if (client && server) {
    server.clients.forEach((ws: WebSocket) => {
      if (ws._socket.remoteAddress && ws._socket.remoteAddress.includes(client.ip)) {
        ws.terminate()
        console.log(`Forcibly disconnected client: ${connectionId}`)
      }
    })
    ConnectionStore.removeClient(connectionId)
  } else {
    console.log(`Client not found or server not running: ${connectionId}`)
  }
}

const setupServer = async (): Promise<void> => {
  dataListener.asyncEmit(MESSAGE_TYPES.MESSAGE, 'WSOCKET: Attempting to setup the server')
  if (!settings) {
    // Return if there are no settings
    dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, 'WSOCKET: No settings found, getting them now')
    const socketData = await settingsStore.getSettings()
    settings = socketData as Settings
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

  const handleClientConnection = (appName, req, res, next): void => {
    const userDataPath = electronApp.getPath('userData')
    const webAppDir = join(userDataPath, 'webapp')
    dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, `WEBSOCKET: Serving ${appName} from ${webAppDir}`)

    const clientIp = req.hostname

    const clientPort = req.socket.port

    console.log(`WEBSOCKET: Serving ${appName} from ${webAppDir} to ${clientIp}`)

    if (req.path.endsWith('manifest.js')) {
      const manifestPath = join(webAppDir, 'manifest.js')
      if (fs.existsSync(manifestPath)) {
        let manifestContent = fs.readFileSync(manifestPath, 'utf8')
        const connectionId = crypto.randomUUID()

        manifestContent = manifestContent.replace(
          /"ip":\s*".*?"/,
          `"ip": "${clientIp === '127.0.0.1' ? 'localhost' : clientIp}"`
        )

        manifestContent = manifestContent.includes('"uuid"')
          ? manifestContent.replace(/"uuid":\s*".*?"/, `"uuid":"${connectionId}"`)
          : manifestContent.replace(/{/, `{\n  "uuid": "${connectionId}",`)

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
  server.on('connection', async (socket: WebSocket, req: IncomingMessage) => {
    // Handle the incoming connection and add it to the ConnectionStore

    const clientIp = socket._socket.remoteAddress

    const conClient = ConnectionStore.getClients().find((client) => client.ip === clientIp)

    console.log(`WSOCKET: Client connected! Looking for client with IP ${clientIp}`)
    const client: Client = {
      ip: conClient?.ip || (clientIp as string),
      connected: true,
      timestamp: conClient?.timestamp || Date.now(),
      connectionId: conClient?.connectionId || crypto.randomUUID(),
      userAgent: conClient?.userAgent || req.headers['user-agent'] || '',
      device_type: conClient?.device_type || getDeviceType(req.headers['user-agent'])
    }

    console.log(
      `WSOCKET: Client with id: ${client.connectionId} connected!\nWSOCKET: Sending preferences...`
    )

    if (!conClient) {
      ConnectionStore.addClient(client)
      client.connected = true
    } else {
      ConnectionStore.updateClient(conClient.connectionId, client)
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

                    client.connectionId =
                      manifest.uuid == null
                        ? (client.connectionId as UUID)
                        : (manifest.uuid as UUID)

                    ConnectionStore.updateClient(client.connectionId, {
                      connectionId: client.connectionId as UUID,
                      client_name: manifest.name,
                      version: manifest.version,
                      description: manifest.description,
                      connected: true
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

dataListener.on(MESSAGE_TYPES.SETTINGS, (newSettings) => {
  if (settings) {
    updateServerSettings(newSettings)
  } else {
    dataListener.emit(MESSAGE_TYPES.LOGGING, 'WSOCKET: No settings received!')
  }
})

// Setting up the server for the first time
restartServer()

export { sendMessageToClients, sendMappings, sendResponse, sendError, sendData, sendPrefData }
