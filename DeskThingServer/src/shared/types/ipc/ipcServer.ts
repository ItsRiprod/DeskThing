/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Action,
  App,
  AppManifest,
  AppReleaseCommunity,
  AppReleaseMeta,
  AppSettings,
  AuthScopes,
  ButtonMapping,
  Client,
  ClientManifest,
  ClientReleaseMeta,
  Task,
  Key
} from '@deskthing/types'
import { BrowserWindow, IpcRendererEvent } from 'electron'
import { ProgressEvent, Log, Settings } from '..'

export type IpcRendererCallback<T extends ServerIPCData['type']> = (
  event: IpcRendererEvent,
  response: Extract<ServerIPCData, { type: T }>['payload']
) => void

export type IpcRendererFunction = <T extends ServerIPCData['type']>(
  channel: T,
  callback: IpcRendererCallback<T>
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
      type: 'clients'
      payload: Client[]
    }
  | {
      type: 'platform:client'
      payload: {
        request: 'added'
        client: Client
      }
    }
  | {
      type: 'platform:client'
      payload: {
        request: 'removed'
        clientId: string
      }
    }
  | {
      type: 'platform:client'
      payload: {
        request: 'modified'
        client: Client
      }
    }
  | {
      type: 'platform:client'
      payload: {
        request: 'list'
        clients: Client[]
      }
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
      type: 'staged-manifest'
      payload: ClientManifest
    }
  | {
      type: 'display-user-form'
      payload: {
        requestId: string
        scope: AuthScopes
      }
    }
  | {
      type: 'progress:event'
      payload: ProgressEvent
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
