import {
  Action,
  ActionReference,
  Button,
  ButtonMapping,
  Client,
  Key,
  NotificationMessage,
  Profile
} from '@deskthing/types'
import {
  Log,
  IPC_HANDLERS,
  Settings,
  IPC_UTILITY_TYPES,
  UtilityIPCData,
  UtilityHandlerReturnType,
  UtilityHandlerReturnMap
} from '@shared/types'
import { PaginatedResponse, SupporterData, SupporterFetchOptions } from '@shared/types/supporter'
import { ipcRenderer, OpenDialogOptions, OpenDialogReturnValue } from 'electron'

export const utility = {
  ping: async (): Promise<string> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.PING
    }),

  // These should be moved from 'utility' to 'client' due to them technically being a client-related function
  getConnections: async (): Promise<Client[]> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.CONNECTIONS,
      request: 'get'
    }),

  disconnectClient: async (clientId: string): Promise<boolean> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.CONNECTIONS,
      request: 'delete',
      payload: clientId
    }),

  saveSettings: async (settings: Settings): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.SETTINGS,
      request: 'set',
      payload: settings
    }),

  getSettings: async (): Promise<Settings> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.SETTINGS,
      request: 'get'
    }),

  getLogs: async (): Promise<Log[]> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.LOGS
    }),

  shutdown: async (): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.SHUTDOWN
    }),

  openLogsFolder: async (): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.OPEN_LOG_FOLDER
    }),

  selectZipFile: async (): Promise<string | undefined> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.ZIP
    }),

  showOpenDialog: async (options: OpenDialogOptions): Promise<OpenDialogReturnValue> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.OPEN_DIALOG,
      payload: options
    }),

  refreshFirewall: async (): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.REFRESH_FIREWALL
    }),

  restartServer: async (): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.RESTART_SERVER
    }),

  getActions: async (): Promise<Action[] | void | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.ACTIONS,
      request: 'get'
    }),

  addAction: async (action: Action): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.ACTIONS,
      request: 'set',
      payload: action
    }),

  deleteAction: async (actionId: string): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.ACTIONS,
      request: 'delete',
      payload: actionId
    }),

  addButton: async (button: Button): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.BUTTONS,
      request: 'set',
      payload: button
    }),

  deleteButton: async (button: Exclude<Button, 'action'>): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.BUTTONS,
      request: 'delete',
      payload: button
    }),

  getKeys: async (): Promise<Key[] | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.KEYS,
      request: 'get'
    }),

  addKey: async (key: Key): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.KEYS,
      request: 'set',
      payload: key
    }),

  deleteKey: async (keyId: string): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.KEYS,
      request: 'delete',
      payload: keyId
    }),

  getProfiles: async (): Promise<Profile[]> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.PROFILES,
      request: 'getAll'
    }),

  getProfile: async (profileName: string): Promise<ButtonMapping | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.PROFILES,
      request: 'get',
      payload: profileName
    }),

  saveProfile: async (profile: ButtonMapping): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.PROFILES,
      request: 'set',
      payload: profile
    }),

  addProfile: async (profile: Profile): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.PROFILES,
      request: 'set',
      payload: profile
    }),

  deleteProfile: async (profileName: string): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.PROFILES,
      request: 'delete',
      payload: profileName
    }),

  getCurrentProfile: async (): Promise<Profile | null> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.MAP,
      request: 'get'
    }),

  setCurrentProfile: async (profile: Profile): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.MAP,
      request: 'set',
      payload: profile
    }),

  runAction: async (action: Action | ActionReference): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.RUN,
      payload: action
    }),

  getSupporters: async (opts: SupporterFetchOptions): Promise<PaginatedResponse<SupporterData>> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.SUPPORTERS,
      payload: opts,
      request: 'get'
    }),

  flags: {
    setFlag: async (flagId: string, flagState: boolean): Promise<void> =>
      await sendCommand({
        kind: IPC_HANDLERS.UTILITY,
        type: IPC_UTILITY_TYPES.FLAG,
        request: 'set',
        payload: { flagId, flagState }
      }),
    toggleFlag: async (flagId: string): Promise<boolean> =>
      await sendCommand({
        kind: IPC_HANDLERS.UTILITY,
        type: IPC_UTILITY_TYPES.FLAG,
        request: 'toggle',
        payload: flagId
      }),
    getFlag: async (flagId: string): Promise<boolean | undefined> =>
      await sendCommand({
        kind: IPC_HANDLERS.UTILITY,
        type: IPC_UTILITY_TYPES.FLAG,
        request: 'get',
        payload: flagId
      })
  },

  getNotifications: async (): Promise<Record<string, NotificationMessage>> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.NOTIFICATION,
      request: 'get'
    }),
  acknowledgeNotification: async (notification: NotificationMessage): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.NOTIFICATION,
      request: 'acknowledge',
      payload: notification
    }),

  restartWithTerminal: async (): Promise<boolean> =>
    await sendCommand({
      kind: IPC_HANDLERS.UTILITY,
      type: IPC_UTILITY_TYPES.DEVMODE,
      request: 'open_terminal'
    })
}

const sendCommand = <T extends IPC_UTILITY_TYPES, R extends keyof UtilityHandlerReturnMap[T]>(
  payload: Extract<UtilityIPCData, { type: T; request?: R }>
): Promise<UtilityHandlerReturnType<T, R>> => {
  const requestPayload = { ...payload, kind: IPC_HANDLERS.UTILITY }
  return ipcRenderer.invoke(IPC_HANDLERS.UTILITY, requestPayload)
}
