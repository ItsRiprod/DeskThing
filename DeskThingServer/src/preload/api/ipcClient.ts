import { Action, ActionReference, ClientManifest } from '@deskthing/types'
import {
  IPC_CLIENT_TYPES,
  ClientHandlerReturnMap,
  ClientIPCData,
  ClientHandlerReturnType,
  IPC_HANDLERS
} from '@shared/types'
import { ipcRenderer } from 'electron'

export const client = {
  pingClient: async (clientId: string): Promise<string | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.CLIENT,
      type: IPC_CLIENT_TYPES.PING_CLIENT,
      payload: clientId
    }),

  handleClientZip: async (path: string): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.CLIENT,
      type: IPC_CLIENT_TYPES.ZIP,
      payload: path
    }),

  handleClientURL: async (url: string): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.CLIENT,
      type: IPC_CLIENT_TYPES.URL,
      payload: url
    }),

  handleClientADB: async (command: string): Promise<string> =>
    await sendCommand({
      kind: IPC_HANDLERS.CLIENT,
      type: IPC_CLIENT_TYPES.ADB,
      payload: command
    }),

  getClientManifest: async (): Promise<ClientManifest | undefined | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.CLIENT,
      type: IPC_CLIENT_TYPES.CLIENT_MANIFEST,
      request: 'get'
    }),

  getDeviceManifest: async (adbId: string): Promise<ClientManifest | undefined> =>
    await sendCommand({
      kind: IPC_HANDLERS.CLIENT,
      type: IPC_CLIENT_TYPES.CLIENT_MANIFEST,
      request: 'get-device',
      payload: adbId
    }),

  updateClientManifest: async (client: Partial<ClientManifest>): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.CLIENT,
      type: IPC_CLIENT_TYPES.CLIENT_MANIFEST,
      request: 'set',
      payload: client
    }),

  updateDeviceManifest: async (adbId: string, client: Partial<ClientManifest>): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.CLIENT,
      type: IPC_CLIENT_TYPES.CLIENT_MANIFEST,
      request: 'set-device',
      payload: { adbId, client }
    }),

  pushStagedApp: async (clientId: string): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.CLIENT,
      type: IPC_CLIENT_TYPES.PUSH_STAGED,
      payload: { adbId: clientId }
    }),

  pushProxyScript: async (clientId: string): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.CLIENT,
      type: IPC_CLIENT_TYPES.PUSH_PROXY_SCRIPT,
      payload: clientId
    }),

  handleClientCommand: async (clientId: string, command: string): Promise<string | undefined> =>
    await sendCommand({
      kind: IPC_HANDLERS.CLIENT,
      type: IPC_CLIENT_TYPES.RUN_DEVICE_COMMAND,
      payload: { clientId: clientId, command: command }
    }),

  getIcon: async (action: Action | ActionReference): Promise<string | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.CLIENT,
      type: IPC_CLIENT_TYPES.ICON,
      request: 'get',
      payload: action
    })
}

const sendCommand = <T extends IPC_CLIENT_TYPES, R extends keyof ClientHandlerReturnMap[T]>(
  payload: Extract<ClientIPCData, { type: T; request?: R }>
): Promise<ClientHandlerReturnType<T, R>> => {
  const requestPayload = { ...payload, kind: IPC_HANDLERS.CLIENT }
  return ipcRenderer.invoke(IPC_HANDLERS.CLIENT, requestPayload)
}
