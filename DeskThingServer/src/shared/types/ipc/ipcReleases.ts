import { IPC_HANDLERS } from './ipcTypes'
import { AppLatestServer, ClientLatestServer, RefreshOptions } from '../releases'
import { ClientManifest } from '@deskthing/types'
import { StagedAppManifest } from '../app'

export enum IPC_RELEASE_TYPES {
  REFRESH_RELEASES = 'github:refresh',
  ADD_REPOSITORY = 'github:addRepo',

  GET_APPS = 'github:getApps',
  GET_APP_REPOSITORIES = 'github:getAppRepositories',
  REMOVE_APP_REPOSITORY = 'github:removeAppRepo',
  DOWNLOAD_APP = 'github:downloadApp',

  GET_CLIENTS = 'github:getClients',
  GET_CLIENT_REPOSITORIES = 'github:getClientRepositories',
  REMOVE_CLIENT_REPOSITORY = 'github:removeClientRepo',
  DOWNLOAD_CLIENT = 'github:downloadClient'
}

export type ReleaseIPCData = {
  kind: IPC_HANDLERS.RELEASE
} & (
  | {
      type: IPC_RELEASE_TYPES.REFRESH_RELEASES
      options?: RefreshOptions
    }
  | {
      type: IPC_RELEASE_TYPES.ADD_REPOSITORY
      payload: string
    }
  | {
      type: IPC_RELEASE_TYPES.GET_APPS
    }
  | {
      type: IPC_RELEASE_TYPES.GET_APP_REPOSITORIES
    }
  | {
      type: IPC_RELEASE_TYPES.REMOVE_APP_REPOSITORY
      payload: string
    }
  | {
      type: IPC_RELEASE_TYPES.DOWNLOAD_APP
      payload: string
    }
  | {
      type: IPC_RELEASE_TYPES.GET_CLIENTS
    }
  | {
      type: IPC_RELEASE_TYPES.GET_CLIENT_REPOSITORIES
    }
  | {
      type: IPC_RELEASE_TYPES.REMOVE_CLIENT_REPOSITORY
      payload: string
    }
  | {
      type: IPC_RELEASE_TYPES.DOWNLOAD_CLIENT
      payload: string
    }
)

export type ReleaseHandlerReturnMap = {
  [IPC_RELEASE_TYPES.REFRESH_RELEASES]: void
  [IPC_RELEASE_TYPES.ADD_REPOSITORY]: AppLatestServer[] | ClientLatestServer[] | undefined

  [IPC_RELEASE_TYPES.GET_APPS]: AppLatestServer[]
  [IPC_RELEASE_TYPES.GET_APP_REPOSITORIES]: string[]
  [IPC_RELEASE_TYPES.REMOVE_APP_REPOSITORY]: void
  [IPC_RELEASE_TYPES.DOWNLOAD_APP]: StagedAppManifest | undefined

  [IPC_RELEASE_TYPES.GET_CLIENTS]: ClientLatestServer[]
  [IPC_RELEASE_TYPES.GET_CLIENT_REPOSITORIES]: string[]
  [IPC_RELEASE_TYPES.REMOVE_CLIENT_REPOSITORY]: void
  [IPC_RELEASE_TYPES.DOWNLOAD_CLIENT]: ClientManifest | undefined
}
