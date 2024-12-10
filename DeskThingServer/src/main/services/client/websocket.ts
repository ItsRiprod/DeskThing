console.log('[ClientSocket Service] Starting')
import WebSocket, { WebSocketServer } from 'ws'
import { createServer, Server as HttpServer, IncomingMessage } from 'http'
import loggingStore from '../../stores/loggingStore'
import {
  AppDataInterface,
  MESSAGE_TYPES,
  Client,
  ClientManifest,
  Settings,
  SocketData,
  Action
} from '@shared/types'
import { addData } from '../../handlers/dataHandler'
import { HandleDeviceData } from '../../handlers/deviceHandler'
import settingsStore from '../../stores/settingsStore'
import AppState from '../../services/apps/appState'
import crypto from 'crypto'

import { sendMessageToApp } from '../apps'
import ConnectionStore from '../../stores/connectionsStore'

import { getDeviceType, sendTime } from './clientUtils'
import express from 'express'
import { setupExpressServer } from './expressServer'
import {
  sendConfigData,
  sendError,
  sendMappings,
  sendMessageToClient,
  sendMessageToClients,
  sendSettingsData
} from './clientCom'
import { sendIpcData } from '../..'
import mappingStore from '../mappings/mappingStore'

export let server: WebSocketServer | null = null
export let httpServer: HttpServer
export const Clients: { client: Client; socket }[] = []

let currentPort
let currentAddress

const alwaysAllow = ['preferences', 'ping', 'pong', 'manifest']

const messageThrottles = new Map()
const THROTTLE_DELAY = 300 // milliseconds

export const restartServer = async (): Promise<void> => {
  try {
    if (server) {
      loggingStore.log(MESSAGE_TYPES.LOGGING, 'WSOCKET: Shutting down the WebSocket server...')
      loggingStore.log(MESSAGE_TYPES.LOGGING, 'WSOCKET: Shutting down the WebSocket server...')
      ConnectionStore.removeAllClients()

      server.clients.forEach((client) => {
        client.terminate()
      })

      server.close((err) => {
        if (err) {
          console.error('WSOCKET: Error shutting down WebSocket server:', err)
          loggingStore.log(
            MESSAGE_TYPES.ERROR,
            'WSOCKET: Error shutting down WebSocket server:' + err
          )
        } else {
          loggingStore.log(
            MESSAGE_TYPES.LOGGING,
            'WSOCKET: WebSocket server shut down successfully.'
          )
          loggingStore.log(
            MESSAGE_TYPES.LOGGING,
            'WSOCKET: WebSocket server shut down successfully.'
          )
        }

        if (httpServer && httpServer.listening) {
          loggingStore.log(MESSAGE_TYPES.LOGGING, 'WSOCKET: Stopping HTTP server...')
          httpServer.close((err) => {
            if (err) {
              console.error('WSOCKET: Error stopping HTTP server:', err)
            } else {
              loggingStore.log(MESSAGE_TYPES.LOGGING, 'WSOCKET: HTTP server stopped successfully.')
              setupServer()
            }
          })
        } else {
          setupServer()
        }
      })
    } else {
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        'WSOCKET: No WebSocket server running - setting one up'
      )
      if (httpServer && httpServer.listening) {
        loggingStore.log(MESSAGE_TYPES.LOGGING, 'WSOCKET: Stopping HTTP server...')
        httpServer.close((err) => {
          if (err) {
            console.error('WSOCKET: Error stopping HTTP server:', err)
          } else {
            loggingStore.log(MESSAGE_TYPES.LOGGING, 'WSOCKET: HTTP server stopped successfully.')
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

export const setupServer = async (): Promise<void> => {
  loggingStore.log(MESSAGE_TYPES.MESSAGE, 'WSOCKET: Attempting to setup the server')

  if (!currentPort || !currentAddress) {
    const settings = await settingsStore.getSettings()
    currentPort = settings.devicePort
    currentAddress = settings.address
  }

  // Setting up the express app
  const expressApp = express()

  setupExpressServer(expressApp)

  httpServer = createServer(expressApp)

  server = new WebSocketServer({ server: httpServer })

  loggingStore.log(MESSAGE_TYPES.LOGGING, 'WSOCKET: WebSocket server is running.')

  httpServer.listen(currentPort, currentAddress, () => {
    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `WEBSOCKET: Server is listening on ${currentAddress}:${currentPort}`
    )
  })

  // Handle incoming messages from the client
  server.on('connection', async (socket: WebSocket.WebSocket, req: IncomingMessage) => {
    // Handle the incoming connection and add it to the ConnectionStore

    // This is a bad way of handling and syncing clients
    const clientIp =
      req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.connection.remoteAddress

    // Setup the initial client data
    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `WSOCKET: Client connected! Looking for client with IP ${clientIp}`
    )

    // Local client that is the true source of truth for the device details
    const client: Client = {
      ip: clientIp as string,
      connected: true,
      port: req.socket.remotePort,
      timestamp: Date.now(),
      connectionId: crypto.randomUUID(), // The first and only time this is run
      userAgent: req.headers['user-agent'] || '',
      device_type: getDeviceType(req.headers['user-agent'])
    }

    Clients.push({ client, socket })

    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      `WSOCKET: Client with id: ${client.connectionId} connected!\nWSOCKET: Sending preferences...`
    )
    ConnectionStore.addClient(client)

    loggingStore.log(
      MESSAGE_TYPES.LOGGING,
      'WSOCKET: Client connected!\nWSOCKET: Sending preferences...'
    )
    loggingStore.log(MESSAGE_TYPES.LOGGING, `WEBSOCKET: Sending client preferences...`)

    sendConfigData(client.connectionId)
    sendSettingsData(client.connectionId)
    sendMappings(client.connectionId)
    sendMessageToClient(client.connectionId, { app: 'client', type: 'get', request: 'manifest' })

    socket.on('message', async (message: string) => {
      const messageData = JSON.parse(message) as SocketData
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `WEBSOCKET: Client ${client.connectionId} has sent ${message}`
      )
      const messageKey = `${messageData.app}-${messageData.type}-${messageData.request}`
      const now = Date.now()

      /**
       *
       * Check throttle
       * The purpose of the throttle is so when multiple clients are connected,
       * they often send the same request at the same time (i.e. song at its end).
       * As most, if not all, of these requests are burst to every client, they can be grouped together.
       */

      if (
        !messageThrottles.has(messageKey) ||
        now - messageThrottles.get(messageKey) > THROTTLE_DELAY ||
        alwaysAllow.includes(messageData.type)
      ) {
        // Add the current request to the throttle map
        messageThrottles.set(messageKey, now)

        // Handle non-server messages
        if (
          messageData.app &&
          messageData.app !== 'server' &&
          messageData.app !== 'utility' &&
          messageData.app !== 'music'
        ) {
          sendMessageToApp(messageData.app.toLowerCase(), {
            type: messageData.type,
            request: messageData.request,
            payload: messageData.payload
          })
        } else if (messageData.app === 'server') {
          // Handle server requests
          handleServerMessage(socket, client, messageData)
        } else if (messageData.app === 'utility' || messageData.app === 'music') {
          // Handle music requests
          const MusicHandler = (await import('../../handlers/musicHandler')).default
          MusicHandler.handleClientRequest(messageData)
        }

        // Cleanup throttle
        messageThrottles.forEach((timestamp, key) => {
          if (now - timestamp > THROTTLE_DELAY) {
            messageThrottles.delete(key)
          }
        })
      } else {
        loggingStore.log(
          MESSAGE_TYPES.DEBUG,
          `WSOCKET: Throttling message for ${messageKey} for ${THROTTLE_DELAY}ms`
        )
      }
    })

    socket.on('close', () => {
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `WSOCKET: Client ${client.connectionId} has disconnected!`
      )
      Clients.splice(
        Clients.findIndex((client) => client.client.connectionId === client.client.connectionId),
        1
      )
      ConnectionStore.removeClient(client.connectionId)
    })
  })
}

const handleServerMessage = async (
  socket,
  client: Client,
  messageData: SocketData
): Promise<void> => {
  try {
    if (messageData.app === 'server') {
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `WSOCKET: Server message received! ${messageData.type}`
      )
      try {
        switch (messageData.type) {
          case 'preferences':
            if (messageData.request && messageData.payload) {
              addData(messageData.request, messageData.payload as AppDataInterface)
            }
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
          case 'pong':
            loggingStore.log(MESSAGE_TYPES.LOGGING, 'Received pong from ', client.connectionId)
            sendIpcData(`pong-${client.connectionId}`, messageData.payload)
            break
          case 'ping':
            loggingStore.log(MESSAGE_TYPES.LOGGING, 'Sent Ping', client.connectionId)
            socket.send(
              JSON.stringify({
                type: 'pong',
                app: 'client',
                payload: new Date().toISOString()
              })
            )
            break
          case 'set':
            switch (messageData.request) {
              case 'update_pref_index':
                if (messageData.payload) {
                  const { app: appName, index: newIndex } = messageData.payload as {
                    app: string
                    index: number
                  }
                  AppState.setItemOrder(appName, newIndex)
                }
                break
              default:
                break
            }
            break
          case 'get':
            sendConfigData(client.connectionId)
            sendSettingsData(client.connectionId)
            sendMappings(client.connectionId)
            sendTime()
            break
          case 'message':
            loggingStore.log(
              MESSAGE_TYPES.MESSAGE,
              `${client.connectionId}: ${messageData.payload}`
            )
            break
          case 'device':
            HandleDeviceData(messageData.payload as string)
            break
          case 'manifest':
            if (messageData.payload) {
              const manifest = messageData.payload as ClientManifest
              if (!manifest) return

              loggingStore.log(
                MESSAGE_TYPES.LOGGING,
                'WSOCKET: Received manifest from client' + JSON.stringify(manifest)
              )

              // Update the client to the info received from the client

              // This means the client already exists

              // Update the client to the new one
              client.connected = true
              client.client_name = manifest.name
              client.version = manifest.version
              client.description = manifest.description

              // the presence of an adbId means the client is a device
              if (manifest.adbId) {
                client.adbId = manifest.adbId
                client.device_type = manifest.device_type
              }
              // Update the client
              ConnectionStore.updateClient(client.connectionId, client)
            }
            break
          case 'action':
            mappingStore.runAction(messageData.payload as Action)
            break
          default:
            break
        }
      } catch (error) {
        console.error('WSOCKET: Error adding data:', error)
        sendError(client.connectionId, 'Error updating settings data!')
      }
    }
  } catch (e) {
    console.error('WSOCKET: Error in socketHandler', e)
  }
}

const setupListeners = async (): Promise<void> => {
  setTimeout(() => {
    settingsStore.addListener((newSettings: Settings) => {
      if (currentPort !== newSettings.devicePort || currentAddress !== newSettings.address) {
        restartServer()
      } else {
        loggingStore.log(MESSAGE_TYPES.LOGGING, 'WSOCKET: No settings changed!')
      }
    })

    mappingStore.addListener('profile', (profile) => {
      const actions = mappingStore.getActions()
      const SocketData = {
        type: 'button_mappings',
        app: 'client',
        payload: { ...profile, actions }
      }

      sendMessageToClients(SocketData)
    })

    mappingStore.addListener('action', (actions) => {
      const profile = mappingStore.getMapping()
      const SocketData = {
        type: 'button_mappings',
        app: 'client',
        payload: { ...profile, actions }
      }

      sendMessageToClients(SocketData)
    })

    mappingStore.addListener('update', () => {
      const profile = mappingStore.getMapping()
      const actions = mappingStore.getActions()
      const SocketData = {
        type: 'button_mappings',
        app: 'client',
        payload: { ...profile, actions }
      }

      sendMessageToClients(SocketData)
    })
  }, 500)
}

setupListeners()
