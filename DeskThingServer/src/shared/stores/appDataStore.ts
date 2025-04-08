/**
 * Fetches the app's data, tasks, and settings
 * Does not hold the current list of apps, their manifests, or their functions
 */

import {
  AppSettings,
  Task,
  AppDataInterface,
  Step,
  SettingsType,
  SavedData,
  Action,
  Key
} from '@deskthing/types'
import { FullTaskList, TaskReference } from '../types'
import { TaskStoreClass } from './taskStore'
import { StoreInterface } from '@shared/interfaces/storeInterface'
import { EventEmitter } from 'node:events'

/** Options for adding settings including notification flags */
export type addSettingsOptions = {
  notifyApp?: boolean
  notifyServer?: boolean
}

/** Payload type containing app ID and data */
type AppPayload<T> = { appId: string; data: T }

/** Listener types for each field in AppDataInterface except version */
export type AppStoreEvents = {
  appData: [Record<string, AppDataInterface>]
  settings: [AppPayload<AppSettings>]
  data: [AppPayload<SavedData>]
  tasks: [AppPayload<Record<string, Task>>]
  actions: [AppPayload<Record<string, Action>>]
  keys: [AppPayload<Record<string, Key>>]
}

/** Main AppDataStore interface defining all available methods */
export interface AppDataStoreClass extends StoreInterface, EventEmitter<AppStoreEvents> {
  /** Clears the cache */
  clearCache(): Promise<void>
  /** Saves all cached data to files */
  saveToFile(): Promise<void>
  /** Sets up task store listeners */
  setupListeners(taskStore: TaskStoreClass): Promise<void>

  /** Deletes all data for an app */
  purgeAppData(name: string): Promise<boolean>
  /** Gets all data for an app */
  getAppData(name: string): Promise<AppDataInterface | undefined>
  /** Adds or updates app data */
  addAppData(app: string, data: AppDataInterface): Promise<void>

  /** Gets app's data field */
  getSavedData(name: string): Promise<SavedData | undefined>
  /** Adds data to app's data field */
  addData(app: string, data: SavedData): Promise<void>
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
  /** Updates a single setting */
  updateSetting(app: string, id: string, setting: SettingsType['value']): Promise<void>

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
