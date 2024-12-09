import { ElectronAPI } from '@electron-toolkit/preload'
import {
  ActionReference,
  AppDataInterface,
  AppReturnData,
  ButtonMapping,
  Client,
  ClientManifest,
  Log,
  Profile
} from '@shared/types'

type AppData = { [key: string]: string }

declare global {
  interface Window {
    electron: ElectronAPI & {
      ping: () => Promise<string>
      pingClient: (clientId: string) => Promise<string | null>
      getApps: () => Promise<App[]>
      getAppData: (appId: string) => Promise<AppDataInterface | null>
      setAppData: (appId: string, data: AppDataInterface) => Promise<void>
      stopApp: (appId: string) => Promise<void>
      disableApp: (appId: string) => Promise<void>
      runApp: (appId: string) => Promise<void>
      enableApp: (appId: string) => Promise<void>
      purgeApp: (appId: string) => Promise<void>
      handleAppZip: (path: string) => Promise<AppReturnData | null>
      handleAppUrl: (url: string) => Promise<AppReturnData | null>
      handleResponseToUserData: (requestId: string, payload: IncomingData) => Promise<void>
      handleDevAppZip: (path: string) => Promise<void>
      sendDataToApp: (data: SocketData) => Promise<void>
      orderApps: (data: string[]) => Promise<void>
      handleClientZip: (path: string) => Promise<void>
      handleClientURL: (url: string) => Promise<void>
      handleClientADB: (command: string) => Promise<string>
      configureDevice: (deviceId: string) => Promise<void>
      getClientManifest: () => Promise<ClientManifest>
      updateClientManifest: (client: Partial<Client>) => Promise<void>
      pushStagedApp: (clientId: string) => Promise<void>
      pushProxyScript: (clientId: string) => Promise<void>
      handleClientCommand: (command: SocketData) => Promise<void>
      ping: () => Promise<void>
      getConnections: () => Promise<Client[]>
      getDevices: () => Promise<string[]>
      disconnectClient: (connectionId: string) => Promise<void>
      saveSettings: (settings: Settings) => Promise<void>
      getSettings: () => Promise<Settings>
      fetchGithub: (url: string) => Promise<GithubRelease[]>
      getLogs: () => Promise<Log[]>
      shutdown: () => Promise<void>
      openLogsFolder: () => Promise<void>
      selectZipFile: () => Promise<string | undefined>
      refreshFirewall: () => Promise<void>
      restartServer: () => Promise<void>

      getActions: () => Promise<Action[]>
      addAction: (action: Action) => Promise<void>
      deleteAction: (actionId: string) => Promise<void>

      addButton: (button: Button) => Promise<void>
      deleteButton: (button: Exclude<'action', Button>) => Promise<void>

      getKeys: () => Promise<Key[]>
      addKey: (key: Key) => Promise<void>
      deleteKey: (keyId: string) => Promise<void>

      getIcon: (action: Action | ActionReference) => Promise<string>

      getProfiles: () => Promise<Profile[]>
      getProfile: (profileName: string) => Promise<ButtonMapping>
      getCurrentProfile: () => Promise<Profile>
      setCurrentProfile: (profile: Profile) => Promise<void>
      addProfile: (profile: Profile) => Promise<void>
      saveProfile: (profile: ButtonMapping) => Promise<void>
      deleteProfile: (profile: string) => Promise<void>

      runAction: (action: Action | ActionReference) => Promise<void>
    }
    api: unknown // Or define `api` more specifically if you have a shape for it
  }
}
