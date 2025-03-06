import { EventPayload, SEND_TYPES, ToServerData } from '@deskthing/types'
import { Log } from '@shared/types'

export enum AppProcessEvents {
  STARTED = 'started',
  STOPPED = 'stopped',
  EXITED = 'exit',
  RUNNING = 'running',
  ERROR = 'error'
}

export type FAppProcessPayload =
  | { type: 'data'; payload: ToServerData }
  | { type: 'start' }
  | { type: 'server:error'; payload: Error }
  | { type: 'server:log'; payload: Log }

export type TAppProcessPayload =
  | { type: 'data'; payload: EventPayload }
  | { type: 'start' }
  | { type: 'stop' }
  | { type: 'purge' }

export type AppDataFilters<T extends SEND_TYPES> = {
  request?: Extract<ToServerData, { type: T }>['request']
  app?: string
}

export type AppProcessEventListener = (appName: string, reason?: string) => void

export type AppProcessListener<T extends SEND_TYPES> = (
  appData: Extract<ToServerData, { type: T }> & { source: string }
) => void | Promise<void>

export type AppProcessListeners = {
  [key in SEND_TYPES]: AppProcessListener<key>
}

/**
 * The AppProcessStore class is focused solely on process communication
 * and handling the direct lifecycle of electron processes.
 */
export interface AppProcessStoreClass {
  /**
   * Post a message to a specific app process
   */
  postMessage(appName: string, data: TAppProcessPayload): Promise<void>

  /**
   * Subscribe to process lifecycle events
   */
  onProcessEvent(type: AppProcessEvents, callback: AppProcessEventListener): () => void

  /**
   * Subscribe to messages from processes
   * Use '*' to subscribe to all types
   */
  onMessage<T extends SEND_TYPES>(
    type: T,
    listener: AppProcessListener<T>,
    filters?: AppDataFilters<T>
  ): () => void

  /**
   * Unsubscribe from messages
   */
  offMessage<T extends SEND_TYPES>(type: T, listener: AppProcessListener<T>): void

  /**
   * Get list of process IDs that are currently running
   */
  getActiveProcessIds(): string[]

  /**
   * Spawn a new process for an app
   */
  spawnProcess(appName: string, options?: unknown): Promise<boolean>

  /**
   * Terminate a process
   */
  terminateProcess(appName: string): Promise<boolean>
}
