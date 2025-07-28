import {
  AppDownloadReturnData,
  IPC_HANDLERS,
  IPC_RELEASE_TYPES,
  ReleaseHandlerReturnMap,
  ReleaseIPCData
} from '@shared/types'
import {
  AppLatestServer,
  ClientDownloadReturnData,
  ClientLatestServer,
  GithubRepository
} from '@shared/types/releases'
import { ipcRenderer } from 'electron'

export const releases = {
  refreshReleases: async (options?: { force?: boolean }): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.REFRESH_RELEASES,
      options
    }),
  addRepositoryUrl: async (
    repoUrl: string
  ): Promise<ClientLatestServer[] | AppLatestServer[] | undefined> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.ADD_REPOSITORY,
      payload: repoUrl
    }),
  getAllRepositories: async (): Promise<GithubRepository[]> => await sendCommand({
    kind: IPC_HANDLERS.RELEASE,
    type: IPC_RELEASE_TYPES.GET_REPO_ASSETS
  }),
  getApps: async (): Promise<AppLatestServer[]> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.GET_APPS
    }),
  getAppRepositories: async (): Promise<string[]> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.GET_APP_REPOSITORIES
    }),
  removeAppRepo: async (repoUrl: string): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.REMOVE_APP_REPOSITORY,
      payload: repoUrl
    }),
  downloadApp: async (appId: string): Promise<AppDownloadReturnData> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.DOWNLOAD_APP,
      payload: appId
    }),
  getClients: async (): Promise<ClientLatestServer[]> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.GET_CLIENTS
    }),
  getClientRepositories: async (): Promise<string[]> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.GET_CLIENT_REPOSITORIES
    }),
  removeClientRepo: async (repoUrl: string): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.REMOVE_CLIENT_REPOSITORY,
      payload: repoUrl
    }),
  downloadClient: async (clientId: string): Promise<ClientDownloadReturnData> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.DOWNLOAD_CLIENT,
      payload: clientId
    })
}

const sendCommand = <T extends IPC_RELEASE_TYPES>(
  data: Extract<ReleaseIPCData, { type: T }>
): Promise<ReleaseHandlerReturnMap[T]> => {
  const requestPayload = { ...data, kind: IPC_HANDLERS.RELEASE }
  return ipcRenderer.invoke(IPC_HANDLERS.RELEASE, requestPayload)
}
