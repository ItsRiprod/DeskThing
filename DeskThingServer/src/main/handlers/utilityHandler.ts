console.log('[Utility Handler] Starting')
import { LOGGING_LEVELS } from '@DeskThing/types'
import {
  ReplyFn,
  UtilityIPCData,
  Client,
  Settings,
  UtilityHandlerReturnType,
  UTILITY_TYPES
} from '@shared/types'
import Logger from '@server/utils/logger'
import path from 'path'
import { shell, app, dialog } from 'electron'
import { setupFirewall } from './firewallHandler'
import {
  checkForUpdates,
  quitAndInstall,
  startDownload
} from '@server/services/updater/autoUpdater'
import { FeedbackService } from '@server/services/feedbackService'
import { storeProvider } from '@server/stores/storeProvider'

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
 * Each function is responsible for handling a specific request type and returning the appropriate data or performing the requested action.
 *
 */
export const utilityHandler: {
  [K in UTILITY_TYPES]: (
    data: Extract<UtilityIPCData, { type: K }>,
    replyFn: ReplyFn
  ) => Promise<UtilityHandlerReturnType<K> | undefined>
} = {
  ping: async () => {
    Logger.info('Pinged! pong')
    return ''
  },
  [UTILITY_TYPES.ZIP]: async (): Promise<string | undefined> => {
    return await selectZipFile()
  },
  [UTILITY_TYPES.CONNECTIONS]: async (data, replyFn) => {
    switch (data.request) {
      case 'get':
        return await getConnection(replyFn)
      case 'delete':
        await deleteConnection(data.payload, replyFn)
        return
      default:
        return
    }
  },
  [UTILITY_TYPES.DEVICES]: async () => {
    const connectionStore = storeProvider.getStore('connectionsStore')
    return await connectionStore.getDevices()
  },
  [UTILITY_TYPES.SETTINGS]: async (data) => {
    const settingsStore = storeProvider.getStore('settingsStore')
    switch (data.request) {
      case 'get':
        return await settingsStore.getSettings()
      case 'set':
        await settingsStore.saveSettings(data.payload)
        return
    }
  },
  [UTILITY_TYPES.GITHUB]: async (data) => {
    const githubStore = storeProvider.getStore('githubStore')
    switch (data.request) {
      case 'refreshApp':
        try {
          await githubStore.addAppRepository(data.payload)
          return
        } catch (error) {
          Logger.error('Unable to refresh repository!', {
            error: error as Error,
            function: 'github.refreshApp',
            source: 'utilityHandler'
          })
          return
        }
      case 'refreshApps':
        try {
          await githubStore.refreshData(true)
          return
        } catch (error) {
          Logger.error('Unable to refresh repositories!', {
            error: error as Error,
            function: 'github.refreshApps',
            source: 'utilityHandler'
          })
          return
        }
      case 'getApps':
        try {
          return await githubStore.getAppReleases()
        } catch (error) {
          Logger.error('Unable to get repositories!', {
            error: error as Error,
            function: 'github.getApps',
            source: 'utilityHandler'
          })
          return
        }
      case 'getAppReferences':
        try {
          return await githubStore.getAppReferences()
        } catch (error) {
          Logger.error('Unable to get app references!', {
            error: error as Error,
            function: 'github.getAppReferences',
            source: 'utilityHandler'
          })
          return
        }
      case 'addAppRepo':
        try {
          return await githubStore.addAppRepository(data.payload)
        } catch (error) {
          Logger.error('Unable to add repository!', {
            error: error as Error,
            function: 'github.addAppRepo',
            source: 'utilityHandler'
          })
          return
        }
      case 'removeAppRepo':
        try {
          return await githubStore.removeAppRelease(data.payload)
        } catch (error) {
          Logger.error('Unable to remove repository!', {
            error: error as Error,
            function: 'github.removeAppRepo',
            source: 'utilityHandler'
          })
          return
        }
      case 'getClients':
        try {
          return githubStore.getClientReleases()
        } catch (error) {
          Logger.error('Unable to get client releases!', {
            error: error as Error,
            function: 'github.getClients',
            source: 'utilityHandler'
          })
          return
        }
      default:
        return
    }
  },
  [UTILITY_TYPES.LOGS]: async () => {
    return await Logger.getLogs()
  },
  [UTILITY_TYPES.SHUTDOWN]: async () => {
    app.quit()
  },
  [UTILITY_TYPES.OPEN_LOG_FOLDER]: async () => {
    const logPath = path.join(app.getPath('userData'))
    await shell.openPath(logPath)
  },
  [UTILITY_TYPES.REFRESH_FIREWALL]: async (_data, replyFn) => {
    refreshFirewall(replyFn)
  },

  [UTILITY_TYPES.RESTART_SERVER]: async (_data, replyFn) => {
    const platformStore = storeProvider.getStore('platformStore')
    replyFn('logging', { status: true, data: 'Restarting server...', final: false })
    await platformStore.restartPlatform('websocket')
    replyFn('logging', { status: true, data: 'Server Restarted', final: true })
  },
  [UTILITY_TYPES.ACTIONS]: async (data) => {
    const mappingStore = storeProvider.getStore('mappingStore')
    switch (data.request) {
      case 'get':
        return await mappingStore.getActions()
      case 'set':
        return await mappingStore.addAction(data.payload)
      case 'delete':
        return await mappingStore.removeAction(data.payload)
      default:
        return
    }
  },
  [UTILITY_TYPES.BUTTONS]: async (data) => {
    const mappingStore = storeProvider.getStore('mappingStore')
    switch (data.request) {
      case 'set': {
        const { action, key, mode, profile } = data.payload
        if (!action || !key || !mode) {
          Logger.log(
            LOGGING_LEVELS.ERROR,
            `Missing required button data: ${JSON.stringify({
              action: !!action,
              key: !!key,
              mode: !!mode
            })}`
          )
          return
        }
        try {
          return await mappingStore.addButton({ action, key, mode, profile })
        } catch (error) {
          if (error instanceof Error) {
            Logger.log(
              LOGGING_LEVELS.ERROR,
              `UtilityHandler: Failed to add button ${error.message}`
            )
          } else {
            Logger.log(
              LOGGING_LEVELS.ERROR,
              `UtilityHandler: Failed to add button ${String(error)}`
            )
          }
          return
        }
      }
      case 'delete': {
        const { action, key, mode, profile } = data.payload
        if (!key || !mode) {
          Logger.log(
            LOGGING_LEVELS.ERROR,
            `Missing required button data: ${JSON.stringify({
              key: !!key,
              mode: !!mode
            })}`
          )
          return
        }
        return await mappingStore.removeButton({ action, key, mode, profile })
      }
      default:
        return
    }
  },
  [UTILITY_TYPES.KEYS]: async (data) => {
    const mappingStore = storeProvider.getStore('mappingStore')
    switch (data.request) {
      case 'get':
        return await mappingStore.getKeys()
      case 'set':
        await mappingStore.addKey(data.payload)
        return
      case 'delete':
        await mappingStore.removeKey(data.payload)
        return
      default:
        return
    }
  },
  [UTILITY_TYPES.PROFILES]: async (data) => {
    const mappingStore = storeProvider.getStore('mappingStore')
    if (data.type != 'profiles') return
    switch (data.request) {
      case 'get':
        if (typeof data.payload === 'string') {
          return await mappingStore.getProfile(data.payload)
        } else {
          return await mappingStore.getProfiles()
        }
      case 'set':
        if (data.payload) {
          await mappingStore.addProfile(data.payload)
          return
        } else {
          Logger.log(LOGGING_LEVELS.ERROR, 'UtilityHandler: Missing profile name!')
          return
        }
      case 'delete':
        await mappingStore.removeProfile(data.payload)
        return
    }
  },
  [UTILITY_TYPES.MAP]: async (data) => {
    const mappingStore = storeProvider.getStore('mappingStore')
    switch (data.request) {
      case 'get':
        return await mappingStore.getCurrentProfile()
      case 'set':
        console.log('Setting current profile to', data.payload)
        await mappingStore.setCurrentProfile(data.payload)
        return
      default:
        return
    }
  },
  [UTILITY_TYPES.RUN]: async (data) => {
    const mappingStore = storeProvider.getStore('mappingStore')
    if (data.payload.source !== 'server' && data.payload.enabled) {
      return await mappingStore.runAction(data.payload)
    } else {
      Logger.log(LOGGING_LEVELS.ERROR, 'UtilityHandler: Action not enabled or does not exist!')
    }
  },

  // Tasks
  [UTILITY_TYPES.TASK]: async (data) => {
    if (data.type != 'task') return
    const taskStore = storeProvider.getStore('taskStore')

    Logger.debug(`Handling task data with request: ${data.request}`, {
      source: 'utilityHandler',
      function: 'task'
    })

    switch (data.request) {
      case 'get':
        return await taskStore.getTaskList()
      case 'stop':
        await taskStore.stopTask(data.payload.source, data.payload.taskId)
        return
      case 'complete':
        await taskStore.completeStep(data.payload.source, data.payload.taskId, data.payload.stepId)
        return
      case 'start':
        await taskStore.startTask(data.payload.source, data.payload.taskId)
        return
      case 'pause':
        await taskStore.pauseTask()
        return
      case 'restart':
        await taskStore.restartTask(data.payload.source, data.payload.taskId)
        return
      case 'complete_task':
        await taskStore.completeTask(data.payload.source, data.payload.taskId)
        return
      case 'next':
        await taskStore.nextStep(data.payload.source, data.payload.taskId)
        return
      case 'previous':
        await taskStore.prevStep(data.payload.source, data.payload.taskId)
        return
      case 'update-task':
        await taskStore.updateTask(data.payload.source, data.payload.newTask)
        return
      case 'update-step':
        await taskStore.updateStep(data.payload.source, data.payload.taskId, data.payload.newStep)
        return
    }
  },
  // Updates
  [UTILITY_TYPES.UPDATE]: async (data) => {
    if (data.type != 'update') return
    switch (data.request) {
      case 'check': // Check for update
        return await checkForUpdates()
      case 'download': // Start Download
        return startDownload()
      case 'restart': // Start Download
        return quitAndInstall()
      default:
        return
    }
  },
  [UTILITY_TYPES.FEEDBACK]: async (data) => {
    if (data.type != 'feedback') return
    switch (data.request) {
      case 'set':
        return await FeedbackService.sendFeedback(data.payload)
      case 'get':
        return await FeedbackService.collectSystemInfo()
    }
  }
}
/**
 * Get the list of currently connected clients
 * @param replyFn
 * @returns
 */
const getConnection = async (replyFn: ReplyFn): Promise<Client[]> => {
  const connectionStore = storeProvider.getStore('connectionsStore')
  Logger.info('Getting clients', {
    source: 'utilityHandler',
    function: 'getConnection'
  })
  const clients = connectionStore.getClients()
  replyFn('connections', { status: true, data: clients.length, final: false })
  replyFn('clients', { status: true, data: clients, final: true })
  return clients
}

const deleteConnection = async (connectionId: string, replyFn: ReplyFn): Promise<boolean> => {
  const connectionStore = storeProvider.getStore('connectionsStore')
  await connectionStore.removeClient(connectionId)
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
  const settingsStore = storeProvider.getStore('settingsStore')
  try {
    replyFn('logging', { status: true, data: 'Refreshing Firewall', final: false })
    const payload = (await settingsStore.getSettings()) as Settings
    if (payload) {
      Logger.info('[firewall] Setting up firewall')
      try {
        await setupFirewall(payload.devicePort, replyFn)
      } catch (firewallError) {
        if (!(firewallError instanceof Error)) return

        Logger.log(LOGGING_LEVELS.ERROR, `FIREWALL: ${firewallError.message}`)
        replyFn('logging', {
          status: false,
          data: 'Error in firewall',
          error: firewallError.message,
          final: true
        })
        return
      }
    } else {
      Logger.log(LOGGING_LEVELS.ERROR, '[firewall] No settings found!')
      replyFn('logging', {
        status: false,
        data: 'Error in firewall',
        error: 'No settings found!',
        final: true
      })
    }
  } catch (error) {
    Logger.log(LOGGING_LEVELS.ERROR, 'SERVER: [firewall] Error saving manifest' + error)
    console.error('[Firewall] Error setting client manifest:', error)
    if (error instanceof Error) {
      replyFn('logging', { status: false, data: 'Unfinished', error: error.message, final: true })
    }
  }
}
