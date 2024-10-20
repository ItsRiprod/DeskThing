import { SocketData } from '@shared/types'
import { server, Clients } from './websocket'
import dataListener, { MESSAGE_TYPES } from '../../utils/events'
import connectionsStore from '../../stores/connectionsStore'
import appState from '../apps/appState'
import { readData } from '../../handlers/dataHandler'
import keyMapStore from '../../stores/keyMapStore'

export const sendMessageToClients = async (data: SocketData): Promise<void> => {
  if (server) {
    server.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(data))
      }
    })
  } else {
    dataListener.emit(MESSAGE_TYPES.LOGGING, 'WSOCKET: No server running - setting one up')
  }
}

export const disconnectClient = (connectionId: string): void => {
  const client = Clients.find((c) => c.client.connectionId === connectionId)

  if (client && server) {
    client.socket.terminate()
    Clients.splice(Clients.indexOf(client), 1)
    console.log(`Forcibly disconnected client: ${connectionId}`)
    connectionsStore.removeClient(connectionId)
  } else {
    console.log(`Client not found or server not running: ${connectionId}`)
  }
}

export const sendMessageToClient = (clientId: string | undefined, data: SocketData): void => {
  const client = Clients.find((client) => client.client.connectionId === clientId)
  if (client) {
    client.socket.send(JSON.stringify(data))
  } else {
    // Burst the message if there is no client provided
    sendMessageToClients(data)
  }
}

export const sendError = async (clientId: string | undefined, error: string): Promise<void> => {
  try {
    sendMessageToClient(clientId, { app: 'client', type: 'error', payload: error })
  } catch (error) {
    console.error('WSOCKET: Error sending message:', error)
  }
}

export const sendConfigData = async (clientId?: string): Promise<void> => {
  try {
    const appData = await appState.getAllBase()

    sendMessageToClient(clientId, { app: 'client', type: 'config', payload: appData })

    console.log('WSOCKET: Preferences sent!')
  } catch (error) {
    console.error('WSOCKET: Error getting config data:', error)
    sendError(clientId, 'WSOCKET: Error getting config data')
  }
}

export const sendSettingsData = async (clientId?: string): Promise<void> => {
  try {
    const appData = await appState.getAllBase()
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

    sendMessageToClient(clientId, { app: 'client', type: 'settings', payload: settings })
    console.log('WSOCKET: Preferences sent!')
  } catch (error) {
    console.error('WSOCKET: Error getting config data:', error)
    sendError(clientId, 'WSOCKET: Error getting config data')
  }
}

export const sendMappings = async (clientId?: string): Promise<void> => {
  try {
    const mappings = keyMapStore.getMapping()

    sendMessageToClient(clientId, { app: 'client', type: 'button_mappings', payload: mappings })

    console.log('WSOCKET: Button mappings sent!')
    dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, `WEBSOCKET: Client has been sent button maps!`)
  } catch (error) {
    console.error('WSOCKET: Error getting button mappings:', error)
    sendError(clientId, 'WSOCKET: Error getting button mappings')
  }
}
