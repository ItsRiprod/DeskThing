import {
  App,
  APP_REQUESTS,
  AppToDeskThingData,
  DeskThingProcessData,
  DeskThingToAppData
} from '@deskthing/types'
import { StoreInterface } from '@shared/interfaces/storeInterface'
import EventEmitter from 'node:events'

export enum AppProcessTypes {
  STARTED = 'started',
  STOPPED = 'stopped',
  EXITED = 'exit',
  RUNNING = 'running',
  ERROR = 'error',
  BINARY = 'binary'
}

type AppProcessEvent = {
  [AppProcessTypes.STARTED]: [string]
  [AppProcessTypes.STOPPED]: [string]
  [AppProcessTypes.EXITED]: [string]
  [AppProcessTypes.RUNNING]: [string]
  [AppProcessTypes.ERROR]: [string]
  [AppProcessTypes.BINARY]: [{ appName: string; data: Buffer; clientId?: string }]
}

export type AppProcessEvents = AppProcessEvent & {
  [T in APP_REQUESTS]: [Extract<AppToDeskThingData, { type: T; source: string }>]
}

export type AppDataFilters<T extends APP_REQUESTS> = {
  request?: Extract<AppToDeskThingData, { type: T }>['request']
  app?: string
}

export type AppProcessEventListener = (appName: string, reason?: string) => void

export type AppProcessListener<T extends APP_REQUESTS> = (
  appData: Extract<AppToDeskThingData, { type: T }> & { source: string }
) => void | Promise<void>

export type AppProcessListeners = {
  [key in APP_REQUESTS]: AppProcessListener<key>
}

/**
 * The AppProcessStore class is focused solely on process communication
 * and handling the direct lifecycle of electron processes.
 */
export interface AppProcessStoreClass extends StoreInterface, EventEmitter<AppProcessEvents> {
  /**
   * Post a message to a specific app process
   */
  postMessage(appName: string, data: DeskThingProcessData): Promise<void>

  postBinary(appName: string, data: DeskThingToAppData, transferList?: ArrayBuffer[]): Promise<void>

  /**
   * Get list of process IDs that are currently running
   */
  getActiveProcessIds(): string[]

  /**
   * Spawn a new process for an app
   */
  spawnProcess(app: App, options?: unknown): Promise<boolean>

  /**
   * Terminate a process
   */
  terminateProcess(appName: string): Promise<boolean>
}
