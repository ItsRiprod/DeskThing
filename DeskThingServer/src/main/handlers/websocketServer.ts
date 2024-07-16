/* eslint-disable @typescript-eslint/no-var-requires */
import { WebSocketServer } from 'ws'
import { sendMessageToApp } from './appHandler'

import { getAppData, setAppData, getAppByName, getAppByIndex } from './configHandler'
import { readData, addData } from './dataHandler'
import dataListener, { MESSAGE_TYPES } from '../utils/events'
import { HandleDeviceData } from './deviceHandler'

// Create a WebSocket server that listens on port 8891
const server = new WebSocketServer({ port: 8891 })
// Check if the requested app is enabled in app_config.json
let numConnections = 0

export interface socketData {
  app: string
  type: string
  request?: string
  data?: Array<string> | string | object | number | { [key: string]: string | Array<string> }
}

const sendMessageToClients = async (message: socketData): Promise<void> => {
  server.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message))
    }
  })
}

const sendResponse = async (socket, message): Promise<void> => {
  try {
    sendData(socket, { app: 'client', type: 'response', data: message })
  } catch (error) {
    console.error('WSOCKET: Error sending message:', error)
  }
}
const sendData = async (socket, socketData: socketData): Promise<void> => {
  try {
    if (socket != null) {
      socket.send(
        JSON.stringify({ app: socketData.app, type: socketData.type, data: socketData.data })
      )
    } else {
      sendMessageToClients({ app: socketData.app, type: socketData.type, data: socketData.data })
    }
  } catch (error) {
    console.error('WSOCKET: Error sending message:', error)
  }
}

const sendError = async (socket, error): Promise<void> => {
  try {
    sendData(socket, { app: 'client', type: 'error', data: error })
  } catch (error) {
    console.error('WSOCKET: Error sending message:', error)
  }
}

const sendPrefData = async (socket = null): Promise<void> => {
  try {
    const appData = await getAppData()
    const config = await readData()
    if (!appData || !appData.apps) {
      throw new Error('Invalid configuration format')
    }

    const settings = {}

    if (appData && appData.apps) {
      appData.apps.map((app) => {
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

    sendData(socket, { app: 'client', type: 'config', data: appData.apps })
    sendData(socket, { app: 'client', type: 'settings', data: settings })
    console.log('WSOCKET: Preferences sent!')
  } catch (error) {
    console.error('WSOCKET: Error getting config data:', error)
    sendError(socket, 'Error getting config data')
  }
}
const sendTime = async (socket): Promise<void> => {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const formattedHours = hours % 12 || 12
  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes
  const time = `${formattedHours}:${formattedMinutes} ${ampm}`
  sendData(socket, { app: 'client', type: 'time', data: time })
  console.log(time)
}
const getDelayToNextMinute = async (): Promise<number> => {
  const now = new Date()
  const seconds = now.getSeconds()
  const milliseconds = now.getMilliseconds()
  return (60 - seconds) * 1000 - milliseconds
}
// Handle incoming messages from the client
server.on('connection', async (socket) => {
  numConnections = server.clients.size
  dataListener.asyncEmit(
    MESSAGE_TYPES.LOGGING,
    `WEBSOCKET: Client has connected! ${numConnections} in total`
  )
  dataListener.asyncEmit(MESSAGE_TYPES.CONNECTION, numConnections)

  console.log('WSOCKET: Client connected!\nWSOCKET: Sending preferences...')
  dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, `WEBSOCKET: Sending client preferences...`)
  sendPrefData(socket)
  socket.on('message', async (message) => {
    try {
      const parsedMessage = JSON.parse(message)
      console.log('WSOCKET: Getting data', parsedMessage)
      dataListener.asyncEmit(
        MESSAGE_TYPES.LOGGING,
        `WEBSOCKET: Client has sent a message ${message}`
      )
      if (parsedMessage.app && parsedMessage.app !== 'server') {
        sendMessageToApp(
          parsedMessage.app.toLowerCase(),
          parsedMessage.type,
          parsedMessage.request,
          parsedMessage.data
        )
      } else if (parsedMessage.app === 'server') {
        try {
          switch (parsedMessage.type) {
            case 'preferences':
              addData(parsedMessage.request, parsedMessage.data)
              break
            case 'set':
              switch (parsedMessage.request) {
                case 'add_app':
                  if (parsedMessage.data) {
                    const appData = await getAppByName(parsedMessage.data.app)
                    if (
                      appData &&
                      appData.manifest &&
                      !appData.manifest.isWebApp &&
                      !appData.manifest.isLocalApp
                    ) {
                      console.log('SERVER: Removing stupid little app')
                      appData.prefIndex = 10
                      await setAppData(appData)
                      await sendPrefData(socket)
                      break
                    }
                    const oldApp = await getAppByIndex(parsedMessage.data.index)
                    if (oldApp) {
                      dataListener.asyncEmit(
                        MESSAGE_TYPES.LOGGING,
                        `WSOCKET: Setting ${oldApp.name} index ${oldApp.prefIndex} to 5`
                      )
                      oldApp.prefIndex = 5
                      await setAppData(oldApp)
                    }

                    if (appData) {
                      console.log(
                        `WSOCKET: Setting ${parsedMessage.data.app} index ${appData.prefIndex} to ${parsedMessage.data.index}`
                      )
                      dataListener.asyncEmit(
                        MESSAGE_TYPES.LOGGING,
                        `WSOCKET: Setting ${parsedMessage.data.app} index ${appData.prefIndex} to ${parsedMessage.data.index}`
                      )
                      appData.prefIndex = parsedMessage.data.index
                      await setAppData(appData)
                      await sendPrefData(socket)
                    }
                  }
                  break
                default:
                  break
              }
              break
            case 'get':
              sendPrefData(socket)
              sendTime(socket)
              break
            case 'message':
              dataListener.asyncEmit(MESSAGE_TYPES.MESSAGE, `WSOCKET ${parsedMessage.data}`)
              break
            case 'device':
              HandleDeviceData(parsedMessage.data)
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

  sendTime(socket)

  // Set an initial timeout to the next full minute
  setTimeout(
    () => {
      // Send time immediately at the full minute
      sendTime(socket)

      // Set an interval to send time every minute
      const intervalId = setInterval(() => sendTime(socket), 60000)

      // Clear the interval when the socket is closed
      socket.on('close', () => {
        numConnections = server.clients.size
        dataListener.emit(
          MESSAGE_TYPES.LOGGING,
          `WEBSOCKET: Client has disconnected! ${numConnections} in total`
        )
        dataListener.emit(MESSAGE_TYPES.CONNECTION, numConnections)
        clearInterval(intervalId)
        console.log('WSOCKET: Client disconnected')
      })
    },
    await getDelayToNextMinute()
  )

  socket.on('close', () => {
    numConnections = server.clients.size
    dataListener.emit(
      MESSAGE_TYPES.LOGGING,
      `WEBSOCKET: Client has disconnected! ${numConnections} in total`
    )
    dataListener.emit(MESSAGE_TYPES.CONNECTION, numConnections)
  })
})

export { sendMessageToClients, sendResponse, sendError, sendData, sendPrefData }
