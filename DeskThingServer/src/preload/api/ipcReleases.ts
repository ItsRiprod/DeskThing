import {
  IPC_HANDLERS,
  IPC_RELEASE_TYPES,
  ReleaseHandlerReturnMap,
  ReleaseIPCData
} from '@shared/types'
import { AppLatestServer, ClientLatestServer } from '@shared/types/releases'
import { ipcRenderer } from 'electron'

export const releases = {
  refreshReleases: async (options?: { force?: boolean }): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.REFRESH_RELEASES,
      options
    }),
  getApps: async (): Promise<AppLatestServer[] | AppLatestServer> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.GET_APPS
    }),
  getAppRepositories: async (): Promise<string[]> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.GET_APP_REPOSITORIES
    }),
  addAppRepo: async (repoUrl: string): Promise<AppLatestServer | void> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.ADD_APP_REPOSITORY,
      payload: repoUrl
    }),
  removeAppRepo: async (repoUrl: string): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.REMOVE_APP_REPOSITORY,
      payload: repoUrl
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
  addClientRepo: async (repoUrl: string): Promise<ClientLatestServer | void> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.ADD_CLIENT_REPOSITORY,
      payload: repoUrl
    }),
  removeClientRepo: async (repoUrl: string): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.REMOVE_CLIENT_REPOSITORY,
      payload: repoUrl
    })
}

const sendCommand = <T extends IPC_RELEASE_TYPES>(
  data: Extract<ReleaseIPCData, { type: T }>
): Promise<ReleaseHandlerReturnMap[T]> => {
  const requestPayload = { ...data, kind: IPC_HANDLERS.RELEASE }
  return ipcRenderer.invoke(IPC_HANDLERS.RELEASE, requestPayload)
}