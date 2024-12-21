console.log('[Utility Handler] Starting')
import {
  ReplyFn,
  UtilityIPCData,
  ButtonMapping,
  Client,
  MESSAGE_TYPES,
  GithubRelease,
  Log,
  Settings,
  Action,
  Key,
  MappingStructure,
  Profile
} from '@shared/types'
import ConnectionStore from '../stores/connectionsStore'
import settingsStore from '../stores/settingsStore'
import { getReleases } from './githubHandler'
import loggingStore from '../stores/loggingStore'
import path from 'path'
import { shell, app, dialog } from 'electron'
import keyMapStore from '../services/mappings/mappingStore'
import { setupFirewall } from './firewallHandler'
import { disconnectClient } from '../services/client/clientCom'
import { restartServer } from '../services/client/websocket'

/**
 * The `utilityHandler` object is an exported module that provides a set of utility functions for handling various tasks in the application. It is structured as a record type, where the keys correspond to the `UtilityIPCData['type']` union type, and the values are asynchronous functions that handle the corresponding request.
 *
 * The functions in the `utilityHandler` object handle a wide range of tasks, including:
 * - Pinging the server and returning a 'pong' response
 * - Selecting a zip file
 * - Managing connections (getting, deleting)
 * - Getting devices
 * - Managing settings (getting, setting)
 * - Fetching GitHub releases
 * - Getting logs
 * - Shutting down the application
 * - Opening the log folder
 * - Refreshing the firewall
 * - Restarting the server
 * - Managing actions (getting, setting, deleting)
 * - Managing buttons (setting, deleting)
 * - Managing keys (getting, setting, deleting)
 * - Managing profiles (getting, setting, deleting)
 * - Setting and getting the current profile
 * - Running actions
 *
 * Each function is responsible for handling a specific request type and returning the appropriate data or performing the requested action.
 */
export const utilityHandler: Record<
  UtilityIPCData['type'],
  (
    data: UtilityIPCData,
    replyFn: ReplyFn
  ) => Promise<
    | void
    | string
    | Client[]
    | boolean
    | string[]
    | Settings
    | GithubRelease[]
    | ButtonMapping
    | Log[]
    | Action
    | Action[]
    | Key
    | Key[]
    | ButtonMapping[]
    | ButtonMapping
    | MappingStructure
    | null
    | Profile[]
    | Profile
  >
> = {
  ping: async () => {
    loggingStore.log(MESSAGE_TYPES.LOGGING, 'Pinged! pong')
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
      if (error instanceof Error) {
        loggingStore.log(MESSAGE_TYPES.ERROR, error.message)
      } else {
        loggingStore.log(MESSAGE_TYPES.ERROR, String(error))
      }
      return []
    }
  },
  logs: async (data) => {
    switch (data.request) {
      case 'get':
        return await loggingStore.getLogs()
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
  },

  'restart-server': async (_data, replyFn) => {
    replyFn('logging', { status: true, data: 'Restarting server...', final: false })
    await restartServer()
    replyFn('logging', { status: true, data: 'Server Restarted', final: true })
  },
  actions: async (data) => {
    switch (data.request) {
      case 'get':
        return await keyMapStore.getActions()
      case 'set':
        return await keyMapStore.addAction(data.payload as Action)
      case 'delete':
        return await keyMapStore.removeAction(data.payload)
      default:
        return
    }
  },
  buttons: async (data) => {
    switch (data.request) {
      case 'set': {
        const { action, key, mode, profile } = data.payload
        if (!action || !key || !mode) {
          loggingStore.log(
            MESSAGE_TYPES.ERROR,
            `Missing required button data: ${JSON.stringify({
              action: !!action,
              key: !!key,
              mode: !!mode
            })}`
          )
          return
        }
        try {
          return await keyMapStore.addButton({ action, key, mode, profile })
        } catch (error) {
          if (error instanceof Error) {
            loggingStore.log(
              MESSAGE_TYPES.ERROR,
              `UtilityHandler: Failed to add button ${error.message}`
            )
          } else {
            loggingStore.log(
              MESSAGE_TYPES.ERROR,
              `UtilityHandler: Failed to add button ${String(error)}`
            )
          }
          return
        }
      }
      case 'delete': {
        const { action, key, mode, profile } = data.payload
        if (!key || !mode) {
          loggingStore.log(
            MESSAGE_TYPES.ERROR,
            `Missing required button data: ${JSON.stringify({
              key: !!key,
              mode: !!mode
            })}`
          )
          return
        }
        return await keyMapStore.removeButton({ action, key, mode, profile })
      }
      default:
        return
    }
  },
  keys: async (data) => {
    switch (data.request) {
      case 'get':
        return await keyMapStore.getKeys()
      case 'set':
        return await keyMapStore.addKey(data.payload)
      case 'delete':
        return await keyMapStore.removeKey(data.payload)
      default:
        return
    }
  },
  profiles: async (data) => {
    switch (data.request) {
      case 'get':
        if (typeof data.payload === 'string') {
          return await keyMapStore.getProfile(data.payload)
        } else {
          return await keyMapStore.getProfiles()
        }
      case 'set':
        if (data.payload) {
          return await keyMapStore.addProfile(data.payload)
        } else {
          loggingStore.log(MESSAGE_TYPES.ERROR, 'UtilityHandler: Missing profile name!')
          console.log(data)
          return
        }
      case 'delete':
        return await keyMapStore.removeProfile(data.payload)
      default:
        return
    }
  },
  map: async (data) => {
    switch (data.request) {
      case 'get':
        return await keyMapStore.getCurrentProfile()
      case 'set':
        console.log('Setting current profile to', data.payload)
        return await keyMapStore.setCurrentProfile(data.payload)
      default:
        return
    }
  },
  run: async (data) => {
    const action = data.payload as Action
    if (action.source !== 'server' && action.enabled) {
      return await keyMapStore.runAction(action)
    } else {
      loggingStore.log(MESSAGE_TYPES.ERROR, 'UtilityHandler: Action not enabled or does not exist!')
    }
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
      loggingStore.log(MESSAGE_TYPES.LOGGING, '[firewall] Setting up firewall')
      try {
        await setupFirewall(payload.devicePort, replyFn)
      } catch (firewallError) {
        if (!(firewallError instanceof Error)) return

        loggingStore.log(MESSAGE_TYPES.ERROR, `FIREWALL: ${firewallError.message}`)
        replyFn('logging', {
          status: false,
          data: 'Error in firewall',
          error: firewallError.message,
          final: true
        })
        return
      }
    } else {
      loggingStore.log(MESSAGE_TYPES.ERROR, '[firewall] No settings found!')
      replyFn('logging', {
        status: false,
        data: 'Error in firewall',
        error: 'No settings found!',
        final: true
      })
    }
  } catch (error) {
    loggingStore.log(MESSAGE_TYPES.ERROR, 'SERVER: [firewall] Error saving manifest' + error)
    console.error('[Firewall] Error setting client manifest:', error)
    if (error instanceof Error) {
      replyFn('logging', { status: false, data: 'Unfinished', error: error.message, final: true })
    }
  }
}
