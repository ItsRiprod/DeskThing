/**
 * Fetches the app's data, tasks, and settings
 * Does not hold the current list of apps, their manifests, or their functions
 */

import { AppSettings, Task, AppDataInterface, Step, SettingsType } from '@deskthing/types'
import { FullTaskList, TaskReference } from '../types'
import { TaskStoreClass } from './taskStore'

/** Options for adding settings including notification flags */
export type addSettingsOptions = {
  notifyApp?: boolean
  notifyServer?: boolean
}

/** Payload type containing app ID and data */
type AppPayload<T> = { appId: string; data: T }

/** Listener types for each field in AppDataInterface except version */
export type FieldListeners = {
  [k in keyof Omit<AppDataInterface, 'version'>]: AppPayload<AppDataInterface[k]>
}

/** Events that can be listened to, including all fields and full app data */
export type AppDataStoreListenerEvents = FieldListeners & {
  appData: Record<string, AppDataInterface>
}

/** Generic listener type */
export type Listener<T> = (payload: T) => void
/** Specific listener type for AppDataStore events */
export type AppDataStoreListener<K extends keyof AppDataStoreListenerEvents> = Listener<
  AppDataStoreListenerEvents[K]
>

/** Collection of listeners for each event type */
export type AppDataStoreListeners = {
  [K in keyof AppDataStoreListenerEvents]: AppDataStoreListener<K>[]
}

/** Type for notifying listeners of events */
export type NotifyListenersType = <K extends keyof AppDataStoreListenerEvents>(
  event: K,
  payload: AppDataStoreListenerEvents[K]
) => Promise<void>

/** Main AppDataStore interface defining all available methods */
export interface AppDataStoreClass {
  /** Clears the cache */
  clearCache(): Promise<void>
  /** Saves all cached data to files */
  saveToFile(): Promise<void>
  /** Adds an event listener */
  on<K extends keyof AppDataStoreListenerEvents>(
    event: K,
    listener: AppDataStoreListener<K>
  ): () => void
  /** Removes an event listener */
  off<K extends keyof AppDataStoreListenerEvents>(event: K, listener: AppDataStoreListener<K>): void

  /** Sets up task store listeners */
  setupListeners(taskStore: TaskStoreClass): Promise<void>

  /** Deletes all data for an app */
  purgeAppData(name: string): Promise<boolean>
  /** Gets all data for an app */
  getAppData(name: string): Promise<AppDataInterface | undefined>
  /** Adds or updates app data */
  addAppData(app: string, data: AppDataInterface): Promise<void>

  /** Gets app's data field */
  getData(name: string): Promise<Record<string, string> | undefined>
  /** Adds data to app's data field */
  addData(app: string, data: Record<string, string>): Promise<void>
  /** Deletes specific data entries */
  delData(app: string, dataIds: string[] | string): Promise<void>

  /** Gets app settings */
  getSettings(name: string): Promise<AppSettings | undefined>
  /** Adds or updates multiple settings */
  addSettings(app: string, settings: AppSettings, options?: addSettingsOptions): Promise<void>
  /** Adds or updates a single setting */
  addSetting(app: string, id: string, setting: SettingsType): Promise<void>
  /** Deletes specific settings */
  delSettings(app: string, settings: string[] | string): Promise<void>

  /** Gets all tasks for an app */
  getTasks(name: string): Promise<Record<string, Task> | undefined>
  /** Gets a specific task */
  getTask(name: string, id: string): Promise<Task | undefined>
  /** Gets tasks for all apps */
  getTaskList(): Promise<FullTaskList>

  /** @deprecated use TaskStore instead - Sets tasks for an app */
  setTasks(app: string, tasks: Record<string, Task>, notifyApp?: boolean): Promise<void>
  /** @deprecated use TaskStore instead - Updates a single task */
  updateTaskList(app: string, task: Task, notifyApp?: boolean): Promise<void>
  /** @deprecated use TaskStore instead - Updates a partial task */
  updateTask(app: string, task: Partial<Task>): Promise<void>
  /** @deprecated use TaskStore instead - Updates multiple tasks */
  updateTasks(app: string, tasks: Record<string, Task>): Promise<void>
  /** @deprecated use TaskStore instead - Deletes specific tasks */
  delTasks(app: string, taskIds: string[] | string): Promise<void>

  /** @deprecated use TaskStore instead - Updates a task step */
  updateStep(app: string, taskId: string, step: Partial<Step>): Promise<void>
  /** @deprecated use TaskStore instead - Marks a step as complete */
  completeStep(taskRef: Task | TaskReference, stepId: string): Promise<void>
  /** Gets a specific step from a task */
  getStep(source: string, id: string, stepid: string): Promise<Step | undefined>

  /** Gets the icon path for an app */
  getIcon(appName: string, icon?: string): Promise<string | null>
}
