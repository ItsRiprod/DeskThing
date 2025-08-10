import { LOGGING_LEVELS, Client, PlatformIDs } from '@deskthing/types'
import { UtilityIPCData, UtilityHandlerReturnType, IPC_UTILITY_TYPES } from '@shared/types'
import Logger from '@server/utils/logger'
import path from 'path'
import { shell, app, dialog } from 'electron'
import { setupFirewall } from '../../handlers/firewallHandler'
import { storeProvider } from '@server/stores/storeProvider'
import { progressBus } from '@server/services/events/progressBus'
import { ProgressChannel } from '@shared/types'

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
  [K in IPC_UTILITY_TYPES]: (
    data: Extract<UtilityIPCData, { type: K }>
  ) => Promise<UtilityHandlerReturnType<K>>
} = {
  ping: async () => {
    Logger.info('Pinged! pong')
    return ''
  },
  [IPC_UTILITY_TYPES.ZIP]: async (): Promise<string | undefined> => {
    return await selectZipFile()
  },
  [IPC_UTILITY_TYPES.CONNECTIONS]: async (data) => {
    switch (data.request) {
      case 'get':
        return await getConnection()
      case 'delete':
        return await deleteConnection(data.payload)
    }
  },
  [IPC_UTILITY_TYPES.SETTINGS]: async (data) => {
    const settingsStore = await storeProvider.getStore('settingsStore')
    switch (data.request) {
      case 'get':
        return await settingsStore.getSettings()
      case 'set':
        await settingsStore.saveSettings(data.payload)
        return
    }
  },
  [IPC_UTILITY_TYPES.FLAG]: async (data) => {
    const settingsStore = await storeProvider.getStore('settingsStore')
    switch (data.request) {
      case 'get':
        return await settingsStore.getFlag(data.payload)
      case 'set':
        return await settingsStore.setFlag(data.payload.flagId, data.payload.flagState)
      case 'toggle':
        return await settingsStore.toggleFlag(data.payload)
    }
  },
  [IPC_UTILITY_TYPES.NOTIFICATION]: async (data) => {
    const notificationStore = await storeProvider.getStore('notificationStore')

    switch (data.request) {
      case 'get':
        return await notificationStore.getNotificationList()
      case 'acknowledge':
        return await notificationStore.acknowledgeNotification(data.payload)
    }
  },
  [IPC_UTILITY_TYPES.SUPPORTERS]: async (data) => {
    const supporterStore = await storeProvider.getStore('supporterStore')
    switch (data.request) {
      case 'get':
        return await supporterStore.fetchSupporters(data.payload)
    }
  },
  [IPC_UTILITY_TYPES.OPEN_DIALOG]: async (data) => {
    switch (data.type) {
      case IPC_UTILITY_TYPES.OPEN_DIALOG:
        return await dialog.showOpenDialog(data.payload)
    }
  },
  [IPC_UTILITY_TYPES.DEVMODE]: async (data) => {
    switch (data.request) {
      case 'open_terminal':
        try {
          const { relaunchWithTerminal } = await import('@server/system/terminal')
          await relaunchWithTerminal()
          return true
        } catch {
          return false
        }
    }
  },
  // [IPC_UTILITY_TYPES.GITHUB]: async (data) => {
  //   const releaseStore = await storeProvider.getStore('releaseStore')
  //   switch (data.request) {
  //     case 'refreshApp':
  //       try {
  //         await releaseStore.addAppRepository(data.payload)
  //         return
  //       } catch (error) {
  //         Logger.error('Unable to refresh repository!', {
  //           error: error as Error,
  //           function: 'github.refreshApp',
  //           source: 'utilityHandler'
  //         })
  //         return
  //       }
  //     case 'refreshApps':
  //       try {
  //         await releaseStore.refreshData(true)
  //         return
  //       } catch (error) {
  //         Logger.error('Unable to refresh repositories!', {
  //           error: error as Error,
  //           function: 'github.refreshApps',
  //           source: 'utilityHandler'
  //         })
  //         return
  //       }
  //     case 'getApps':
  //       try {
  //         return await releaseStore.getAppReleases()
  //       } catch (error) {
  //         Logger.error('Unable to get repositories!', {
  //           error: error as Error,
  //           function: 'github.getApps',
  //           source: 'utilityHandler'
  //         })
  //         return
  //       }
  //     case 'getAppReferences':
  //       try {
  //         return await releaseStore.getAppReferences()
  //       } catch (error) {
  //         Logger.error('Unable to get app references!', {
  //           error: error as Error,
  //           function: 'github.getAppReferences',
  //           source: 'utilityHandler'
  //         })
  //         return
  //       }
  //     case 'addAppRepo':
  //       try {
  //         return await releaseStore.addAppRepository(data.payload)
  //       } catch (error) {
  //         Logger.error('Unable to add repository!', {
  //           error: error as Error,
  //           function: 'github.addAppRepo',
  //           source: 'utilityHandler'
  //         })
  //         return
  //       }
  //     case 'removeAppRepo':
  //       try {
  //         return await releaseStore.removeAppRelease(data.payload)
  //       } catch (error) {
  //         Logger.error('Unable to remove repository!', {
  //           error: error as Error,
  //           function: 'github.removeAppRepo',
  //           source: 'utilityHandler'
  //         })
  //         return
  //       }
  //     case 'getClients':
  //       try {
  //         return releaseStore.getClientReleases()
  //       } catch (error) {
  //         Logger.error('Unable to get client releases!', {
  //           error: error as Error,
  //           function: 'github.getClients',
  //           source: 'utilityHandler'
  //         })
  //         return
  //       }
  //     default:
  //       return
  //   }
  // },
  [IPC_UTILITY_TYPES.LOGS]: async () => {
    return await Logger.getLogs()
  },
  [IPC_UTILITY_TYPES.SHUTDOWN]: async () => {
    app.quit()
  },
  [IPC_UTILITY_TYPES.OPEN_LOG_FOLDER]: async () => {
    const logPath = path.join(app.getPath('userData'))
    await shell.openPath(logPath)
  },
  [IPC_UTILITY_TYPES.REFRESH_FIREWALL]: async () => {
    const settingsStore = await storeProvider.getStore('settingsStore')
    try {
      progressBus.startOperation(
        ProgressChannel.IPC_UTILITY,
        'refresh-firewall',
        'Refreshing Firewall',
        [
          {
            channel: ProgressChannel.FIREWALL,
            weight: 80
          }
        ]
      )
      const payload = await settingsStore.getSettings()
      if (payload) {
        Logger.debug('[firewall] Setting up firewall')
        try {
          await setupFirewall(payload.device_devicePort)
        } catch (firewallError) {
          if (!(firewallError instanceof Error)) return

          Logger.log(LOGGING_LEVELS.ERROR, `FIREWALL: ${firewallError.message}`)
          progressBus.error(ProgressChannel.IPC_UTILITY, 'refresh-firewall', 'Error in firewall')
          return
        }
      } else {
        Logger.log(LOGGING_LEVELS.ERROR, '[firewall] No settings found!')
        progressBus.error(ProgressChannel.IPC_UTILITY, 'refresh-firewall', 'No settings found!')
        return
      }
    } catch (error) {
      Logger.log(LOGGING_LEVELS.ERROR, 'SERVER: [firewall] Error saving manifest', {
        error: error as Error,
        function: 'utilityHandler',
        source: 'refresh-firewall'
      })
      progressBus.error(
        ProgressChannel.IPC_UTILITY,
        'refresh-firewall',
        error instanceof Error ? error.message : String(error)
      )
    }
  },

  [IPC_UTILITY_TYPES.RESTART_SERVER]: async () => {
    const platformStore = await storeProvider.getStore('platformStore')
    progressBus.start(ProgressChannel.IPC_UTILITY, 'restart', 'Restarting server...')
    await platformStore.restartPlatform(PlatformIDs.WEBSOCKET)
    progressBus.complete(ProgressChannel.IPC_UTILITY, 'restart', 'Server Restarted')
  },
  [IPC_UTILITY_TYPES.ACTIONS]: async (data) => {
    const mappingStore = await storeProvider.getStore('mappingStore')
    switch (data.request) {
      case 'get':
        return await mappingStore.getActions()
      case 'set':
        return await mappingStore.addAction(data.payload)
      case 'delete':
        return await mappingStore.removeAction(data.payload)
    }
  },
  [IPC_UTILITY_TYPES.BUTTONS]: async (data) => {
    const mappingStore = await storeProvider.getStore('mappingStore')
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
  [IPC_UTILITY_TYPES.KEYS]: async (data) => {
    const mappingStore = await storeProvider.getStore('mappingStore')
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
  [IPC_UTILITY_TYPES.PROFILES]: async (data) => {
    const mappingStore = await storeProvider.getStore('mappingStore')
    if (data.type != 'profiles') return
    switch (data.request) {
      case 'get':
        return await mappingStore.getProfile(data.payload)
      case 'getAll':
        return await mappingStore.getProfiles()
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
  [IPC_UTILITY_TYPES.MAP]: async (data) => {
    const mappingStore = await storeProvider.getStore('mappingStore')
    switch (data.request) {
      case 'get':
        return await mappingStore.getCurrentProfile()
      case 'set':
        console.log('Setting current profile to', data.payload)
        await mappingStore.setCurrentProfile(data.payload)
        return
    }
  },
  [IPC_UTILITY_TYPES.RUN]: async (data) => {
    const mappingStore = await storeProvider.getStore('mappingStore')
    if (data.payload.source !== 'server' && data.payload.enabled) {
      return await mappingStore.runAction(data.payload)
    } else {
      Logger.log(LOGGING_LEVELS.ERROR, 'UtilityHandler: Action not enabled or does not exist!')
    }
  }

  // Tasks
  // [IPC_UTILITY_TYPES.TASK]: async (data) => {
  //   const taskStore = await storeProvider.getStore('taskStore')

  //   Logger.debug(`Handling task data with request: ${data.request}`, {
  //     source: 'utilityHandler',
  //     function: 'task'
  //   })

  //   switch (data.request) {
  //     case 'get':
  //       return await taskStore.getTaskList()
  //     case 'stop':
  //       await taskStore.stopTask(data.payload.source, data.payload.taskId)
  //       return
  //     case 'complete':
  //       await taskStore.completeStep(data.payload.source, data.payload.taskId, data.payload.stepId)
  //       return
  //     case 'start':
  //       await taskStore.startTask(data.payload.source, data.payload.taskId)
  //       return
  //     case 'pause':
  //       await taskStore.pauseTask()
  //       return
  //     case 'restart':
  //       await taskStore.restartTask(data.payload.source, data.payload.taskId).catch((error) => {
  //         Logger.error(`Error restarting task: ${error}`, {
  //           source: 'utilityHandler',
  //           function: 'task',
  //           error: error as Error
  //         })
  //         return
  //       })
  //       return
  //     case 'complete_task':
  //       await taskStore.completeTask(data.payload.source, data.payload.taskId)
  //       return
  //     case 'next':
  //       await taskStore.nextStep(data.payload.source, data.payload.taskId)
  //       return
  //     case 'previous':
  //       await taskStore.prevStep(data.payload.source, data.payload.taskId)
  //       return
  //     case 'update-task':
  //       await taskStore.updateTask(data.payload.source, data.payload.newTask)
  //       return
  //     case 'update-step':
  //       await taskStore.updateStep(data.payload.source, data.payload.taskId, data.payload.newStep)
  //       return
  //   }
  // },
  // Updates
  // [IPC_UTILITY_TYPES.UPDATE]: async (data) => {
  //   if (data.type != 'update') return
  //   switch (data.request) {
  //     case 'check': // Check for update
  //       return await checkForUpdates()
  //     case 'download': // Start Download
  //       return startDownload()
  //     case 'restart': // Start Download
  //       return quitAndInstall()
  //     default:
  //       return
  //   }
  // },
  // [IPC_UTILITY_TYPES.FEEDBACK]: async (data) => {
  //   if (data.type != 'feedback') return
  //   switch (data.request) {
  //     case 'set':
  //       return await FeedbackService.sendFeedback(data.payload)
  //     case 'get':
  //       return await FeedbackService.collectSystemInfo()
  //   }
  // }
}

const getConnection = async (): Promise<Client[]> => {
  const platformStore = await storeProvider.getStore('platformStore')
  progressBus.start(ProgressChannel.IPC_UTILITY, 'Get Connections', 'Getting connections')
  Logger.debug('Getting clients', {
    source: 'utilityHandler',
    function: 'getConnection'
  })
  const clients = platformStore.getClients()
  progressBus.complete(ProgressChannel.IPC_UTILITY, `Found ${clients.length} connections`)
  return clients
}

const deleteConnection = async (clientId: string): Promise<boolean> => {
  const connectionStore = await storeProvider.getStore('platformStore')
  progressBus.start(ProgressChannel.IPC_UTILITY, 'delete-connection', 'Removing connection')
  const res = await connectionStore.sendPlatformData({
    platform: PlatformIDs.WEBSOCKET,
    type: 'disconnect',
    request: 'client',
    clientId: clientId
  })
  progressBus.complete(ProgressChannel.IPC_UTILITY, 'Connection removed')
  return res || false
}

const selectZipFile = async (): Promise<string | undefined> => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Zip Files', extensions: ['zip'] }]
  })
  if (canceled) return
  return filePaths[0]
}
