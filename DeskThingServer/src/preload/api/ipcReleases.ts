import {
  IPC_HANDLERS,
  IPC_RELEASE_TYPES,
  ReleaseHandlerReturnMap,
  ReleaseIPCData
} from '@shared/types'
import { AppReleaseMeta, AppReleaseCommunity, ClientReleaseMeta } from '@deskthing/types'
import { ipcRenderer } from 'electron'

export const releases = {
  refreshApp: async (repoUrl: string): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.GITHUB_REFRESH_APP,
      payload: repoUrl
    }),
  refreshApps: async (): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.GITHUB_REFRESH_APPS
    }),
  getApps: async (): Promise<AppReleaseMeta[] | AppReleaseMeta> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.GITHUB_GET_APPS
    }),
  getAppReferences: async (): Promise<AppReleaseCommunity[]> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.GITHUB_GET_APP_REFERENCES
    }),
  addAppRepo: async (repoUrl: string): Promise<AppReleaseMeta | void> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.GITHUB_ADD_APP_REPO,
      payload: repoUrl
    }),
  getClients: async (): Promise<ClientReleaseMeta[]> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.GITHUB_GET_CLIENTS
    }),
  removeAppRepo: async (repoUrl: string): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.RELEASE,
      type: IPC_RELEASE_TYPES.GITHUB_REMOVE_APP_REPO,
      payload: repoUrl
    })
}

const sendCommand = <T extends IPC_RELEASE_TYPES>(
  data: Extract<ReleaseIPCData, { type: T }>
): Promise<ReleaseHandlerReturnMap[T]> => {
  const requestPayload = { ...data, kind: IPC_HANDLERS.RELEASE }
  return ipcRenderer.invoke(IPC_HANDLERS.RELEASE, requestPayload)
}
