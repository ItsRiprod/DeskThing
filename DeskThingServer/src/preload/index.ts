import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {
  Action,
  ActionReference,
  App,
  AppDataInterface,
  AppReturnData,
  Button,
  ButtonMapping,
  Client,
  ClientManifest,
  GithubRelease,
  IncomingData,
  IPC_HANDLERS,
  IPCData,
  Key,
  Log,
  Profile,
  Settings,
  SocketData
} from '@shared/types'

// Custom APIs for renderer
const api = {
  // Updated Commands

  // Apps

  getApps: async (): Promise<App[]> =>
    await sendCommand('APPS', { type: 'app', request: 'get', payload: null }),

  getAppData: async (appId: string): Promise<AppDataInterface | null> =>
    await sendCommand<AppDataInterface | null>('APPS', {
      type: 'data',
      request: 'get',
      payload: appId
    }),

  setAppData: async (appId: string, data: AppDataInterface): Promise<void> =>
    await sendCommand('APPS', { type: 'data', request: 'set', payload: { appId, data } }),

  stopApp: async (appId: string): Promise<void> =>
    await sendCommand('APPS', { type: 'stop', request: 'set', payload: appId }),

  disableApp: async (appId: string): Promise<void> =>
    await sendCommand('APPS', { type: 'disable', request: 'set', payload: appId }),

  enableApp: async (appId: string): Promise<void> =>
    await sendCommand('APPS', { type: 'enable', request: 'set', payload: appId }),

  runApp: async (appId: string): Promise<void> =>
    await sendCommand('APPS', { type: 'run', request: 'set', payload: appId }),

  purgeApp: async (appId: string): Promise<void> =>
    await sendCommand('APPS', { type: 'purge', request: 'set', payload: appId }),

  handleAppZip: async (path: string): Promise<AppReturnData | null> =>
    await sendCommand('APPS', { type: 'zip', request: 'set', payload: path }),

  handleAppUrl: async (url: string): Promise<AppReturnData | null> =>
    await sendCommand('APPS', { type: 'url', request: 'set', payload: url }),

  handleResponseToUserData: async (requestId: string, payload: IncomingData): Promise<void> =>
    await sendCommand('APPS', {
      type: 'user-data-response',
      request: 'set',
      payload: { requestId, response: payload }
    }),

  handleDeAppZip: async (path: string): Promise<void> =>
    await sendCommand('APPS', {
      type: 'dev-add-app',
      request: 'set',
      payload: { appPath: path }
    }),

  sendDataToApp: async (data: SocketData): Promise<void> =>
    await sendCommand('APPS', {
      type: 'send-to-app',
      request: 'set',
      payload: data
    }),

  orderApps: async (data: string[]): Promise<void> =>
    await sendCommand('APPS', {
      type: 'app-order',
      request: 'set',
      payload: data
    }),

  // Clients

  pingClient: async (clientId: string): Promise<string | null> =>
    await sendCommand('CLIENT', { type: 'pingClient', request: 'set', payload: clientId }),

  handleClientZip: async (path: string): Promise<void> =>
    await sendCommand('CLIENT', {
      type: 'zip',
      request: 'set',
      payload: path
    }),

  handleClientURL: async (url: string): Promise<void> =>
    await sendCommand('CLIENT', {
      type: 'url',
      request: 'set',
      payload: url
    }),

  handleClientADB: async (command: string): Promise<string> =>
    await sendCommand('CLIENT', {
      type: 'adb',
      request: 'set',
      payload: command
    }),

  configureDevice: async (deviceId: string): Promise<void> =>
    await sendCommand('CLIENT', {
      type: 'configure',
      request: 'set',
      payload: deviceId
    }),

  getClientManifest: async (): Promise<ClientManifest> =>
    await sendCommand<ClientManifest>('CLIENT', {
      type: 'client-manifest',
      request: 'get',
      payload: undefined
    }),

  updateClientManifest: async (client: Partial<ClientManifest>): Promise<void> =>
    await sendCommand<void>('CLIENT', {
      type: 'client-manifest',
      request: 'set',
      payload: client
    }),

  pushStagedApp: async (clientId: string): Promise<void> =>
    await sendCommand('CLIENT', {
      type: 'push-staged',
      request: 'get',
      payload: clientId
    }),

  pushProxyScript: async (clientId: string): Promise<void> =>
    await sendCommand('CLIENT', {
      type: 'push-proxy-script',
      request: 'set',
      payload: clientId
    }),

  handleClientCommand: async (command: SocketData): Promise<void> =>
    await sendCommand('CLIENT', {
      type: 'run-device-command',
      request: 'set',
      payload: command
    }),

  // Utility

  ping: async (): Promise<void> =>
    await sendCommand('UTILITY', {
      type: 'ping',
      request: 'set',
      payload: undefined
    }),

  getConnections: async (): Promise<Client[]> =>
    await sendCommand<Client[]>('UTILITY', {
      type: 'connections',
      request: 'get',
      payload: undefined
    }),

  getDevices: async (): Promise<string[]> =>
    await sendCommand<string[]>('UTILITY', {
      type: 'devices',
      request: 'get',
      payload: undefined
    }),

  disconnectClient: async (connectionId: string): Promise<void> =>
    await sendCommand('UTILITY', {
      type: 'connections',
      request: 'delete',
      payload: connectionId
    }),

  saveSettings: async (settings: Settings): Promise<void> =>
    await sendCommand('UTILITY', {
      type: 'settings',
      request: 'set',
      payload: settings
    }),

  getSettings: async (): Promise<Settings> =>
    await sendCommand('UTILITY', {
      type: 'settings',
      request: 'get',
      payload: undefined
    }),

  fetchGithub: async (url: string): Promise<GithubRelease[]> =>
    await sendCommand('UTILITY', {
      type: 'github',
      request: 'get',
      payload: url
    }),

  getLogs: async (): Promise<Log[]> =>
    await sendCommand('UTILITY', {
      type: 'logs',
      request: 'get',
      payload: undefined
    }),

  shutdown: async (): Promise<void> =>
    await sendCommand('UTILITY', {
      type: 'shutdown',
      request: 'set',
      payload: undefined
    }),

  openLogsFolder: async (): Promise<void> =>
    await sendCommand('UTILITY', {
      type: 'open-log-folder',
      request: 'set',
      payload: undefined
    }),

  selectZipFile: async (): Promise<string | undefined> =>
    await sendCommand('UTILITY', {
      type: 'zip',
      request: 'get',
      payload: undefined
    }),

  refreshFirewall: async (): Promise<void> =>
    await sendCommand('UTILITY', {
      type: 'refresh-firewall',
      request: 'set',
      payload: undefined
    }),

  restartServer: async (): Promise<void> =>
    await sendCommand('UTILITY', {
      type: 'restart-server',
      request: 'set',
      payload: undefined
    }),

  getActions: async (): Promise<Action[]> =>
    await sendCommand('UTILITY', {
      type: 'actions',
      request: 'get',
      payload: undefined
    }),

  addAction: async (action: Action): Promise<void> =>
    await sendCommand('UTILITY', {
      type: 'actions',
      request: 'set',
      payload: action
    }),

  deleteAction: async (actionId: string): Promise<void> =>
    await sendCommand('UTILITY', {
      type: 'actions',
      request: 'delete',
      payload: actionId
    }),

  addButton: async (button: Button): Promise<void> =>
    await sendCommand('UTILITY', {
      type: 'buttons',
      request: 'set',
      payload: button
    }),

  deleteButton: async (button: Exclude<'action', Button>): Promise<void> =>
    await sendCommand('UTILITY', {
      type: 'buttons',
      request: 'delete',
      payload: button
    }),

  getKeys: async (): Promise<Key[]> =>
    await sendCommand('UTILITY', {
      type: 'keys',
      request: 'get',
      payload: undefined
    }),

  addKey: async (key: Key): Promise<void> =>
    await sendCommand('UTILITY', {
      type: 'keys',
      request: 'set',
      payload: key
    }),

  deleteKey: async (keyId: string): Promise<void> =>
    await sendCommand('UTILITY', {
      type: 'keys',
      request: 'delete',
      payload: keyId
    }),

  getProfiles: async (): Promise<Profile[]> =>
    await sendCommand('UTILITY', {
      type: 'profiles',
      request: 'get',
      payload: undefined
    }),

  getProfile: async (profileName: string): Promise<ButtonMapping> =>
    await sendCommand('UTILITY', {
      type: 'profiles',
      request: 'get',
      payload: profileName
    }),

  getIcon: async (action: Action | ActionReference): Promise<string> =>
    await sendCommand('CLIENT', {
      type: 'icon',
      request: 'get',
      payload: action
    }),

  saveProfile: async (profile: ButtonMapping): Promise<void> =>
    await sendCommand('UTILITY', {
      type: 'profiles',
      request: 'set',
      payload: profile
    }),

  addProfile: async (profile: Profile): Promise<void> =>
    await sendCommand('UTILITY', {
      type: 'profiles',
      request: 'set',
      payload: profile
    }),

  deleteProfile: async (profileName: string): Promise<void> =>
    await sendCommand('UTILITY', {
      type: 'profiles',
      request: 'delete',
      payload: profileName
    }),

  getCurrentProfile: async (): Promise<Profile> =>
    await sendCommand('UTILITY', {
      type: 'map',
      request: 'get',
      payload: undefined
    }),

  setCurrentProfile: async (profile: Profile): Promise<void> =>
    await sendCommand('UTILITY', {
      type: 'map',
      request: 'set',
      payload: profile
    }),

  runAction: async (action: Action | ActionReference): Promise<void> =>
    await sendCommand('UTILITY', {
      type: 'run',
      request: 'set',
      payload: action
    })
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
