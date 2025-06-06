import { ipcRenderer } from 'electron'
import {
  IPC_APP_TYPES,
  AppHandlerReturnMap,
  AppHandlerReturnType,
  AppIPCData,
  IPC_HANDLERS,
  StagedAppManifest
} from '@shared/types'
import {
  AppManifest,
  AppReleaseSingleMeta,
  AppSettings,
  DeskThingToAppData,
  App,
  SavedData
} from '@deskthing/types'

export const app = {
  get: async (): Promise<App[]> =>
    await sendCommand({
      kind: IPC_HANDLERS.APPS,
      type: IPC_APP_TYPES.APP,
      request: 'get'
    }),

  getData: async (appId: string): Promise<SavedData | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.APPS,
      type: IPC_APP_TYPES.DATA,
      request: 'get',
      payload: appId
    }),

  setData: async (appId: string, data: SavedData): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.APPS,
      type: IPC_APP_TYPES.DATA,
      request: 'set',
      payload: { appId, data }
    }),

  getSettings: async (appId: string): Promise<AppSettings | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.APPS,
      type: IPC_APP_TYPES.SETTINGS,
      request: 'get',
      payload: appId
    }),

  setSettings: async (appId: string, settings: AppSettings): Promise<boolean> =>
    await sendCommand({
      kind: IPC_HANDLERS.APPS,
      type: IPC_APP_TYPES.SETTINGS,
      request: 'set',
      payload: { appId, settings }
    }),

  stop: async (appId: string): Promise<boolean> =>
    await sendCommand({
      kind: IPC_HANDLERS.APPS,
      type: IPC_APP_TYPES.STOP,
      payload: appId
    }),

  disable: async (appId: string): Promise<boolean> =>
    await sendCommand({
      kind: IPC_HANDLERS.APPS,
      type: IPC_APP_TYPES.DISABLE,
      payload: appId
    }),

  enable: async (appId: string): Promise<boolean> =>
    await sendCommand({
      kind: IPC_HANDLERS.APPS,
      type: IPC_APP_TYPES.ENABLE,
      payload: appId
    }),

  run: async (appId: string): Promise<boolean> =>
    await sendCommand({
      kind: IPC_HANDLERS.APPS,
      type: IPC_APP_TYPES.RUN,
      payload: appId
    }),

  purge: async (appId: string): Promise<boolean> =>
    await sendCommand({
      kind: IPC_HANDLERS.APPS,
      type: IPC_APP_TYPES.PURGE,
      payload: appId
    }),

  runPostinstall: async (appId: string): Promise<boolean> =>
    await sendCommand({
      kind: IPC_HANDLERS.APPS,
      type: IPC_APP_TYPES.POSTINSTALL,
      payload: appId
    }),

  /** @deprecated */
  handleZip: async (path: string): Promise<AppManifest | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.APPS,
      type: IPC_APP_TYPES.ZIP,
      payload: path
    }),

  /** @deprecated */
  handleUrl: async (url: string): Promise<AppManifest | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.APPS,
      type: IPC_APP_TYPES.URL,
      payload: url
    }),

  add: async ({
    appPath,
    releaseMeta
  }: {
    appPath?: string
    releaseMeta?: AppReleaseSingleMeta
  }): Promise<StagedAppManifest | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.APPS,
      type: IPC_APP_TYPES.ADD,
      payload: { filePath: appPath, meta: releaseMeta }
    }),
  getIcon: async (appId: string, icon?: string): Promise<string | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.APPS,
      type: IPC_APP_TYPES.ICON,
      payload: { appId, icon }
    }),
  runStaged: async (appId: string, overwrite: boolean): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.APPS,
      type: IPC_APP_TYPES.STAGED,
      payload: { appId, overwrite }
    }),

  handleResponseToUserData: async (requestId: string, payload: DeskThingToAppData): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.APPS,
      type: IPC_APP_TYPES.USER_DATA_RESPONSE,
      payload: { requestId, response: payload }
    }),

  handleDevAppZip: async (path: string): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.APPS,
      type: IPC_APP_TYPES.DEV_ADD_APP,
      payload: { appPath: path }
    }),

  sendData: async (data: DeskThingToAppData & { app: string }): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.APPS,
      type: IPC_APP_TYPES.SEND_TO_APP,
      payload: data
    }),

  order: async (data: string[]): Promise<void> =>
    await sendCommand({
      type: IPC_APP_TYPES.APP_ORDER,
      payload: data,
      kind: IPC_HANDLERS.APPS
    })
}

const sendCommand = <T extends IPC_APP_TYPES, R extends keyof AppHandlerReturnMap[T]>(
  payload: Extract<AppIPCData, { type: T; request?: R }>
): Promise<AppHandlerReturnType<T, R>> => {
  const requestPayload = { ...payload, kind: IPC_HANDLERS.APPS }
  return ipcRenderer.invoke(IPC_HANDLERS.APPS, requestPayload)
}
