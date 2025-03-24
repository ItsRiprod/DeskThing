import { contextBridge, ipcRenderer, Task } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {
  App,
  Action,
  ActionReference,
  AppDataInterface,
  AppSettings,
  ClientManifest,
  Key,
  SocketData,
  Step,
  TaskList,
  AppReleaseCommunity,
  AppReleaseMeta,
  AppReleaseSingleMeta,
  Profile,
  Client,
  Button,
  ButtonMapping,
  ClientReleaseMeta,
  DeskThingToAppData
} from '@DeskThing/types'
import {
  Log,
  AppReturnData,
  FeedbackReport,
  IPC_HANDLERS,
  Settings,
  IPCData,
  StagedAppManifest,
  SystemInfo,
  UTILITY_TYPES,
  APP_TYPES,
  ADBClient
} from '@shared/types'
import { platform } from 'os'

console.log('In the preload')

// Custom APIs for renderer
const api = {
  // Updated Commands

  // Apps

  getApps: async (): Promise<App[]> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: APP_TYPES.APP,
      request: 'get'
    }),

  getAppData: async (appId: string): Promise<AppDataInterface | null> =>
    await sendCommand<AppDataInterface | null>('APPS', {
      kind: 'app',
      type: APP_TYPES.DATA,
      request: 'get',
      payload: appId
    }),

  setAppData: async (appId: string, data: Record<string, string>): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: APP_TYPES.DATA,
      request: 'set',
      payload: { appId, data }
    }),

  getAppSettings: async (appId: string): Promise<AppSettings | null> =>
    await sendCommand<AppSettings | null>('APPS', {
      kind: 'app',
      type: APP_TYPES.SETTINGS,
      request: 'get',
      payload: appId
    }),

  setAppSettings: async (appId: string, settings: AppSettings): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: APP_TYPES.SETTINGS,
      request: 'set',
      payload: { appId, settings }
    }),

  stopApp: async (appId: string): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: APP_TYPES.STOP,
      payload: appId
    }),

  disableApp: async (appId: string): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: APP_TYPES.DISABLE,
      payload: appId
    }),

  enableApp: async (appId: string): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: APP_TYPES.ENABLE,
      payload: appId
    }),

  runApp: async (appId: string): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: APP_TYPES.RUN,
      payload: appId
    }),

  purgeApp: async (appId: string): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: APP_TYPES.PURGE,
      payload: appId
    }),

  handleAppZip: async (path: string): Promise<AppReturnData | null> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: APP_TYPES.ZIP,
      payload: path
    }),

  handleAppUrl: async (url: string): Promise<AppReturnData | null> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: APP_TYPES.URL,
      payload: url
    }),

  app: {
    add: async ({
      appPath,
      releaseMeta
    }: {
      appPath?: string
      releaseMeta?: AppReleaseSingleMeta
    }): Promise<StagedAppManifest | void> =>
      await sendCommand('APPS', {
        kind: 'app',
        type: APP_TYPES.ADD,
        payload: { filePath: appPath, meta: releaseMeta }
      }),
    getIcon: async (appId: string, icon?: string): Promise<string | null> =>
      await sendCommand('APPS', {
        kind: 'app',
        type: APP_TYPES.ICON,
        payload: { appId, icon }
      }),
    runStaged: async (appId: string, overwrite: boolean): Promise<void> =>
      await sendCommand('APPS', {
        kind: 'app',
        type: APP_TYPES.STAGED,
        payload: { appId, overwrite }
      })
  },

  handleResponseToUserData: async (requestId: string, payload: DeskThingToAppData): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: APP_TYPES.USER_DATA_RESPONSE,
      payload: { requestId, response: payload }
    }),

  handleDeAppZip: async (path: string): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: APP_TYPES.DEV_ADD_APP,
      payload: { appPath: path }
    }),

  sendDataToApp: async (data: DeskThingToAppData & { app: string }): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: APP_TYPES.SEND_TO_APP,
      payload: data
    }),

  orderApps: async (data: string[]): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: APP_TYPES.APP_ORDER,
      payload: data
    }),
  // Clients

  pingClient: async (clientId: string): Promise<string | null> =>
    await sendCommand('CLIENT', {
      kind: 'client',
      type: 'pingClient',
      request: 'set',
      payload: clientId
    }),

  handleClientZip: async (path: string): Promise<void> =>
    await sendCommand('CLIENT', {
      kind: 'client',
      type: 'zip',
      request: 'set',
      payload: path
    }),

  handleClientURL: async (url: string): Promise<void> =>
    await sendCommand('CLIENT', {
      kind: 'client',
      type: 'url',
      request: 'set',
      payload: url
    }),

  handleClientADB: async (command: string): Promise<string> =>
    await sendCommand('CLIENT', {
      kind: 'client',
      type: 'adb',
      request: 'set',
      payload: command
    }),

  configureDevice: async (deviceId: string): Promise<void> =>
    await sendCommand('CLIENT', {
      kind: 'client',
      type: 'configure',
      request: 'set',
      payload: deviceId
    }),

  getClientManifest: async (): Promise<ClientManifest> =>
    await sendCommand<ClientManifest>('CLIENT', {
      kind: 'client',
      type: 'client-manifest',
      request: 'get',
      payload: undefined
    }),

  updateClientManifest: async (client: Partial<ClientManifest>): Promise<void> =>
    await sendCommand<void>('CLIENT', {
      kind: 'client',
      type: 'client-manifest',
      request: 'set',
      payload: client
    }),

  pushStagedApp: async (clientId: string): Promise<void> =>
    await sendCommand('CLIENT', {
      kind: 'client',
      type: 'push-staged',
      request: 'get',
      payload: clientId
    }),

  pushProxyScript: async (clientId: string): Promise<void> =>
    await sendCommand('CLIENT', {
      kind: 'client',
      type: 'push-proxy-script',
      request: 'set',
      payload: clientId
    }),

  handleClientCommand: async (command: SocketData): Promise<void> =>
    await sendCommand('CLIENT', {
      kind: 'client',
      type: 'run-device-command',
      request: 'set',
      payload: command
    }),

  // Utility

  ping: async (): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.PING
    }),

  // These should be moved from 'utility' to 'client' due to them technically being a client-related function
  getConnections: async (): Promise<Client[]> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.CONNECTIONS,
      request: 'get'
    }),

  getDevices: async (): Promise<ADBClient[]> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.DEVICES
    }),

  disconnectClient: async (connectionId: string): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.CONNECTIONS,
      request: 'delete',
      payload: connectionId
    }),

  saveSettings: async (settings: Settings): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.SETTINGS,
      request: 'set',
      payload: settings
    }),

  getSettings: async (): Promise<Settings> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.SETTINGS,
      request: 'get'
    }),
  github: {
    refreshApp: async (repoUrl: string): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.GITHUB,
        request: 'refreshApp',
        payload: repoUrl
      }),
    refreshApps: async (): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.GITHUB,
        request: 'refreshApps',
        payload: undefined
      }),
    getApps: async (): Promise<AppReleaseMeta[]> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.GITHUB,
        request: 'getApps',
        payload: undefined
      }),
    getAppReferences: async (): Promise<AppReleaseCommunity[]> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.GITHUB,
        request: 'getAppReferences',
        payload: undefined
      }),
    addAppRepo: async (repoUrl: string): Promise<AppReleaseMeta | undefined> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.GITHUB,
        request: 'addAppRepo',
        payload: repoUrl
      }),
    getClients: async (): Promise<ClientReleaseMeta[]> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.GITHUB,
        request: 'getClients',
        payload: undefined
      }),
    removeAppRepo: async (repoUrl: string): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.GITHUB,
        request: 'removeAppRepo',
        payload: repoUrl
      })
  },
  getLogs: async (): Promise<Log[]> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.LOGS
    }),

  shutdown: async (): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.SHUTDOWN
    }),

  openLogsFolder: async (): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.OPEN_LOG_FOLDER
    }),

  selectZipFile: async (): Promise<string | undefined> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.ZIP
    }),

  refreshFirewall: async (): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.REFRESH_FIREWALL
    }),

  restartServer: async (): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.RESTART_SERVER
    }),

  getActions: async (): Promise<Action[]> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.ACTIONS,
      request: 'get'
    }),

  addAction: async (action: Action): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.ACTIONS,
      request: 'set',
      payload: action
    }),

  deleteAction: async (actionId: string): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.ACTIONS,
      request: 'delete',
      payload: actionId
    }),

  addButton: async (button: Button): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.BUTTONS,
      request: 'set',
      payload: button
    }),

  deleteButton: async (button: Exclude<Button, 'action'>): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.BUTTONS,
      request: 'delete',
      payload: button
    }),

  getKeys: async (): Promise<Key[]> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.KEYS,
      request: 'get'
    }),

  addKey: async (key: Key): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.KEYS,
      request: 'set',
      payload: key
    }),

  deleteKey: async (keyId: string): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.KEYS,
      request: 'delete',
      payload: keyId
    }),

  getProfiles: async (): Promise<Profile[]> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.PROFILES,
      request: 'get',
      payload: undefined
    }),

  getProfile: async (profileName: string): Promise<ButtonMapping> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.PROFILES,
      request: 'get',
      payload: profileName
    }),

  getIcon: async (action: Action | ActionReference): Promise<string> =>
    await sendCommand('CLIENT', {
      kind: 'client',
      type: 'icon',
      request: 'get',
      payload: action
    }),

  saveProfile: async (profile: ButtonMapping): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.PROFILES,
      request: 'set',
      payload: profile
    }),

  addProfile: async (profile: Profile): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.PROFILES,
      request: 'set',
      payload: profile
    }),

  deleteProfile: async (profileName: string): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.PROFILES,
      request: 'delete',
      payload: profileName
    }),

  getCurrentProfile: async (): Promise<Profile> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.MAP,
      request: 'get'
    }),

  setCurrentProfile: async (profile: Profile): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.MAP,
      request: 'set',
      payload: profile
    }),

  runAction: async (action: Action | ActionReference): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: UTILITY_TYPES.RUN,
      payload: action
    }),

  // Tasks
  tasks: {
    getTaskList: async (): Promise<TaskList> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.TASK,
        request: 'get'
      }),

    stopTask: async (taskId: string, source = 'server'): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.TASK,
        request: 'stop',
        payload: { taskId, source }
      }),

    startTask: async (taskId: string, source = 'server'): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.TASK,
        request: 'start',
        payload: { taskId, source }
      }),

    completeStep: async (taskId: string, stepId: string, source = 'server'): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.TASK,
        request: 'complete',
        payload: { taskId, stepId, source }
      }),

    completeTask: async (taskId: string, source = 'server'): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.TASK,
        request: 'complete_task',
        payload: { taskId, source }
      }),

    pauseTask: async (): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.TASK,
        request: 'pause'
      }),

    nextStep: async (taskId: string, source = 'server'): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.TASK,
        request: 'next',
        payload: { taskId, source }
      }),

    prevStep: async (taskId: string, source = 'server'): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.TASK,
        request: 'previous',
        payload: { taskId, source }
      }),

    restartTask: async (taskId: string, source = 'server'): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.TASK,
        request: 'restart',
        payload: { taskId, source }
      }),

    updateStep: async (taskId: string, newStep: Partial<Step>, source = 'server'): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.TASK,
        request: 'update-step',
        payload: { taskId, newStep, source }
      }),

    updateTask: async (newTask: Partial<Task>, source = 'server'): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.TASK,
        request: 'update-task',
        payload: { newTask, source }
      })
  },
  update: {
    check: async (): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.UPDATE,
        request: 'check',
        payload: ''
      }),

    download: async (): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.UPDATE,
        request: 'download',
        payload: ''
      }),

    install: async (): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.UPDATE,
        request: 'restart',
        payload: ''
      })
  },
  feedback: {
    submit: async (feedback: FeedbackReport): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.FEEDBACK,
        request: 'set',
        payload: feedback
      }),
    getSysInfo: async (): Promise<SystemInfo> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: UTILITY_TYPES.FEEDBACK,
        request: 'get'
      })
  }
}
const sendCommand = <T>(handler: keyof typeof IPC_HANDLERS, payload: IPCData): Promise<T> =>
  ipcRenderer.invoke(handler, payload)
// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ...electronAPI,
      ...api
    })
    contextBridge.exposeInMainWorld('electronAPI', {
      platform: platform()
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = { ...electronAPI, ...api }
}
