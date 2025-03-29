import { ClientReleaseMeta, AppReleaseCommunity, AppReleaseMeta } from '@deskthing/types'
import { IPC_HANDLERS } from './ipcTypes'

export enum IPC_RELEASE_TYPES {
  GITHUB_REFRESH_APPS = 'github:refreshApps',
  GITHUB_REFRESH_APP = 'github:refreshApp',
  GITHUB_GET_APPS = 'github:getApps',
  GITHUB_GET_APP_REFERENCES = 'github:getAppReferences',
  GITHUB_ADD_APP_REPO = 'github:addAppRepo',
  GITHUB_REMOVE_APP_REPO = 'github:removeAppRepo',
  GITHUB_GET_CLIENTS = 'github:getClients'
}

export type ReleaseIPCData = {
  kind: IPC_HANDLERS.RELEASE
} & (
  | {
      type: IPC_RELEASE_TYPES.GITHUB_REFRESH_APPS
    }
  | {
      type: IPC_RELEASE_TYPES.GITHUB_REFRESH_APP
      payload: string
    }
  | {
      type: IPC_RELEASE_TYPES.GITHUB_GET_APPS
    }
  | {
      type: IPC_RELEASE_TYPES.GITHUB_GET_APP_REFERENCES
    }
  | {
      type: IPC_RELEASE_TYPES.GITHUB_ADD_APP_REPO
      payload: string
    }
  | {
      type: IPC_RELEASE_TYPES.GITHUB_REMOVE_APP_REPO
      payload: string
    }
  | {
      type: IPC_RELEASE_TYPES.GITHUB_GET_CLIENTS
    }
)
export type ReleaseHandlerReturnMap = {
  [IPC_RELEASE_TYPES.GITHUB_GET_CLIENTS]: ClientReleaseMeta[]
  [IPC_RELEASE_TYPES.GITHUB_GET_APP_REFERENCES]: AppReleaseCommunity[]
  [IPC_RELEASE_TYPES.GITHUB_GET_APPS]: AppReleaseMeta[] | AppReleaseMeta
  [IPC_RELEASE_TYPES.GITHUB_REFRESH_APPS]: void
  [IPC_RELEASE_TYPES.GITHUB_REFRESH_APP]: void
  [IPC_RELEASE_TYPES.GITHUB_ADD_APP_REPO]: AppReleaseMeta | void
  [IPC_RELEASE_TYPES.GITHUB_REMOVE_APP_REPO]: void
}
