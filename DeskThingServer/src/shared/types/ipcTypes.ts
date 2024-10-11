export const IPC_HANDLERS = {
  UTILITY: 'utility',
  CLIENT: 'client',
  APPS: 'apps'
}

export type IPC_METHODS = 'get' | 'set' | 'delete'

export type UTILITY_TYPES =
  | 'ping'
  | 'connections'
  | 'devices'
  | 'settings'
  | 'github'
  | 'logs'
  | 'maps'
  | 'shutdown'
  | 'open-log-folder'
  | 'refresh-firewall'

export type APP_TYPES =
  | 'app'
  | 'data'
  | 'stop'
  | 'disable'
  | 'run'
  | 'enable'
  | 'purge'
  | 'zip'
  | 'url'
  | 'user-data-response'
  | 'select-zip-file'
  | 'dev-add-app'
  | 'send-to-app'
  | 'app-order'

export type CLIENT_TYPES =
  | 'zip'
  | 'url'
  | 'client-manifest'
  | 'push-staged'
  | 'push-proxy-script'
  | 'adb'
  | 'run-device-command'

export interface AppIPCData {
  type: APP_TYPES
  request: IPC_METHODS
  payload: any
}

export interface ClientIPCData {
  type: CLIENT_TYPES
  request: IPC_METHODS
  payload: any
}

export interface UtilityIPCData {
  type: UTILITY_TYPES
  request: IPC_METHODS
  payload: any
}

export type IPCData = AppIPCData | ClientIPCData | UtilityIPCData
