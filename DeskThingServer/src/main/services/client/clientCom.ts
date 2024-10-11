import { SocketData } from '@shared/types'
import WebSocket from 'ws'

import keyMapStore from '../../stores/keyMapStore'
import { readData } from '../../handlers/dataHandler'
import dataListener, { MESSAGE_TYPES } from '../../utils/events'

// App Hosting
import AppState from '../apps/appState'

export const sendMappings = async (socket: WebSocket | null = null): Promise<void> => {
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

export const sendPrefData = async (socket: WebSocket | null = null): Promise<void> => {
  try {
    const appData = await AppState.getAllBase()
    console.log('Client Request: ', appData)
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

export const sendResponse = async (socket, message): Promise<void> => {
  try {
    sendData(socket, { app: 'client', type: 'response', payload: message })
  } catch (error) {
    console.error('WSOCKET: Error sending message:', error)
  }
}
export const sendData = async (socket, socketData: SocketData): Promise<void> => {
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

export const sendError = async (socket, error): Promise<void> => {
  try {
    sendData(socket, { app: 'client', type: 'error', payload: error })
  } catch (error) {
    console.error('WSOCKET: Error sending message:', error)
  }
}

export const sendMessageToClients = async (message: SocketData): Promise<void> => {
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
