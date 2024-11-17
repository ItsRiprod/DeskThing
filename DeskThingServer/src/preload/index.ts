import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {
  App,
  AppDataInterface,
  AppReturnData,
  ButtonMapping,
  Client,
  ClientManifest,
  GithubRelease,
  IncomingData,
  IPC_HANDLERS,
  IPCData,
  Log,
  Settings,
  SocketData
} from '@shared/types'

// Custom APIs for renderer
const api = {
  // Updated Commands

  // Apps

  getApps: (): Promise<App[]> =>
    sendCommand('APPS', { type: 'app', request: 'get', payload: null }),

  getAppData: async (appId: string): Promise<AppDataInterface | null> =>
    sendCommand<AppDataInterface | null>('APPS', {
      type: 'data',
      request: 'get',
      payload: appId
    }),

  setAppData: async (appId: string, data: AppDataInterface): Promise<void> =>
    sendCommand('APPS', { type: 'data', request: 'set', payload: { appId, data } }),

  stopApp: async (appId: string): Promise<void> =>
    sendCommand('APPS', { type: 'stop', request: 'set', payload: appId }),

  disableApp: async (appId: string): Promise<void> =>
    sendCommand('APPS', { type: 'disable', request: 'set', payload: appId }),

  enableApp: async (appId: string): Promise<void> =>
    sendCommand('APPS', { type: 'enable', request: 'set', payload: appId }),

  runApp: async (appId: string): Promise<void> =>
    sendCommand('APPS', { type: 'run', request: 'set', payload: appId }),

  purgeApp: async (appId: string): Promise<void> =>
    sendCommand('APPS', { type: 'purge', request: 'set', payload: appId }),

  handleAppZip: async (path: string): Promise<AppReturnData | null> =>
    sendCommand('APPS', { type: 'zip', request: 'set', payload: path }),

  handleAppUrl: async (url: string): Promise<AppReturnData | null> =>
    sendCommand('APPS', { type: 'url', request: 'set', payload: url }),

  handleResponseToUserData: async (requestId: string, payload: IncomingData): Promise<void> =>
    sendCommand('APPS', {
      type: 'user-data-response',
      request: 'set',
      payload: { requestId, response: payload }
    }),

  handleDeAppZip: async (path: string): Promise<void> =>
    sendCommand('APPS', {
      type: 'dev-add-app',
      request: 'set',
      payload: { appPath: path }
    }),

  sendDataToApp: async (data: SocketData): Promise<void> =>
    sendCommand('APPS', {
      type: 'send-to-app',
      request: 'set',
      payload: data
    }),

  orderApps: async (data: string[]): Promise<void> =>
    sendCommand('APPS', {
      type: 'app-order',
      request: 'set',
      payload: data
    }),

  // Clients

  pingClient: (clientId: string): Promise<string | null> =>
    sendCommand('CLIENT', { type: 'pingClient', request: 'set', payload: clientId }),

  handleClientZip: async (path: string): Promise<void> =>
    sendCommand('CLIENT', {
      type: 'zip',
      request: 'set',
      payload: path
    }),

  handleClientURL: async (url: string): Promise<void> =>
    sendCommand('CLIENT', {
      type: 'url',
      request: 'set',
      payload: url
    }),

  handleClientADB: (command: string): Promise<string> =>
    sendCommand('CLIENT', {
      type: 'adb',
      request: 'set',
      payload: command
    }),

  configureDevice: (deviceId: string): Promise<void> =>
    sendCommand('CLIENT', {
      type: 'configure',
      request: 'set',
      payload: deviceId
    }),

  getClientManifest: (): Promise<ClientManifest> =>
    sendCommand<ClientManifest>('CLIENT', {
      type: 'client-manifest',
      request: 'get',
      payload: undefined
    }),
  updateClientManifest: (client: Partial<ClientManifest>): Promise<void> =>
    sendCommand<void>('CLIENT', {
      type: 'client-manifest',
      request: 'set',
      payload: client
    }),

  pushStagedApp: (clientId: string): Promise<void> =>
    sendCommand('CLIENT', {
      type: 'push-staged',
      request: 'get',
      payload: clientId
    }),

  pushProxyScript: (clientId: string): Promise<void> =>
    sendCommand('CLIENT', {
      type: 'push-proxy-script',
      request: 'set',
      payload: clientId
    }),

  handleClientCommand: (command: SocketData): Promise<void> => {
    return sendCommand('CLIENT', {
      type: 'run-device-command',
      request: 'set',
      payload: command
    })
  },

  // Utility

  ping: (): Promise<void> => {
    return sendCommand('UTILITY', {
      type: 'ping',
      request: 'set',
      payload: undefined
    })
  },

  getConnections: (): Promise<Client[]> => {
    return sendCommand<Client[]>('UTILITY', {
      type: 'connections',
      request: 'get',
      payload: undefined
    })
  },

  getDevices: (): Promise<string[]> => {
    return sendCommand<string[]>('UTILITY', {
      type: 'devices',
      request: 'get',
      payload: undefined
    })
  },

  disconnectClient: (connectionId: string): Promise<void> => {
    return sendCommand('UTILITY', {
      type: 'connections',
      request: 'delete',
      payload: connectionId
    })
  },

  saveSettings: (settings: Settings): Promise<void> => {
    return sendCommand('UTILITY', {
      type: 'settings',
      request: 'set',
      payload: settings
    })
  },

  getSettings: (): Promise<Settings> => {
    return sendCommand('UTILITY', {
      type: 'settings',
      request: 'get',
      payload: undefined
    })
  },

  fetchGithub: (url: string): Promise<GithubRelease[]> => {
    return sendCommand('UTILITY', {
      type: 'github',
      request: 'get',
      payload: url
    })
  },

  getLogs: (): Promise<Log[]> => {
    return sendCommand('UTILITY', {
      type: 'logs',
      request: 'get',
      payload: undefined
    })
  },

  getMappings: (): Promise<ButtonMapping> => {
    return sendCommand('UTILITY', {
      type: 'maps',
      request: 'get',
      payload: undefined
    })
  },

  addProfile: (profile: string, baseProfile: string | undefined): Promise<ButtonMapping> => {
    return sendCommand('UTILITY', {
      type: 'maps',
      request: 'get',
      payload: { profile, baseProfile }
    })
  },

  deleteProfile: (profile: string): Promise<ButtonMapping> => {
    return sendCommand('UTILITY', {
      type: 'maps',
      request: 'delete',
      payload: profile
    })
  },

  shutdown: (): Promise<void> => {
    return sendCommand('UTILITY', {
      type: 'shutdown',
      request: 'set',
      payload: undefined
    })
  },

  openLogsFolder: (): Promise<void> => {
    return sendCommand('UTILITY', {
      type: 'open-log-folder',
      request: 'set',
      payload: undefined
    })
  },

  selectZipFile: (): Promise<string | undefined> => {
    return sendCommand('UTILITY', {
      type: 'zip',
      request: 'get',
      payload: undefined
    })
  },

  refreshFirewall: (): Promise<void> => {
    return sendCommand('UTILITY', {
      type: 'refresh-firewall',
      request: 'set',
      payload: undefined
    })
  },

  restartServer: (): Promise<void> => {
    return sendCommand('UTILITY', {
      type: 'restart-server',
      request: 'set',
      payload: undefined
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
