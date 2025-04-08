import { App, AppManifest, APP_REQUESTS, DeskThingToAppData } from '@deskthing/types'
import { stageAppFileType } from '@server/services/apps/appInstaller'
import { ReplyFn, StagedAppManifest } from '../types'
import { AppDataFilters, AppProcessListener } from './appProcessStore'
import { StoreInterface } from '@shared/interfaces/storeInterface'

export type addSettingsOptions = {
  notifyApp?: boolean
  notifyServer?: boolean
}

export type AppStoreListenerEvents = {
  apps: { data: App[] }
  purging: { appName: string }
}

// Create listener types automatically from event map
export type Listener<T> = (payload: T) => void
export type AppStoreListener<K extends keyof AppStoreListenerEvents> = Listener<
  AppStoreListenerEvents[K]
>

// Create listeners collection type automatically
export type AppStoreListeners = {
  [K in keyof AppStoreListenerEvents]: AppStoreListener<K>[]
}

export interface AppStoreClass extends StoreInterface {
  // Utility

  clearCache(): Promise<void>
  saveToFile(): Promise<void>
  on<K extends keyof AppStoreListenerEvents>(event: K, listener: AppStoreListener<K>): () => void
  off<K extends keyof AppStoreListenerEvents>(event: K, listener: AppStoreListener<K>): void
  onAppMessage<T extends APP_REQUESTS>(
    type: T,
    listener: AppProcessListener<T>,
    filters?: AppDataFilters<T>
  ): () => void

  // App list management

  add(app: App): void
  get(name: string): App | undefined

  /**
   * Returns all the apps in the order they should be displayed
   * @description Gets all apps
   * @returns all apps
   */
  getAll(): App[]

  /**
   * Gets all of the apps in the system
   * @returns
   * @deprecated - use {@link AppStore.getAll} instead
   */
  getAllBase(): App[]
  reorder(order: string[]): void
  setItemOrder(name: string, newIndex: number): void
  getOrder(): string[]

  // App communication / management
  sendDataToApp(name: string, data: DeskThingToAppData): Promise<void>
  broadcastToApps(data: DeskThingToAppData): Promise<void>
  purge(name: string): Promise<boolean>

  /**
   * Enables the app so that it will be run on startup
   * @param name The ID of the app
   * @returns
   */
  enable(name: string): Promise<boolean>

  /**
   * Disabling an app will clear the cache from everything but the files it is stored in.
   * Additionally, a disabled app wont be run on startup
   * @param name THe ID of the app to disable
   * @returns
   */
  disable(name: string): Promise<boolean>

  /**
   * Stopping the app will just try to ask the app to stop
   * @param name The ID of the app
   * @returns
   */
  stop(name: string): Promise<boolean>

  /**
   * Attempts to run the app assuming it has never been run before
   * @param name The ID of the app
   * @returns
   */
  run(name: string): Promise<boolean>
  start(name: string): Promise<boolean>

  /**
   * Runs the currently staged app
   * @returns Promise<void>
   */
  runStagedApp(options: {
    reply?: ReplyFn
    overwrite?: boolean
    appId?: string
    run?: boolean
  }): Promise<void>

  /**
   * Adds an app to the app store
   * @param filePath The app path (url or local path) to add
   * @returns The app manifest that was added
   */
  addApp(options: stageAppFileType): Promise<StagedAppManifest | undefined>

  /**
   * Appends a manifest to the app
   * @param manifest
   * @param appName
   */
  appendManifest(manifest: AppManifest, appName: string): Promise<void>

  /**
   * Fetches the icon.svg from the file system and returns the file:// path for it
   */
  getIcon(appName: string, icon?: string): Promise<string | null>
}
