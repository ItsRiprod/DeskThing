/**
 * The purpose of the platform store is to provide a standard way to "host" a client
 * Each platform should hold things like
 * - How to serve the client
 * - How to send data to the client
 * - How to get data from the client
 *
 * as well as things like
 *
 * - The client interface (for the connections store)
 */

import { SocketData } from '@DeskThing/types'
import { Client } from '@shared/types'

export enum PlatformEvent {
  CLIENT_CONNECTED = 'client_connected',
  CLIENT_DISCONNECTED = 'client_disconnected',
  DATA_RECEIVED = 'data_received',
  ERROR = 'error',
  STATUS_CHANGED = 'status_changed'
}

export interface PlatformConnectionOptions {
  host?: string
  port?: number
  path?: string
  protocol?: string
  [key: string]: any // For platform-specific options
}

export type PlatformStatus = {
  isActive: boolean
  clients: Client[]
  uptime: number
  error?: Error
}

export type PlatformEventPayloads = {
  [PlatformEvent.CLIENT_CONNECTED]: Client
  [PlatformEvent.CLIENT_DISCONNECTED]: Client
  [PlatformEvent.DATA_RECEIVED]: { client: Client; data: SocketData }
  [PlatformEvent.ERROR]: Error
  [PlatformEvent.STATUS_CHANGED]: PlatformStatus
}

export type PlatformConnectionListener<T extends PlatformEvent> = (
  data: PlatformEventPayloads[T]
) => void

export interface PlatformInterface {
  // Core identity properties
  readonly id: string
  readonly type: 'websocket' | 'bluetooth' | 'ssh' | 'adb' | string
  readonly name: string

  // Server management
  start(options?: PlatformConnectionOptions): Promise<void>
  stop(): Promise<void>
  isRunning(): boolean

  // listener events
  on<T extends PlatformEvent>(event: T, listener: PlatformConnectionListener<T>): () => void
  off<T extends PlatformEvent>(event: T, listener: PlatformConnectionListener<T>): void
  removeAllListeners(): void

  // Client connection handling
  getClients(): Client[]
  getClientById(clientId: string): Client | undefined

  // Data transfer
  sendData(clientId: string, data: SocketData): Promise<boolean>
  broadcastData(data: SocketData): Promise<void>

  // Status
  getStatus(): PlatformStatus
}
