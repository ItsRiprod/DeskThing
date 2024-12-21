// Ik this is bad practice but I don't have time to fix it right now
/* eslint-disable @typescript-eslint/no-explicit-any */

import { App, AppReturnData } from './app'
import { BrowserWindow } from 'electron'
import { Log, Settings } from './types'
import { Action, ButtonMapping, Key } from './maps'
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

/**
 * OUTGOING DATA TYPES FROM SERVER TO CLIENT
 */

export type ServerIPCData =
  | AppsListIPC
  | LogIPC
  | SettingsIPC
  | ConnectionsIPC
  | AdbDevicesIPC
  | ClientsIPC
  | ProfileIPC
  | DeviceVersionStatusIPC
  | AppDataIPC

export type OutgoingIPCBase = {
  type: string
  payload: unknown
  window?: BrowserWindow | null
}

export interface AppDataIPC extends OutgoingIPCBase {
  type: 'app-data'
  payload: App[]
}

export interface DeviceVersionStatusIPC extends OutgoingIPCBase {
  type: 'version-status'
  payload: any
}

export interface ProfileIPC extends OutgoingIPCBase {
  type: 'profile' | 'key' | 'action'
  payload: ButtonMapping | Key[] | Action[]
}

export interface LogIPC extends OutgoingIPCBase {
  type: 'log'
  payload: Log
}

export interface AppsListIPC extends OutgoingIPCBase {
  type: 'app-types'
  payload: App[]
}

export interface ConnectionsIPC extends OutgoingIPCBase {
  type: 'connections'
  payload: ReplyData
}

export interface SettingsIPC extends OutgoingIPCBase {
  type: 'settings-updated'
  payload: Settings
}

export interface AdbDevicesIPC extends OutgoingIPCBase {
  type: 'adbdevices'
  payload: ReplyData
}

export interface ClientsIPC extends OutgoingIPCBase {
  type: 'clients'
  payload: ReplyData
}

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
