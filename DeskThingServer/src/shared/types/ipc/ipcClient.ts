import { Action, ActionReference, ClientManifest } from '@deskthing/types'
import { IPC_HANDLERS } from './ipcTypes'

export enum IPC_CLIENT_TYPES {
  ZIP = 'zip',
  URL = 'url',
  PING_CLIENT = 'pingClient',
  CLIENT_MANIFEST = 'client-manifest',
  PUSH_STAGED = 'push-staged',
  PUSH_PROXY_SCRIPT = 'push-proxy-script',
  ADB = 'adb',
  OPEN_CLIENT = 'open-client',
  RUN_DEVICE_COMMAND = 'run-device-command',
  ICON = 'icon',
  DOWNLOAD_LATEST = 'download-latest'
}

export type ClientIPCData = {
  kind: IPC_HANDLERS.CLIENT
} & (
  | {
      type: IPC_CLIENT_TYPES.ZIP
      payload: string
    }
  | {
      type: IPC_CLIENT_TYPES.URL
      payload: string
    }
  | {
      type: IPC_CLIENT_TYPES.PING_CLIENT
      payload: string
    }
  | {
      type: IPC_CLIENT_TYPES.CLIENT_MANIFEST
      request: 'get'
    }
  | {
      type: IPC_CLIENT_TYPES.CLIENT_MANIFEST
      request: 'get-device'
      payload: string // adb id
    }
  | {
      type: IPC_CLIENT_TYPES.DOWNLOAD_LATEST
    }
  | {
      type: IPC_CLIENT_TYPES.CLIENT_MANIFEST
      request: 'set-device'
      payload: { adbId: string; client: Partial<ClientManifest> }
    }
  | {
      type: IPC_CLIENT_TYPES.CLIENT_MANIFEST
      request: 'set'
      payload: Partial<ClientManifest>
    }
  | {
      type: IPC_CLIENT_TYPES.PUSH_STAGED
      payload: { adbId: string }
    }
  | {
      type: IPC_CLIENT_TYPES.PUSH_PROXY_SCRIPT
      payload: string
    }
  | {
      type: IPC_CLIENT_TYPES.ADB
      payload: string
    }
  | {
      type: IPC_CLIENT_TYPES.RUN_DEVICE_COMMAND
      payload: { clientId: string; command: string }
    }
  | {
      type: IPC_CLIENT_TYPES.ICON
      request: 'get'
      payload: Action | ActionReference
    }
  | {
      type: IPC_CLIENT_TYPES.ICON
      request: 'set'
      payload: { id: string; icon: string }
    }
  | {
      type: IPC_CLIENT_TYPES.OPEN_CLIENT
    }
)
export type ClientHandlerReturnMap = {
  [IPC_CLIENT_TYPES.ZIP]: { set: void }
  [IPC_CLIENT_TYPES.URL]: { set: void }
  [IPC_CLIENT_TYPES.PING_CLIENT]: { set: string }
  [IPC_CLIENT_TYPES.CLIENT_MANIFEST]: {
    get: ClientManifest | undefined | null
    'get-device': ClientManifest | undefined
    'set-device': void
    set: void
  }
  [IPC_CLIENT_TYPES.PUSH_STAGED]: { set: void }
  [IPC_CLIENT_TYPES.PUSH_PROXY_SCRIPT]: { set: void }
  [IPC_CLIENT_TYPES.ADB]: { set: string }
  [IPC_CLIENT_TYPES.RUN_DEVICE_COMMAND]: { set: string | undefined }
  [IPC_CLIENT_TYPES.ICON]: { set: void; get: string | null }
  [IPC_CLIENT_TYPES.OPEN_CLIENT]: { set: boolean }
  [IPC_CLIENT_TYPES.DOWNLOAD_LATEST]: { set: ClientManifest | undefined }
}

export type ClientHandlerReturnType<
  K extends IPC_CLIENT_TYPES,
  R extends keyof ClientHandlerReturnMap[K] = keyof ClientHandlerReturnMap[K]
> = ClientHandlerReturnMap[K][R]
