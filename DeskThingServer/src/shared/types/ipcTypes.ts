// Ik this is bad practice but I don't have time to fix it right now
/* eslint-disable @typescript-eslint/no-explicit-any */

import { BrowserWindow, IpcRendererEvent } from 'electron'
import { Log, Settings, MappingStructure, ADBClient } from '.'
import {
  Step,
  Client,
  Task,
  Action,
  Key,
  App,
  AppManifest,
  AppReleaseMeta,
  AppReleaseCommunity,
  AppSettings,
  ActionReference,
  Button,
  AppReleaseSingleMeta,
  ClientReleaseMeta,
  AuthScopes,
  SavedData,
  ButtonMapping,
  Profile,
  DeskThingToAppData
} from '@deskthing/types'
import { FeedbackReport, StagedAppManifest, SystemInfo, FullTaskList } from '@shared/types'

export const IPC_HANDLERS = {
  UTILITY: 'utility',
  CLIENT: 'client',
  APPS: 'apps'
}

export type IPC_METHODS = 'get' | 'set' | 'delete'

export enum UTILITY_TYPES {
  PING = 'ping',
  CONNECTIONS = 'connections',
  DEVICES = 'devices',
  SETTINGS = 'settings',
  LOGS = 'logs',
  SHUTDOWN = 'shutdown',
  OPEN_LOG_FOLDER = 'open-log-folder',
  REFRESH_FIREWALL = 'refresh-firewall',
  RESTART_SERVER = 'restart-server',
  ZIP = 'zip',
  ACTIONS = 'actions',
  BUTTONS = 'buttons',
  KEYS = 'keys',
  PROFILES = 'profiles',
  RUN = 'run',
  MAP = 'map',
  FEEDBACK = 'feedback',
  TASK = 'task',
  UPDATE = 'update',
  GITHUB = 'github'
}

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

export enum APP_TYPES {
  APP = 'app',
  DATA = 'data',
  SETTINGS = 'settings',
  STOP = 'stop',
  DISABLE = 'disable',
  RUN = 'run',
  ENABLE = 'enable',
  PURGE = 'purge',
  ZIP = 'zip',
  URL = 'url',
  ADD = 'add',
  STAGED = 'staged',
  USER_DATA_RESPONSE = 'user-data-response',
  SELECT_ZIP_FILE = 'select-zip-file',
  DEV_ADD_APP = 'dev-add-app',
  SEND_TO_APP = 'send-to-app',
  APP_ORDER = 'app-order',
  ICON = 'icon'
}

export type AppIPCData = {
  kind: 'app'
} & (
  | {
      type: APP_TYPES.APP
      request: 'get'
    }
  | {
      type: APP_TYPES.DATA
      request: 'get'
      payload: string
    }
  | {
      type: APP_TYPES.DATA
      request: 'set'
      payload: { appId: string; data: SavedData }
    }
  | {
      type: APP_TYPES.SETTINGS
      request: 'get'
      payload: string
    }
  | {
      type: APP_TYPES.SETTINGS
      request: 'set'
      payload: { appId: string; settings: AppSettings }
    }
  | {
      type: APP_TYPES.STOP
      payload: string
    }
  | {
      type: APP_TYPES.DISABLE
      payload: string
    }
  | {
      type: APP_TYPES.ENABLE
      payload: string
    }
  | {
      type: APP_TYPES.RUN
      payload: string
    }
  | {
      type: APP_TYPES.PURGE
      payload: string
    }
  | {
      type: APP_TYPES.ZIP
      payload: string
    }
  | {
      type: APP_TYPES.URL
      payload: string
    }
  | {
      type: APP_TYPES.ADD
      payload: { filePath?: string; meta?: AppReleaseSingleMeta }
    }
  | {
      type: APP_TYPES.STAGED
      payload: { overwrite?: boolean; appId?: string }
    }
  | {
      type: APP_TYPES.USER_DATA_RESPONSE
      payload: { requestId: string; response: DeskThingToAppData }
    }
  | {
      type: APP_TYPES.SELECT_ZIP_FILE
    }
  | {
      type: APP_TYPES.DEV_ADD_APP
      payload: { appPath: string }
    }
  | {
      type: APP_TYPES.SEND_TO_APP
      payload: DeskThingToAppData & { app: string }
    }
  | {
      type: APP_TYPES.APP_ORDER
      payload: string[]
    }
  | {
      type: APP_TYPES.ICON
      payload: { appId: string; icon?: string }
    }
)
export type AppHandlerReturnMap = {
  [APP_TYPES.APP]: App[]
  [APP_TYPES.DATA]: SavedData | null
  [APP_TYPES.SETTINGS]: AppSettings | null
  [APP_TYPES.STOP]: boolean
  [APP_TYPES.DISABLE]: boolean
  [APP_TYPES.ENABLE]: boolean
  [APP_TYPES.RUN]: boolean
  [APP_TYPES.PURGE]: boolean
  [APP_TYPES.ZIP]: AppManifest | null
  [APP_TYPES.URL]: AppManifest | null
  [APP_TYPES.ADD]: StagedAppManifest | null
  [APP_TYPES.STAGED]: void
  [APP_TYPES.USER_DATA_RESPONSE]: void
  [APP_TYPES.SELECT_ZIP_FILE]: { path: string; name: string } | null
  [APP_TYPES.DEV_ADD_APP]: void
  [APP_TYPES.SEND_TO_APP]: void
  [APP_TYPES.APP_ORDER]: void
  [APP_TYPES.ICON]: string | null
}

export type AppHandlerReturnType<K extends APP_TYPES> = AppHandlerReturnMap[K]

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

export type UtilityIPCData = {
  kind: 'utility'
} & (
  | { type: UTILITY_TYPES.PING }
  | { type: UTILITY_TYPES.ZIP }
  | {
      type: UTILITY_TYPES.CONNECTIONS
      request: 'get'
    }
  | {
      type: UTILITY_TYPES.CONNECTIONS
      request: 'delete'
      payload: string
    }
  | { type: UTILITY_TYPES.DEVICES }
  | {
      type: UTILITY_TYPES.SETTINGS
      request: 'get'
    }
  | {
      type: UTILITY_TYPES.SETTINGS
      request: 'set'
      payload: Settings
    }
  | { type: UTILITY_TYPES.LOGS }
  | { type: UTILITY_TYPES.SHUTDOWN }
  | { type: UTILITY_TYPES.OPEN_LOG_FOLDER }
  | { type: UTILITY_TYPES.REFRESH_FIREWALL }
  | { type: UTILITY_TYPES.RESTART_SERVER }
  | {
      type: UTILITY_TYPES.ACTIONS
      request: 'get'
    }
  | {
      type: UTILITY_TYPES.ACTIONS
      request: 'set'
      payload: Action
    }
  | {
      type: UTILITY_TYPES.ACTIONS
      request: 'delete'
      payload: string
    }
  | {
      type: UTILITY_TYPES.BUTTONS
      request: 'set' | 'delete'
      payload: Button
    }
  | {
      type: UTILITY_TYPES.KEYS
      request: 'get'
    }
  | {
      type: UTILITY_TYPES.KEYS
      request: 'set'
      payload: Key
    }
  | {
      type: UTILITY_TYPES.KEYS
      request: 'delete'
      payload: string
    }
  | {
      type: UTILITY_TYPES.PROFILES
      request: 'get'
      payload?: string
    }
  | {
      type: UTILITY_TYPES.PROFILES
      request: 'set'
      payload: Profile
    }
  | {
      type: UTILITY_TYPES.PROFILES
      request: 'delete'
      payload: string
    }
  | {
      type: UTILITY_TYPES.MAP
      request: 'get'
    }
  | {
      type: UTILITY_TYPES.MAP
      request: 'set'
      payload: Profile
    }
  | {
      type: UTILITY_TYPES.RUN
      payload: Action | ActionReference
    }
  | {
      type: UTILITY_TYPES.FEEDBACK
      request: 'set'
      payload: FeedbackReport
    }
  | {
      type: UTILITY_TYPES.FEEDBACK
      request: 'get'
    }
  | {
      type: UTILITY_TYPES.UPDATE
      request: 'check'
      payload: string
    }
  | {
      type: UTILITY_TYPES.UPDATE
      request: 'restart'
      payload: string
    }
  | {
      type: UTILITY_TYPES.UPDATE
      request: 'download'
      payload: string
    }
  | ({ type: UTILITY_TYPES.TASK } & UtilityIPCTask)
  | ({ type: UTILITY_TYPES.GITHUB } & UtilityIPCGithub)
)

export type UtilityHandlerReturnMap = {
  [UTILITY_TYPES.PING]: string
  [UTILITY_TYPES.ZIP]: string | undefined
  [UTILITY_TYPES.CONNECTIONS]: Client[]
  [UTILITY_TYPES.DEVICES]: ADBClient[]
  [UTILITY_TYPES.SETTINGS]: Settings
  [UTILITY_TYPES.LOGS]: Log[]
  [UTILITY_TYPES.SHUTDOWN]: void
  [UTILITY_TYPES.OPEN_LOG_FOLDER]: void
  [UTILITY_TYPES.REFRESH_FIREWALL]: void
  [UTILITY_TYPES.RESTART_SERVER]: void
  [UTILITY_TYPES.ACTIONS]: Action[] | void | null
  [UTILITY_TYPES.BUTTONS]: void
  [UTILITY_TYPES.KEYS]: Key[] | null
  [UTILITY_TYPES.PROFILES]: Profile | Profile[] | MappingStructure | null
  [UTILITY_TYPES.MAP]: Profile
  [UTILITY_TYPES.RUN]: void
  [UTILITY_TYPES.FEEDBACK]: SystemInfo | void
  [UTILITY_TYPES.TASK]: Task | Task[] | FullTaskList
  [UTILITY_TYPES.UPDATE]: void
  [UTILITY_TYPES.GITHUB]:
    | ClientReleaseMeta[]
    | AppReleaseCommunity[]
    | AppReleaseMeta[]
    | AppReleaseMeta
    | void
}
export type UtilityHandlerReturnType<K extends UTILITY_TYPES> = UtilityHandlerReturnMap[K]

export type UtilityIPCGithub = {
  type: UTILITY_TYPES.GITHUB
} & (
  | {
      request: 'refreshApps'
      payload: undefined
    }
  | {
      request: 'refreshApp'
      payload: string
    }
  | {
      request: 'getApps'
      payload: undefined
    }
  | {
      request: 'getAppReferences'
      payload: undefined
    }
  | {
      request: 'addAppRepo'
      payload: string
    }
  | {
      request: 'removeAppRepo'
      payload: string
    }
  | {
      request: 'getClients'
      payload: undefined
    }
)

export type UtilityIPCTask = {
  type: UTILITY_TYPES.TASK
} & (
  | {
      request: 'complete_task' | 'start' | 'stop' | 'restart' | 'previous' | 'next'
      payload: { source: string; taskId: string }
    }
  | {
      request: 'complete'
      payload: { source: string; taskId: string; stepId: string }
    }
  | {
      request: 'get' | 'pause'
    }
  | {
      request: 'update-step'
      payload: { source: string; taskId: string; newStep: Partial<Step> }
    }
  | {
      request: 'update-task'
      payload: { source: string; newTask: Partial<Task> }
    }
)

export type IPCData =
  | ({ kind: 'app' } & AppIPCData)
  | ({ kind: 'client' } & ClientIPCData)
  | ({ kind: 'utility' } & UtilityIPCData)

export type IpcRendererFunction = <T extends ServerIPCData['type']>(
  channel: T,
  callback: IpcRendererCallback<T>
) => void

export type IpcRendererCallback<T extends ServerIPCData['type']> = (
  event: IpcRendererEvent,
  response: Extract<ServerIPCData, { type: T }>['payload']
) => void

export type LinkRequest = { url: string; app: string }

/**
 * OUTGOING DATA TYPES FROM SERVER BACKEND TO SERVER FRONTEND
 */
export type ServerIPCData = {
  window?: BrowserWindow | null
} & (
  | {
      type: 'app-data'
      payload: App[]
    }
  | {
      type: 'app-settings'
      payload: { appId: string; data: AppSettings }
    }
  | {
      type: 'version-status'
      payload: any
    }
  | {
      type: 'update-status'
      payload: UpdateInfoType
    }
  | {
      type: 'update-progress'
      payload: UpdateProgressType
    }
  | {
      type: 'profile'
      payload: ButtonMapping
    }
  | {
      type: 'key'
      payload: Key[]
    }
  | {
      type: 'action'
      payload: Action[]
    }
  | {
      type: 'log'
      payload: Log
    }
  | {
      type: 'app-types'
      payload: App[]
    }
  | {
      type: 'connections'
      payload: ReplyData
    }
  | {
      type: 'settings-updated'
      payload: Settings
    }
  | {
      type: 'adbdevices'
      payload: ADBClient[]
    }
  | {
      type: 'clients'
      payload: ReplyData
    }
  | {
      type: 'taskList'
      payload: { source: string; taskList: Record<string, Task> }
    }
  | {
      type: 'currentTask'
      payload: { source: string; id: string }
    }
  | {
      type: 'task'
      payload: Task
    }
  | {
      type: 'github-apps'
      payload: AppReleaseMeta[]
    }
  | {
      type: 'link-request'
      payload: LinkRequest
    }
  | {
      type: 'github-community'
      payload: AppReleaseCommunity[]
    }
  | {
      type: 'github-client'
      payload: ClientReleaseMeta[]
    }
  | {
      type: 'display-user-form'
      payload: {
        requestId: string
        scope: AuthScopes
      }
    }
)

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

export interface UpdateProgressType {
  speed: number
  percent: number
  total: number
  transferred: number
}
export interface LoggingData {
  status: boolean
  data: AppManifest | string // add as needed
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
