import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {
  Action,
  ActionReference,
  App,
  AppDataInterface,
  AppReturnData,
  AppSettings,
  Button,
  ButtonMapping,
  Client,
  ClientManifest,
  GithubRelease,
  ToAppData,
  IPC_HANDLERS,
  IPCData,
  Key,
  Log,
  Profile,
  Settings,
  SocketData,
  AppManifest,
  Step,
  TaskList,
  Task
} from '@shared/types'

// Custom APIs for renderer
const api = {
  // Updated Commands

  // Apps

  getApps: async (): Promise<App[]> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: 'app',
      request: 'get',
      payload: null
    }),

  getAppData: async (appId: string): Promise<AppDataInterface | null> =>
    await sendCommand<AppDataInterface | null>('APPS', {
      kind: 'app',
      type: 'data',
      request: 'get',
      payload: appId
    }),

  setAppData: async (appId: string, data: Record<string, string>): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: 'data',
      request: 'set',
      payload: { appId, data }
    }),

  getAppSettings: async (appId: string): Promise<AppSettings | null> =>
    await sendCommand<AppSettings | null>('APPS', {
      kind: 'app',
      type: 'settings',
      request: 'get',
      payload: appId
    }),

  setAppSettings: async (appId: string, settings: AppSettings): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: 'settings',
      request: 'set',
      payload: { appId, settings }
    }),

  stopApp: async (appId: string): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: 'stop',
      request: 'set',
      payload: appId
    }),

  disableApp: async (appId: string): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: 'disable',
      request: 'set',
      payload: appId
    }),

  enableApp: async (appId: string): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: 'enable',
      request: 'set',
      payload: appId
    }),

  runApp: async (appId: string): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: 'run',
      request: 'set',
      payload: appId
    }),

  purgeApp: async (appId: string): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: 'purge',
      request: 'set',
      payload: appId
    }),

  handleAppZip: async (path: string): Promise<AppReturnData | null> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: 'zip',
      request: 'set',
      payload: path
    }),

  handleAppUrl: async (url: string): Promise<AppReturnData | null> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: 'url',
      request: 'set',
      payload: url
    }),

  app: {
    add: async (appPath: string): Promise<AppManifest | void> =>
      await sendCommand('APPS', {
        kind: 'app',
        type: 'add',
        request: 'set',
        payload: appPath
      }),
    runStaged: async (appId: string, overwrite: boolean): Promise<void> =>
      await sendCommand('APPS', {
        kind: 'app',
        type: 'staged',
        request: 'set',
        payload: { appId, overwrite }
      })
  },

  handleResponseToUserData: async (requestId: string, payload: ToAppData): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: 'user-data-response',
      request: 'set',
      payload: { requestId, response: payload }
    }),

  handleDeAppZip: async (path: string): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: 'dev-add-app',
      request: 'set',
      payload: { appPath: path }
    }),

  sendDataToApp: async (data: SocketData): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: 'send-to-app',
      request: 'set',
      payload: data
    }),

  orderApps: async (data: string[]): Promise<void> =>
    await sendCommand('APPS', {
      kind: 'app',
      type: 'app-order',
      request: 'set',
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
      type: 'ping',
      request: 'set',
      payload: undefined
    }),

  getConnections: async (): Promise<Client[]> =>
    await sendCommand<Client[]>('UTILITY', {
      kind: 'utility',
      type: 'connections',
      request: 'get',
      payload: undefined
    }),

  getDevices: async (): Promise<string[]> =>
    await sendCommand<string[]>('UTILITY', {
      kind: 'utility',
      type: 'devices',
      request: 'get',
      payload: undefined
    }),

  disconnectClient: async (connectionId: string): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'connections',
      request: 'delete',
      payload: connectionId
    }),

  saveSettings: async (settings: Settings): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'settings',
      request: 'set',
      payload: settings
    }),

  getSettings: async (): Promise<Settings> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'settings',
      request: 'get',
      payload: undefined
    }),

  fetchGithub: async (url: string): Promise<GithubRelease[]> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'github',
      request: 'get',
      payload: url
    }),

  getLogs: async (): Promise<Log[]> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'logs',
      request: 'get',
      payload: undefined
    }),

  shutdown: async (): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'shutdown',
      request: 'set',
      payload: undefined
    }),

  openLogsFolder: async (): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'open-log-folder',
      request: 'set',
      payload: undefined
    }),

  selectZipFile: async (): Promise<string | undefined> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'zip',
      request: 'get',
      payload: undefined
    }),

  refreshFirewall: async (): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'refresh-firewall',
      request: 'set',
      payload: undefined
    }),

  restartServer: async (): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'restart-server',
      request: 'set',
      payload: undefined
    }),

  getActions: async (): Promise<Action[]> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'actions',
      request: 'get',
      payload: undefined
    }),

  addAction: async (action: Action): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'actions',
      request: 'set',
      payload: action
    }),

  deleteAction: async (actionId: string): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'actions',
      request: 'delete',
      payload: actionId
    }),

  addButton: async (button: Button): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'buttons',
      request: 'set',
      payload: button
    }),

  deleteButton: async (button: Exclude<'action', Button>): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'buttons',
      request: 'delete',
      payload: button
    }),

  getKeys: async (): Promise<Key[]> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'keys',
      request: 'get',
      payload: undefined
    }),

  addKey: async (key: Key): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'keys',
      request: 'set',
      payload: key
    }),

  deleteKey: async (keyId: string): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'keys',
      request: 'delete',
      payload: keyId
    }),

  getProfiles: async (): Promise<Profile[]> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'profiles',
      request: 'get',
      payload: undefined
    }),

  getProfile: async (profileName: string): Promise<ButtonMapping> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'profiles',
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
      type: 'profiles',
      request: 'set',
      payload: profile
    }),

  addProfile: async (profile: Profile): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'profiles',
      request: 'set',
      payload: profile
    }),

  deleteProfile: async (profileName: string): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'profiles',
      request: 'delete',
      payload: profileName
    }),

  getCurrentProfile: async (): Promise<Profile> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'map',
      request: 'get',
      payload: undefined
    }),

  setCurrentProfile: async (profile: Profile): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'map',
      request: 'set',
      payload: profile
    }),

  runAction: async (action: Action | ActionReference): Promise<void> =>
    await sendCommand('UTILITY', {
      kind: 'utility',
      type: 'run',
      request: 'set',
      payload: action
    }),

  // Tasks
  tasks: {
    getTaskList: async (): Promise<TaskList> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: 'task',
        request: 'get'
      }),

    stopTask: async (taskId: string): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: 'task',
        request: 'stop',
        payload: taskId
      }),

    startTask: async (taskId: string): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: 'task',
        request: 'start',
        payload: taskId
      }),

    completeStep: async (taskId: string, stepId: string): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: 'task',
        request: 'complete',
        payload: [taskId, stepId]
      }),

    completeTask: async (taskId: string): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: 'task',
        request: 'complete_task',
        payload: taskId
      }),

    pauseTask: async (): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: 'task',
        request: 'pause'
      }),

    nextStep: async (taskId: string): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: 'task',
        request: 'next',
        payload: taskId
      }),

    prevStep: async (taskId: string): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: 'task',
        request: 'previous',
        payload: taskId
      }),

    restartTask: async (taskId: string): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: 'task',
        request: 'restart',
        payload: taskId
      }),

    updateStep: async (taskId: string, step: Partial<Step>): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: 'task',
        request: 'update-step',
        payload: [taskId, step]
      }),

    updateTask: async (task: Partial<Task>): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: 'task',
        request: 'update-task',
        payload: task
      })
  },
  update: {
    check: async (): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: 'update',
        request: 'check',
        payload: ''
      }),

    download: async (): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: 'update',
        request: 'download',
        payload: ''
      }),

    install: async (): Promise<void> =>
      await sendCommand('UTILITY', {
        kind: 'utility',
        type: 'update',
        request: 'restart',
        payload: ''
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
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = { ...electronAPI, ...api }
}
