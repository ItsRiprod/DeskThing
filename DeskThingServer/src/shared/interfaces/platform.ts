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

import {
  Client,
  DeviceToDeskthing,
  SendToDeviceFromServerPayload,
  SocketData
} from '@DeskThing/types'

export enum PlatformEvent {
  CLIENT_CONNECTED = 'client_connected',
  CLIENT_DISCONNECTED = 'client_disconnected',
  CLIENT_UPDATED = 'client_updated',
  DATA_RECEIVED = 'data_received',
  ERROR = 'error',
  STATUS_CHANGED = 'status_changed',
  SERVER_STARTED = 'server_started'
}

export type PlatformConnectionOptions<T extends Record<string, unknown> = Record<string, unknown>> =
  {
    host?: string
    port?: number
    path?: string
    protocol?: string
  } & T

export type PlatformStatus = {
  isActive: boolean
  clients: Client[]
  uptime: number
  error?: Error
}

export type PlatformEventPayloads = {
  [PlatformEvent.CLIENT_CONNECTED]: Client
  [PlatformEvent.CLIENT_DISCONNECTED]: Client
  [PlatformEvent.CLIENT_UPDATED]: Client
  [PlatformEvent.DATA_RECEIVED]: {
    client: Client
    data: DeviceToDeskthing & { connectionId: string }
  }
  [PlatformEvent.ERROR]: Error
  [PlatformEvent.STATUS_CHANGED]: PlatformStatus
  [PlatformEvent.SERVER_STARTED]: { port?: number; address?: string }
}

export type PlatformConnectionListener<T extends PlatformEvent> = (
  data: PlatformEventPayloads[T]
) => void

export interface PlatformInterface<E extends Record<string, unknown> = Record<string, unknown>> {
  // Core identity properties
  readonly id: string
  readonly type: 'websocket' | 'bluetooth' | 'ssh' | 'adb' | string
  readonly name: string

  // Server management
  start(options?: PlatformConnectionOptions<E>): Promise<void>
  stop(): Promise<void>
  isRunning(): boolean

  // listener events
  on<T extends PlatformEvent>(event: T, listener: PlatformConnectionListener<T>): () => void
  off<T extends PlatformEvent>(event: T, listener: PlatformConnectionListener<T>): void
  removeAllListeners(): void

  // Client connection handling
  getClients(): Client[]
  getClientById(clientId: string): Client | undefined

  // Client management
  updateClient(clientId: string, client: Partial<Client>): void

  // Data transfer
  sendData<T extends string>(
    clientId: string,
    data: SendToDeviceFromServerPayload<T> & { app: T }
  ): Promise<boolean>
  broadcastData(data: SocketData): Promise<void>

  // Status
  getStatus(): PlatformStatus
}
