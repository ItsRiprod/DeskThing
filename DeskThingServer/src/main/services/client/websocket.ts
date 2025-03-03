console.log('[ClientSocket Service] Starting')
import WebSocket, { WebSocketServer } from 'ws'
import { createServer, Server as HttpServer, IncomingMessage } from 'http'
import { connectionStore, settingsStore, appStore, mappingStore } from '@server/stores'
import Logger from '@server/utils/logger'
import {
  LOGGING_LEVELS,
  ClientManifest,
  SocketData,
  Action,
  SettingsType,
  ServerEvent,
  EventPayload
} from '@DeskThing/types'
import { Client, ServerIPCData, Settings } from '@shared/types'
import { HandleDeviceData } from '../../handlers/deviceHandler'
import crypto from 'crypto'
import { getDeviceType, sendTime } from './clientUtils'
import express from 'express'
import { setupExpressServer } from './expressServer'
import {
  sendConfigData,
  sendError,
  sendMappings,
  sendMessageToClient,
  sendMessageToClients,
  sendSettingData,
  sendSettingsData
} from './clientCom'
import { sendIpcData } from '../..'

export let server: WebSocketServer | null = null
export let httpServer: HttpServer
export const Clients: { client: Client; socket }[] = []

let currentPort
let currentAddress

const alwaysAllow = ['preferences', 'ping', 'pong', 'manifest']

const messageThrottles = new Map()
const THROTTLE_DELAY = 300 // milliseconds

/**
 * Restarts the WebSocket server by shutting down the existing server, removing all connected clients, and setting up a new server.
 * This function is called when the WebSocket server needs to be restarted, for example, when the server configuration changes.
 * It logs the server shutdown and startup process, and handles any errors that may occur during the process.
 */
export const restartServer = async (): Promise<void> => {
  try {
    if (server) {
      Logger.log(LOGGING_LEVELS.LOG, 'WSOCKET: Shutting down the WebSocket server...')
      Logger.log(LOGGING_LEVELS.LOG, 'WSOCKET: Shutting down the WebSocket server...')
      connectionStore.removeAllClients()

      server.clients.forEach((client) => {
        client.terminate()
      })

      server.close((err) => {
        if (err) {
          console.error('WSOCKET: Error shutting down WebSocket server:', err)
          Logger.log(LOGGING_LEVELS.ERROR, 'WSOCKET: Error shutting down WebSocket server:' + err)
        } else {
          Logger.log(LOGGING_LEVELS.LOG, 'WSOCKET: WebSocket server shut down successfully.')
          Logger.log(LOGGING_LEVELS.LOG, 'WSOCKET: WebSocket server shut down successfully.')
        }

        if (httpServer && httpServer.listening) {
          Logger.log(LOGGING_LEVELS.LOG, 'WSOCKET: Stopping HTTP server...')
          httpServer.close((err) => {
            if (err) {
              console.error('WSOCKET: Error stopping HTTP server:', err)
            } else {
              Logger.log(LOGGING_LEVELS.LOG, 'WSOCKET: HTTP server stopped successfully.')
              setupServer()
            }
          })
        } else {
          setupServer()
        }
      })
    } else {
      Logger.log(LOGGING_LEVELS.LOG, 'WSOCKET: No WebSocket server running - setting one up')
      if (httpServer && httpServer.listening) {
        Logger.log(LOGGING_LEVELS.LOG, 'WSOCKET: Stopping HTTP server...')
        httpServer.close((err) => {
          if (err) {
            console.error('WSOCKET: Error stopping HTTP server:', err)
          } else {
            Logger.log(LOGGING_LEVELS.LOG, 'WSOCKET: HTTP server stopped successfully.')
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

/**
 * Asynchronously sets up the WebSocket server for the application.
 * This function initializes the Express app, creates the HTTP server,
 * and sets up the WebSocket server to handle incoming client connections.
 * It also sets up event listeners to handle client messages and disconnections.
 *
 * @returns {Promise<void>} A Promise that resolves when the server is set up.
 */
export const setupServer = async (): Promise<void> => {
  Logger.log(LOGGING_LEVELS.MESSAGE, 'WSOCKET: Attempting to setup the server')

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

  Logger.log(LOGGING_LEVELS.LOG, 'WSOCKET: WebSocket server is running.')

  httpServer.listen(currentPort, currentAddress, () => {
    Logger.log(
      LOGGING_LEVELS.LOG,
      `WEBSOCKET: Server is listening on ${currentAddress}:${currentPort}`
    )
  })

  // Handle incoming messages from the client
  server.on('connection', async (socket: WebSocket.WebSocket, req: IncomingMessage) => {
    // Handle the incoming connection and add it to the connectionStore

    // This is a bad way of handling and syncing clients
    const clientIp =
      req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.connection.remoteAddress

    // Setup the initial client data
    Logger.log(
      LOGGING_LEVELS.LOG,
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

    Logger.log(
      LOGGING_LEVELS.LOG,
      `Client with id: ${client.connectionId} connected!\nWSOCKET: Sending preferences...`,
      {
        function: 'setupServer',
        source: 'websocket'
      }
    )
    connectionStore.addClient(client)

    Logger.log(LOGGING_LEVELS.LOG, 'Client connected!\nWSOCKET: Sending preferences...', {
      function: 'setupServer',
      source: 'websocket'
    })

    sendConfigData(client.connectionId)
    sendSettingsData(client.connectionId)
    sendMappings(client.connectionId)
    sendMessageToClient(client.connectionId, { app: 'client', type: 'get', request: 'manifest' })

    socket.on('message', async (message: string) => {
      const messageData = JSON.parse(message) as SocketData
      Logger.info(`Client ${client.connectionId} has sent ${message}`, {
        function: 'onMessage',
        source: 'websocket'
      })
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
          const { appStore } = await import('@server/stores')
          appStore.sendDataToApp(messageData.app.toLowerCase(), {
            type: messageData.type as ServerEvent,
            request: messageData.request,
            payload: messageData.payload
          } as EventPayload)
        } else if (messageData.app === 'server') {
          // Handle server requests
          handleServerMessage(socket, client, messageData)
        } else if (messageData.app === 'utility' || messageData.app === 'music') {
          // Handle music requests
          const MusicHandler = (await import('../../stores/musicStore')).default
          MusicHandler.handleClientRequest(messageData)
        }

        // Cleanup throttle
        messageThrottles.forEach((timestamp, key) => {
          if (now - timestamp > THROTTLE_DELAY) {
            messageThrottles.delete(key)
          }
        })
      } else {
        Logger.log(
          LOGGING_LEVELS.DEBUG,
          `WSOCKET: Throttling message for ${messageKey} for ${THROTTLE_DELAY}ms`
        )
      }
    })

    socket.on('close', () => {
      Logger.log(LOGGING_LEVELS.LOG, `WSOCKET: Client ${client.connectionId} has disconnected!`)
      Clients.splice(
        Clients.findIndex((client) => client.client.connectionId === client.client.connectionId),
        1
      )
      connectionStore.removeClient(client.connectionId)
    })
  })
}

/**
 * Handles server messages received through the WebSocket connection.
 *
 * This function is responsible for processing different types of server messages,
 * such as preferences, heartbeat, ping/pong, settings updates, and more. It
 * performs the necessary actions based on the message type and updates the
 * application state accordingly.
 *
 * @param socket The WebSocket connection object.
 * @param client The client object associated with the WebSocket connection.
 * @param messageData The data received from the server, containing the message type and payload.
 * @returns A Promise that resolves when the message has been handled.
 */
const handleServerMessage = async (
  socket,
  client: Client,
  messageData: SocketData
): Promise<void> => {
  try {
    if (messageData.app === 'server') {
      Logger.log(LOGGING_LEVELS.LOG, `Server message received! ${messageData.type}`, {
        domain: client.connectionId,
        source: 'websocket',
        function: 'handleServerMessage'
      })
      try {
        switch (messageData.type) {
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
            Logger.log(LOGGING_LEVELS.LOG, 'Received pong from ', {
              domain: client.connectionId,
              source: 'websocket',
              function: 'handleServerMessage'
            })
            sendIpcData({
              type: `pong-${client.connectionId}`,
              payload: messageData.payload
            } as unknown as ServerIPCData) // so it doesnt mess with other types
            break
          case 'ping':
            Logger.log(LOGGING_LEVELS.LOG, 'Sent Ping', {
              domain: client.connectionId,
              source: 'websocket',
              function: 'handleServerMessage'
            })
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
                  appStore.setItemOrder(appName, newIndex)
                }
                break
              case 'settings':
                if (messageData.payload) {
                  const { app, id, setting } = messageData.payload as {
                    app: string
                    id: string
                    setting: SettingsType
                  }
                  appStore.addSetting(app, id, setting)
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
            Logger.log(LOGGING_LEVELS.MESSAGE, `${messageData.payload}`, {
              domain: client.connectionId,
              source: 'client'
            })
            break
          case 'log':
            Logger.log(messageData.payload.type, `${messageData.payload.payload}`, {
              domain: client.connectionId,
              function: messageData.payload.app,
              source: 'client'
            })
            break
          case 'device':
            HandleDeviceData(messageData.payload as string)
            break
          case 'manifest':
            if (messageData.payload) {
              const manifest = messageData.payload as ClientManifest & { adbId: string }
              if (!manifest) return

              Logger.log(
                LOGGING_LEVELS.LOG,
                'WSOCKET: Received manifest from client' + JSON.stringify(manifest),
                {
                  domain: client.connectionId,
                  source: 'client',
                  function: 'handleServerMessage'
                }
              )

              // Update the client to the info received from the client

              // This means the client already exists

              // Update the client to the new one
              client.connected = true
              client.name = manifest.name
              client.version = manifest.version
              client.description = manifest.description

              // the presence of an adbId means the client is a device
              if (manifest.adbId) {
                client.adbId = manifest.adbId
                client.device_type = manifest.device_type
              }
              // Update the client
              connectionStore.updateClient(client.connectionId, client)
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

/**
 * Sets up event listeners for various stores and sends updates to connected clients.
 *
 * This function is called to initialize the event listeners for the `settingsStore`,
 * `mappingStore`, and other relevant stores. It sets up callbacks that are triggered
 * when the settings or mapping data changes, and then sends the updated information
 * to all connected clients using the `sendMessageToClients` function.
 *
 * The function is wrapped in a `setTimeout` to ensure that the stores have been
 * properly initialized before the listeners are added.
 */
const setupListeners = async (): Promise<void> => {
  setTimeout(() => {
    settingsStore.addListener((newSettings: Settings) => {
      if (currentPort !== newSettings.devicePort || currentAddress !== newSettings.address) {
        restartServer()
      } else {
        Logger.log(LOGGING_LEVELS.LOG, 'WSOCKET: No settings changed!')
      }
    })

    mappingStore.addListener('profile', async (profile) => {
      const actions = await mappingStore.getActions()
      const SocketData = {
        type: 'button_mappings',
        app: 'client',
        payload: { ...profile, actions }
      }

      sendMessageToClients(SocketData)
    })

    mappingStore.addListener('action', async (actions) => {
      const profile = await mappingStore.getMapping()
      const SocketData = {
        type: 'button_mappings',
        app: 'client',
        payload: { ...profile, actions }
      }

      sendMessageToClients(SocketData)
    })

    mappingStore.addListener('update', async () => {
      const profile = await mappingStore.getMapping()
      const actions = await mappingStore.getActions()
      const SocketData = {
        type: 'button_mappings',
        app: 'client',
        payload: { ...profile, actions }
      }

      sendMessageToClients(SocketData)
    })

    appStore.on('apps', ({ data }) => {
      const filteredAppData = data.filter((app) => app.manifest?.isWebApp !== false)
      sendMessageToClient(undefined, { app: 'client', type: 'config', payload: filteredAppData })
    })

    appStore.on('settings', async (settingData) => {
      // handle potentially empty settings
      if (!settingData) return

      sendSettingData(settingData.appId, settingData.data)
    })
  }, 500)
}

setupListeners()
