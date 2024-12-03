// Ik this is bad practice but I don't have time to fix it right now
/* eslint-disable @typescript-eslint/no-explicit-any */

import { AppReturnData } from './app'

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
  | 'shutdown'
  | 'open-log-folder'
  | 'refresh-firewall'
  | 'restart-server'
  | 'zip'
  | 'actions'
  | 'buttons'
  | 'keys'
  | 'profiles'
  | 'run'
  | 'map'

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
  | 'configure'
  | 'pingClient'
  | 'client-manifest'
  | 'push-staged'
  | 'push-proxy-script'
  | 'adb'
  | 'run-device-command'
  | 'icon'

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

export interface LoggingData {
  status: boolean
  data: AppReturnData | string // add as needed
  final: boolean
  error?: string
}

export interface ReplyData {
  status: boolean
  data: any
  final: boolean
  error?: string
}

export interface ReplyFn {
  (channel: string, data: ReplyData): Promise<void> | void
}
