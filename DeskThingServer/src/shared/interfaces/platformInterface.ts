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

import { Client, DeskThingToDeviceCore, DeviceToDeskthingData } from '@DeskThing/types'
import { PlatformIDs } from '@shared/stores/platformStore'
import { PlatformIPC } from '@shared/types/ipc/ipcPlatform'
import EventEmitter from 'node:events'

export enum PlatformCapability {
  DETECT = 'detect',
  CONFIGURE = 'configure',
  COMMUNICATE = 'communicate'
}

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

export type ExtractPlatformData<P extends PlatformEvent> = Extract<
  PlatformPayloads,
  { event: P }
>['data']

export type PlatformPayloads =
  | { event: PlatformEvent.CLIENT_CONNECTED; data: Client }
  | { event: PlatformEvent.CLIENT_DISCONNECTED; data: Client }
  | { event: PlatformEvent.CLIENT_UPDATED; data: Client }
  | {
      event: PlatformEvent.DATA_RECEIVED
      data: { client: Client; data: DeviceToDeskthingData & { connectionId: string } }
    }
  | { event: PlatformEvent.ERROR; data: Error }
  | { event: PlatformEvent.STATUS_CHANGED; data: PlatformStatus }
  | { event: PlatformEvent.SERVER_STARTED; data: { port?: number; address?: string } }

export type PlatformEvents = {
  [P in PlatformEvent]: [ExtractPlatformData<P>]
}

export interface PlatformInterface<E extends Record<string, unknown> = Record<string, unknown>>
  extends EventEmitter<PlatformEvents> {
  // Core identity properties
  readonly id: PlatformIDs
  readonly name: string
  readonly capabilities: PlatformCapability[]

  // Server management
  start(options?: PlatformConnectionOptions<E>): Promise<void>
  stop(): Promise<void>
  isRunning(): boolean

  // Client connection handling
  getClients(): Client[]
  getClientById(clientId: string): Client | undefined

  // Client management
  updateClient(clientId: string, client: Partial<Client>): void

  // Data transfer
  sendData(clientId: string, data: DeskThingToDeviceCore & { app?: string }): Promise<boolean>
  broadcastData(data: DeskThingToDeviceCore & { app?: string }): Promise<void>

  // Handling custom events
  handlePlatformEvent: <T extends PlatformIPC>(data: T) => Promise<T['data']>

  // Status
  getStatus(): PlatformStatus
}
