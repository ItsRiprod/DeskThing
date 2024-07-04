/* eslint-disable @typescript-eslint/no-var-requires */
import { WebSocketServer } from 'ws'
import { sendMessageToApp } from './appHandler'

import { getAppData, setAppData, getAppByName, getAppByIndex } from './configHandler'
import { readData, addData } from './dataHandler'
import dataListener, { MESSAGE_TYPES } from './events'

// Create a WebSocket server that listens on port 8891
const server = new WebSocketServer({ port: 8891 })
// Check if the requested app is enabled in app_config.json
let numConnections = 0

const sendMessageToClients = async (message): Promise<void> => {
  server.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message))
    }
  })
}

const sendResponse = async (socket, message): Promise<void> => {
  try {
    socket.send(JSON.stringify({ type: 'response', data: message }))
  } catch (error) {
    console.error('WSOCKET: Error sending message:', error)
  }
}
const sendData = async (socket, type, data): Promise<void> => {
  try {
    if (socket != null) {
      socket.send(JSON.stringify({ type: type, data: data }))
    } else {
      sendMessageToClients({ type: type, data: data })
    }
  } catch (error) {
    console.error('WSOCKET: Error sending message:', error)
  }
}

const sendError = async (socket, error): Promise<void> => {
  try {
    socket.send(JSON.stringify({ type: 'error', data: error }))
  } catch (error) {
    console.error('WSOCKET: Error sending message:', error)
  }
}

const sendPrefData = async (socket = null): Promise<void> => {
  try {
    const config = await getAppData()
    if (!config || !config.apps) {
      throw new Error('Invalid configuration format')
    }
    const appData = await readData()
    const settings = {}

    for (const appName in appData) {
      const appConfig = appData[appName]
      if (appConfig?.settings) {
        settings[appName] = appConfig.settings
      }
    }

    const enabledApps = config.apps.filter((app) => app.enabled)
    enabledApps.sort((a, b) => {
      const prefIndexA = a.prefIndex
      const prefIndexB = b.prefIndex
      return prefIndexA - prefIndexB
    })
    const preferredApps = enabledApps.slice(0, 4).map((app) => app.name)

    const prefs = {
      preferredApps: preferredApps,
      modules: enabledApps.map((app) => app.name),
      settings: settings
    }

    sendData(socket, 'utility_data', prefs)
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
  sendData(socket, 'time', time)
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
  numConnections++
  dataListener.emit(
    MESSAGE_TYPES.LOGGING,
    `WEBSOCKET: Client has connected! ${numConnections} in total`
  )

  console.log('WSOCKET: Client connected!\nWSOCKET: Sending preferences...')
  dataListener.emit(MESSAGE_TYPES.LOGGING, `WEBSOCKET: Sending client preferences...`)
  sendPrefData(socket)
  socket.on('message', async (message) => {
    try {
      const parsedMessage = JSON.parse(message)
      console.log('WSOCKET: Getting data', parsedMessage)
      dataListener.emit(MESSAGE_TYPES.LOGGING, `WEBSOCKET: Client has sent a message ${message}`)
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
                    const oldApp = await getAppByIndex(parsedMessage.data.index + 1)
                    if (oldApp) {
                      oldApp.prefIndex = 5
                      await setAppData(oldApp)
                    }
                    const appData = await getAppByName(parsedMessage.data.app)
                    if (appData) {
                      console.log(
                        `WSOCKET: Setting ${parsedMessage.data.app} index ${appData.prefIndex} to ${parsedMessage.data.index}`
                      )
                      appData.prefIndex = parsedMessage.data.index + 1
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
        numConnections--
        dataListener.emit(
          MESSAGE_TYPES.LOGGING,
          `WEBSOCKET: Client has disconnected! ${numConnections} in total`
        )
        clearInterval(intervalId)
        console.log('WSOCKET: Client disconnected')
      })
    },
    await getDelayToNextMinute()
  )
})

export { sendMessageToClients, sendResponse, sendError, sendData, sendPrefData }
