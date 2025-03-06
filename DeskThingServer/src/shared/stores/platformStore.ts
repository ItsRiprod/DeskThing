import {
  PlatformInterface,
  PlatformConnectionOptions,
  PlatformStatus
} from '@shared/interfaces/platform'
import { SocketData } from '@DeskThing/types'
import { Client } from '@shared/types'

export enum PlatformStoreEvent {
  PLATFORM_ADDED = 'platform_added',
  PLATFORM_REMOVED = 'platform_removed',
  PLATFORM_STARTED = 'platform_started',
  PLATFORM_STOPPED = 'platform_stopped',
  CLIENT_CONNECTED = 'client_connected',
  CLIENT_DISCONNECTED = 'client_disconnected',
  DATA_RECEIVED = 'data_received'
}

export type PlatformStoreEvents = {
  [PlatformStoreEvent.PLATFORM_ADDED]: PlatformInterface
  [PlatformStoreEvent.PLATFORM_REMOVED]: string
  [PlatformStoreEvent.PLATFORM_STARTED]: PlatformInterface
  [PlatformStoreEvent.PLATFORM_STOPPED]: PlatformInterface
  [PlatformStoreEvent.CLIENT_CONNECTED]: Client
  [PlatformStoreEvent.CLIENT_DISCONNECTED]: string
  [PlatformStoreEvent.DATA_RECEIVED]: { client: Client; data: SocketData }
}

export type PlatformStoreListener<T extends PlatformStoreEvent> = (
  data: PlatformStoreEvents[T]
) => void

export interface PlatformStoreClass {
  on<T extends PlatformStoreEvent>(event: T, listener: PlatformStoreListener<T>): () => void
  off<T extends PlatformStoreEvent>(event: T, listener: PlatformStoreListener<T>): void
  addPlatform(platform: PlatformInterface): Promise<void>
  removePlatform(platformId: string): Promise<boolean>
  getPlatform(platformId: string): PlatformInterface | undefined
  getPlatformByType(type: string): PlatformInterface | undefined
  getAllPlatforms(): PlatformInterface[]
  startPlatform(platformId: string, options?: PlatformConnectionOptions): Promise<boolean>
  restartPlatform(platformId: string, options?: PlatformConnectionOptions): Promise<boolean>
  stopPlatform(platformId: string): Promise<boolean>
  getClients(): Client[]
  getClientById(clientId: string): Client | undefined
  getClientsByPlatform(platformId: string): Client[]
  getPlatformForClient(clientId: string): PlatformInterface | undefined
  handleSocketData(client: Client, data: SocketData): Promise<void>
  sendDataToClient(clientId: string, data: SocketData): Promise<boolean>
  broadcastToClients(data: SocketData): Promise<void>
  getPlatformStatus(): {
    activePlatforms: string[]
    totalClients: number
    platformStatuses: Record<string, PlatformStatus>
  }
}
