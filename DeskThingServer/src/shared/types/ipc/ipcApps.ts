import {
  App,
  AppLatestJSONLatest,
  AppSettings,
  DeskThingToAppData,
  SavedData
} from '@deskthing/types'
import { AppDownloadReturnData } from '../app'
import { IPC_HANDLERS } from './ipcTypes'

export enum IPC_APP_TYPES {
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
  POSTINSTALL = 'postinstall',
  SEND_TO_APP = 'send-to-app',
  APP_ORDER = 'app-order',
  ICON = 'icon'
}

export type AppIPCData = {
  kind: IPC_HANDLERS.APPS
} & (
  | {
      type: IPC_APP_TYPES.APP
      request: 'get'
    }
  | {
      type: IPC_APP_TYPES.DATA
      request: 'get'
      payload: string
    }
  | {
      type: IPC_APP_TYPES.DATA
      request: 'set'
      payload: { appId: string; data: SavedData }
    }
  | {
      type: IPC_APP_TYPES.SETTINGS
      request: 'get'
      payload: string
    }
  | {
      type: IPC_APP_TYPES.SETTINGS
      request: 'set'
      payload: { appId: string; settings: AppSettings }
    }
  | {
      type: IPC_APP_TYPES.STOP
      payload: string
    }
  | {
      type: IPC_APP_TYPES.DISABLE
      payload: string
    }
  | {
      type: IPC_APP_TYPES.ENABLE
      payload: string
    }
  | {
      type: IPC_APP_TYPES.RUN
      payload: string
    }
  | {
      type: IPC_APP_TYPES.PURGE
      payload: string
    }
  | {
      type: IPC_APP_TYPES.ZIP
      payload: string
    }
  | {
      type: IPC_APP_TYPES.URL
      payload: string
    }
  | {
      type: IPC_APP_TYPES.POSTINSTALL
      payload: string
    }
  | {
      type: IPC_APP_TYPES.ADD
      payload: { filePath?: string; meta?: AppLatestJSONLatest }
    }
  | {
      type: IPC_APP_TYPES.STAGED
      payload: { overwrite?: boolean; appId?: string }
    }
  | {
      type: IPC_APP_TYPES.USER_DATA_RESPONSE
      payload: { requestId: string; response: DeskThingToAppData }
    }
  | {
      type: IPC_APP_TYPES.SELECT_ZIP_FILE
    }
  | {
      type: IPC_APP_TYPES.DEV_ADD_APP
      payload: { appPath: string }
    }
  | {
      type: IPC_APP_TYPES.SEND_TO_APP
      payload: DeskThingToAppData & { app: string }
    }
  | {
      type: IPC_APP_TYPES.APP_ORDER
      payload: string[]
    }
  | {
      type: IPC_APP_TYPES.ICON
      payload: { appId: string; icon?: string }
    }
)

export type AppHandlerReturnMap = {
  [IPC_APP_TYPES.APP]: { get: App[] }
  [IPC_APP_TYPES.DATA]: { get: SavedData | null; set: void }
  [IPC_APP_TYPES.SETTINGS]: { get: AppSettings | null; set: boolean }
  [IPC_APP_TYPES.STOP]: { set: boolean }
  [IPC_APP_TYPES.DISABLE]: { set: boolean }
  [IPC_APP_TYPES.ENABLE]: { set: boolean }
  [IPC_APP_TYPES.RUN]: { set: boolean }
  [IPC_APP_TYPES.PURGE]: { set: boolean }
  [IPC_APP_TYPES.ZIP]: { set: AppDownloadReturnData }
  [IPC_APP_TYPES.URL]: { set: AppDownloadReturnData }
  [IPC_APP_TYPES.ADD]: { set: AppDownloadReturnData }
  [IPC_APP_TYPES.POSTINSTALL]: { set: boolean }
  [IPC_APP_TYPES.STAGED]: { set: void }
  [IPC_APP_TYPES.USER_DATA_RESPONSE]: { set: void }
  [IPC_APP_TYPES.SELECT_ZIP_FILE]: { set: { path: string; name: string } | null }
  [IPC_APP_TYPES.DEV_ADD_APP]: { set: void }
  [IPC_APP_TYPES.SEND_TO_APP]: { set: void }
  [IPC_APP_TYPES.APP_ORDER]: { set: void }
  [IPC_APP_TYPES.ICON]: { set: string | null }
}

export type AppHandlerReturnType<
  K extends IPC_APP_TYPES,
  R extends keyof AppHandlerReturnMap[K] = keyof AppHandlerReturnMap[K]
> = AppHandlerReturnMap[K][R]
