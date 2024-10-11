import { Client, Settings } from '@shared/types'
import { UtilityIPCData } from '@shared/types/ipcTypes'
import ConnectionStore from '../stores/connectionsStore'
import { disconnectClient } from './websocketServer'
import settingsStore from '../stores/settingsStore'
import { getReleases } from './githubHandler'
import dataListener, { MESSAGE_TYPES } from '../utils/events'
import path from 'path'
import { shell, app } from 'electron'
import keyMapStore from '../stores/keyMapStore'
import logger from '../utils/logger'
import { setupFirewall } from './firewallHandler'

export const utilityHandler: Record<
  UtilityIPCData['type'],
  (data: UtilityIPCData, event: Electron.IpcMainInvokeEvent) => Promise<any>
> = {
  ping: async () => {
    return 'pong'
  },
  connections: async (data, event) => {
    switch (data.request) {
      case 'get':
        return await getConnection(event)
      case 'delete':
        return await deleteConnection(data, event)
      default:
        return
    }
  },
  devices: async (data, event) => {
    switch (data.request) {
      case 'get':
        return await ConnectionStore.getDevices()
      default:
        return
    }
  },
  settings: async (data) => {
    switch (data.request) {
      case 'get':
        return await settingsStore.getSettings()
      case 'set':
        return await settingsStore.saveSettings(data.payload)
      default:
        return
    }
  },
  github: async (data) => {
    try {
      return await getReleases(data.payload)
    } catch (error) {
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, error)
      return []
    }
  },
  logs: async (data) => {
    switch (data.request) {
      case 'get':
        return await logger.getLogs()
      default:
        return
    }
  },
  maps: async (data) => {
    switch (data.request) {
      case 'get':
        return await keyMapStore.getMapping()
      case 'set':
        return await keyMapStore.addProfile(data.payload.profile, data.payload.baseProfile)
      case 'delete':
        return await keyMapStore.removeProfile(data.payload)
      default:
        return
    }
  },
  shutdown: async () => {
    app.quit()
  },
  'open-log-folder': async () => {
    const logPath = path.join(app.getPath('userData'))
    await shell.openPath(logPath)
  },
  'refresh-firewall': async (_data, event) => {
    refreshFirewall(event)
  }
}

const getConnection = async (event: Electron.IpcMainInvokeEvent): Promise<Client[]> => {
  const clients = await ConnectionStore.getClients()
  event.sender.send('connections', { status: true, data: clients.length, final: false })
  event.sender.send('clients', { status: true, data: clients, final: true })
  return clients
}

const deleteConnection = async (
  data: UtilityIPCData,
  event: Electron.IpcMainInvokeEvent
): Promise<boolean> => {
  disconnectClient(data.payload)
  event.sender.send('logging', { status: true, data: 'Finished', final: true })
  return true
}

const refreshFirewall = async (event: Electron.IpcMainInvokeEvent): Promise<void> => {
  try {
    event.sender.send('logging', { status: true, data: 'Refreshing Firewall', final: false })
    const payload = (await settingsStore.getSettings()) as Settings
    if (payload) {
      dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, '[firewall] Setting up firewall')
      try {
        await setupFirewall(payload.devicePort, (message) => {
          if (event.sender.isDestroyed()) return
          event.sender.send('logging', message)
        })
      } catch (firewallError) {
        console.log(firewallError)
        if (!(firewallError instanceof Error)) return

        dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `FIREWALL: ${firewallError.message}`)
        event.sender.send('logging', {
          status: false,
          data: 'Error in firewall',
          error: firewallError.message,
          final: true
        })
        return
      }
    } else {
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, '[firewall] No settings found!')
      event.sender.send('logging', {
        status: false,
        data: 'Error in firewall',
        error: 'No settings found!',
        final: true
      })
    }
  } catch (error) {
    dataListener.asyncEmit(MESSAGE_TYPES.ERROR, 'SERVER: [firewall] Error saving manifest' + error)
    console.error('[Firewall] Error setting client manifest:', error)
    event.sender.send('logging', { status: false, data: 'Unfinished', error: error, final: true })
  }
}
