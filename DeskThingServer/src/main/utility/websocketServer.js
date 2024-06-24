/* eslint-disable @typescript-eslint/no-var-requires */
import { WebSocketServer } from 'ws'
import { fileURLToPath } from 'url'
import fs from 'fs'
import path from 'path'
import { sendMessageToApp } from './appHandler'
const __filename = fileURLToPath(import.meta.url) // get the resolved path to the file
const __dirname = path.dirname(__filename)

import { getConfigData } from './configHandler'

// Create a WebSocket server that listens on port 8891
const server = new WebSocketServer({ port: 8891 })
// Check if the requested app is enabled in app_config.json

const sendMessageToClients = (message) => {
  server.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message))
    }
  })
}

const sendResponse = async (socket, message) => {
  try {
    socket.send(JSON.stringify({ type: 'response', data: message }))
  } catch (error) {
    console.error('Error sending message:', error)
  }
}
const sendData = async (socket, type, data) => {
  try {
    socket.send(JSON.stringify({ type: type, data: data }))
  } catch (error) {
    console.error('Error sending message:', error)
  }
}

const sendError = async (socket, error) => {
  try {
    console.error('Socket Error ', error)
    socket.send(JSON.stringify({ type: 'error', error: error }))
  } catch (error) {
    console.error('Error sending message:', error)
  }
}

// Handle incoming messages from the client
server.on('connection', async (socket) => {
  console.log('Client connected!\nSending preferences...')
  try {
    const config = await getConfigData()
    if (!config || !config.apps) {
      throw new Error('Invalid configuration format')
    }

    const enabledApps = config.apps.filter((app) => app.enabled).map((app) => app.name)
    const preferredApps = enabledApps.slice(0, 4)
    const modules = [...enabledApps, 'Utility']

    const prefs = {
      preferredApps,
      modules: Array.from(new Set(modules))
    }

    sendData(socket, 'utility_pref_data', prefs)
  } catch (error) {
    console.error('Error getting config data:', error)
    sendError(socket, 'Error getting config data')
  }

  socket.on('message', async (message) => {
    try {
      const parsedMessage = JSON.parse(message)
      console.log('Getting data', parsedMessage)
      if (parsedMessage.app) {
        sendMessageToApp(
          parsedMessage.app.toLowerCase(),
          parsedMessage.type,
          parsedMessage.request,
          parsedMessage.data
        )
      }
    } catch (e) {
      console.error('Error in socketHandler', e)
    }
  })

  socket.on('close', () => {
    console.log('Client disconnected')
  })
})

export { sendMessageToClients, sendResponse, sendError, sendData }
