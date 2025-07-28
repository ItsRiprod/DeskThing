import { IPC_HANDLERS } from './ipcTypes'
import {
  AppLatestServer,
  ClientDownloadReturnData,
  ClientLatestServer,
  GithubRepository,
  RefreshOptions
} from '../releases'
import { GitRepoUrl } from '@deskthing/types'
import { AppDownloadReturnData } from '../app'

export enum IPC_RELEASE_TYPES {
  REFRESH_RELEASES = 'github:refresh',
  ADD_REPOSITORY = 'github:addRepo',
  GET_REPOSITORIES = 'github:getRepositories',
  GET_REPO_ASSETS = 'github:getRepoAssets',

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
      type: IPC_RELEASE_TYPES.GET_REPOSITORIES
    }
  | {
      type: IPC_RELEASE_TYPES.GET_REPO_ASSETS
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
  [IPC_RELEASE_TYPES.GET_REPOSITORIES]: GitRepoUrl[]
  [IPC_RELEASE_TYPES.GET_REPO_ASSETS]: GithubRepository[]

  [IPC_RELEASE_TYPES.GET_APPS]: AppLatestServer[]
  [IPC_RELEASE_TYPES.GET_APP_REPOSITORIES]: string[]
  [IPC_RELEASE_TYPES.REMOVE_APP_REPOSITORY]: void
  [IPC_RELEASE_TYPES.DOWNLOAD_APP]: AppDownloadReturnData

  [IPC_RELEASE_TYPES.GET_CLIENTS]: ClientLatestServer[]
  [IPC_RELEASE_TYPES.GET_CLIENT_REPOSITORIES]: string[]
  [IPC_RELEASE_TYPES.REMOVE_CLIENT_REPOSITORY]: void
  [IPC_RELEASE_TYPES.DOWNLOAD_CLIENT]: ClientDownloadReturnData
}
