import { Client, Settings } from '@shared/types'
import { ReplyFn, UtilityIPCData } from '@shared/types/ipcTypes'
import ConnectionStore from '../stores/connectionsStore'
import { disconnectClient } from './websocketServer'
import settingsStore from '../stores/settingsStore'
import { getReleases } from './githubHandler'
import dataListener, { MESSAGE_TYPES } from '../utils/events'
import path from 'path'
import { shell, app, dialog } from 'electron'
import keyMapStore from '../stores/keyMapStore'
import logger from '../utils/logger'
import { setupFirewall } from './firewallHandler'

export const utilityHandler: Record<
  UtilityIPCData['type'],
  (data: UtilityIPCData, replyFn: ReplyFn) => Promise<any>
> = {
  ping: async () => {
    return 'pong'
  },
  zip: async (data): Promise<string | undefined> => {
    if (data.request == 'get') {
      return await selectZipFile()
    }
    return
  },
  connections: async (data, replyFn) => {
    switch (data.request) {
      case 'get':
        return await getConnection(replyFn)
      case 'delete':
        return await deleteConnection(data, replyFn)
      default:
        return
    }
  },
  devices: async (data) => {
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
  'refresh-firewall': async (_data, replyFn) => {
    refreshFirewall(replyFn)
  }
}

const getConnection = async (replyFn: ReplyFn): Promise<Client[]> => {
  const clients = await ConnectionStore.getClients()
  replyFn('connections', { status: true, data: clients.length, final: false })
  replyFn('clients', { status: true, data: clients, final: true })
  return clients
}

const deleteConnection = async (data: UtilityIPCData, replyFn: ReplyFn): Promise<boolean> => {
  disconnectClient(data.payload)
  replyFn('logging', { status: true, data: 'Finished', final: true })
  return true
}

const selectZipFile = async (): Promise<string | undefined> => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Zip Files', extensions: ['zip'] }]
  })
  if (canceled) return
  return filePaths[0]
}

const refreshFirewall = async (replyFn: ReplyFn): Promise<void> => {
  try {
    replyFn('logging', { status: true, data: 'Refreshing Firewall', final: false })
    const payload = (await settingsStore.getSettings()) as Settings
    if (payload) {
      dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, '[firewall] Setting up firewall')
      try {
        await setupFirewall(payload.devicePort, replyFn)
      } catch (firewallError) {
        console.log(firewallError)
        if (!(firewallError instanceof Error)) return

        dataListener.asyncEmit(MESSAGE_TYPES.ERROR, `FIREWALL: ${firewallError.message}`)
        replyFn('logging', {
          status: false,
          data: 'Error in firewall',
          error: firewallError.message,
          final: true
        })
        return
      }
    } else {
      dataListener.asyncEmit(MESSAGE_TYPES.ERROR, '[firewall] No settings found!')
      replyFn('logging', {
        status: false,
        data: 'Error in firewall',
        error: 'No settings found!',
        final: true
      })
    }
  } catch (error) {
    dataListener.asyncEmit(MESSAGE_TYPES.ERROR, 'SERVER: [firewall] Error saving manifest' + error)
    console.error('[Firewall] Error setting client manifest:', error)
    if (error instanceof Error) {
      replyFn('logging', { status: false, data: 'Unfinished', error: error.message, final: true })
    }
  }
}
