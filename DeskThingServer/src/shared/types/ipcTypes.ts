// Ik this is bad practice but I don't have time to fix it right now
/* eslint-disable @typescript-eslint/no-explicit-any */

import { App, AppReturnData } from './app'
import { BrowserWindow } from 'electron'
import { Log, Settings } from './types'
import { Action, ButtonMapping, Key } from './maps'
import { TaskList } from './tasks'
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
  | 'feedback'

export type APP_TYPES =
  | 'app'
  | 'data'
  | 'settings'
  | 'stop'
  | 'disable'
  | 'run'
  | 'enable'
  | 'purge'
  | 'zip'
  | 'url'
  | 'add'
  | 'staged'
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

// App Types
export interface AppIPCBase {
  kind: 'app'
  type: string
  request: string
  payload: any
}
export interface AppIPCData extends AppIPCBase {
  kind: 'app'
  type: APP_TYPES
  request: IPC_METHODS
  payload: any
}
// Client Types
export interface ClientIPCBase {
  kind: 'client'
  type: string
  request: string
  payload: any
}

export interface ClientIPCData extends ClientIPCBase {
  type: CLIENT_TYPES
  request: IPC_METHODS
  payload: any
}

// Utility types
export interface UtilityIPCBase {
  kind: 'utility'
  type: string
  request: string
  payload: any
}

export interface UtilityIPCData extends UtilityIPCBase {
  type: UTILITY_TYPES
  request: IPC_METHODS
  payload: any
}
export interface UtilityIPCTask extends UtilityIPCBase {
  type: 'task'
  request:
    | 'get'
    | 'complete'
    | 'start'
    | 'stop'
    | 'complete_task'
    | 'restart'
    | 'pause'
    | 'next'
    | 'previous'
  payload: string | string[]
}
export interface UtilityIPCUpdate extends UtilityIPCBase {
  type: 'update'
  request: 'check' | 'download' | 'restart'
  payload: string
}

export type IPCData =
  | (AppIPCData & { kind: 'app'; type: APP_TYPES })
  | (ClientIPCData & { kind: 'client'; type: CLIENT_TYPES })
  | (UtilityIPCData & { kind: 'utility'; type: UTILITY_TYPES })
  | (UtilityIPCTask & { kind: 'utility'; type: 'task' })
  | (UtilityIPCUpdate & { kind: 'utility'; type: 'update' })

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
  | VersionStatusIPC
  | ProfileIPC
  | UpdateStatusIPC
  | UpdateProgressIPC
  | AppDataIPC
  | TasksIPC

export type OutgoingIPCBase = {
  type: string
  payload: unknown
  window?: BrowserWindow | null
}

export interface AppDataIPC extends OutgoingIPCBase {
  type: 'app-data'
  payload: App[]
}
export interface VersionStatusIPC extends OutgoingIPCBase {
  type: 'version-status'
  payload: any
}

export interface UpdateInfoType {
  updateAvailable: boolean
  updateDownloaded: boolean
  failed?: boolean
  error?: string
  version?: string
  releaseNotes?: string
  releaseName?: string | null
  releaseDate?: string
}

export interface UpdateStatusIPC extends OutgoingIPCBase {
  type: 'update-status'
  payload: UpdateInfoType
}

export interface UpdateProgressType {
  speed: number
  percent: number
  total: number
  transferred: number
}

export interface UpdateProgressIPC extends OutgoingIPCBase {
  type: 'update-progress'
  payload: UpdateProgressType
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

export interface TasksIPC extends OutgoingIPCBase {
  type: 'taskList'
  payload: TaskList
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
