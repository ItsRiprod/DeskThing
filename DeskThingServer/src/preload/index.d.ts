import { ElectronAPI } from '@electron-toolkit/preload'
import {
  ActionReference,
  AppReleaseCommunity,
  AppReleaseMeta,
  AppSettings,
  ClientManifest
} from '@DeskThing/types'
import {
  Profile,
  Client,
  ButtonMapping,
  Log,
  SortedReleases,
  StagedAppManifest,
  ADBClient
} from '@shared/types'

type AppData = Record<string, string>

declare global {
  interface Window {
    electronAPI: {
      platform: NodeJS.Platform
    }
    electron: ElectronAPI & {
      ping: () => Promise<string>
      pingClient: (clientId: string) => Promise<string | null>
      getApps: () => Promise<App[]>
      getAppData: (appId: string) => Promise<Record<string, string> | null>
      setAppData: (appId: string, data: Record<string, string>) => Promise<void>
      getAppSettings: (appId: string) => Promise<AppSettings | null>
      setAppSettings: (appId: string, settings: AppSettings) => Promise<void>
      stopApp: (appId: string) => Promise<void>
      disableApp: (appId: string) => Promise<void>
      runApp: (appId: string) => Promise<void>
      enableApp: (appId: string) => Promise<void>
      purgeApp: (appId: string) => Promise<void>
      app: {
        add: (data: {
          appPath?: string
          releaseMeta?: AppReleaseSingleMeta
        }) => Promise<StagedAppManifest>
        getIcon: (appId: string, icon?: string) => Promise<string | null>
        runStaged: (appId: string, overwrite: boolean) => Promise<void>
      }

      handleResponseToUserData: (requestId: string, payload: ToAppData) => Promise<void>
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
      getDevices: () => Promise<ADBClient[]>
      disconnectClient: (connectionId: string) => Promise<void>
      saveSettings: (settings: Settings) => Promise<void>
      getSettings: () => Promise<Settings>
      github: {
        refreshApp: (repoUrl: string) => Promise<void>
        refreshApps: () => Promise<void>
        getApps: () => Promise<AppReleaseMeta[]>
        getAppReferences: () => Promise<AppReleaseCommunity[]>
        addAppRepo: (repoUrl: string) => Promise<AppReleaseMeta>
        getClients: () => Promise<SortedReleases>
        removeAppRepo: (repoUrl: string) => Promise<void>
      }
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

      tasks: {
        getTaskList: () => Promise<TaskList>
        stopTask: (taskId: string) => Promise<void>
        startTask: (taskId: string) => Promise<void>
        completeStep: (taskId: string, stepId: string) => Promise<void>
        completeTask: (taskId: string) => Promise<void>
        restartTask: (taskId: string) => Promise<void>
        pauseTask: () => Promise<void>
        nextStep: (taskId: string) => Promise<void>
        prevStep: (taskId: string) => Promise<void>
        updateStep: (taskId: string, step: Partial<Step>) => Promise<void>
        updateTask: (task: Partial<Task>) => Promise<void>
      }

      update: {
        check: () => Promise<void>
        download: () => Promise<void>
        install: () => Promise<void>
      }
      feedback: {
        submit: (feedback: FeedbackReport) => Promise<void>
        getSysInfo: () => Promise<getSysInfo>
      }
    }
    api: unknown // Or define `api` more specifically if you have a shape for it
  }
}
