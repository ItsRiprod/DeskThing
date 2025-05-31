import {
  PlatformInterface,
  PlatformConnectionOptions,
  PlatformStatus
} from '@shared/interfaces/platformInterface'
import { Client, DeviceToDeskthingData, DeskThingToDeviceCore, PlatformIDs } from '@deskthing/types'
import { StoreInterface } from '@shared/interfaces/storeInterface'
import { EventEmitter } from 'node:stream'
import { ExtractPayloadFromIPC, PlatformIPC } from '@shared/types/ipc/ipcPlatform'

export enum PlatformStoreEvent {
  PLATFORM_ADDED = 'platform_added',
  PLATFORM_REMOVED = 'platform_removed',
  PLATFORM_STARTED = 'platform_started',
  PLATFORM_STOPPED = 'platform_stopped',
  CLIENT_CONNECTED = 'client_connected',
  CLIENT_DISCONNECTED = 'client_disconnected',
  CLIENT_UPDATED = 'client_updated',
  CLIENT_LIST = 'client_list',
  DATA_RECEIVED = 'data_received'
}

export type PlatformStoreEvents = {
  [PlatformStoreEvent.PLATFORM_ADDED]: [PlatformInterface]
  [PlatformStoreEvent.PLATFORM_REMOVED]: [string]
  [PlatformStoreEvent.PLATFORM_STARTED]: [PlatformInterface]
  [PlatformStoreEvent.PLATFORM_STOPPED]: [PlatformInterface]
  [PlatformStoreEvent.CLIENT_CONNECTED]: [Client]
  [PlatformStoreEvent.CLIENT_LIST]: [Client[]]
  [PlatformStoreEvent.CLIENT_DISCONNECTED]: [string]
  [PlatformStoreEvent.CLIENT_UPDATED]: [Client]
  [PlatformStoreEvent.DATA_RECEIVED]: [
    { client: Extract<Client, { connected: true }>; data: DeviceToDeskthingData }
  ]
}

export interface PlatformStoreClass extends StoreInterface, EventEmitter<PlatformStoreEvents> {
  registerPlatform(platform: PlatformInterface): Promise<void>

  removePlatform(platformId: PlatformIDs): Promise<boolean>

  getPlatform(platformId: PlatformIDs): PlatformInterface | undefined

  getAllPlatforms(): PlatformInterface[]

  startPlatform(platformId: PlatformIDs, options?: PlatformConnectionOptions): Promise<boolean>

  restartPlatform(platformId: PlatformIDs, options?: PlatformConnectionOptions): Promise<boolean>

  stopPlatform(platformId: PlatformIDs): Promise<boolean>

  updateClient(clientId: string, client: Partial<Client>): void

  getClients(): Client[]

  fetchClients(): Promise<Client[]>

  getClientById(clientId: string): Client | undefined

  getClientsByPlatform(platformId: PlatformIDs): Client[]

  getPlatformForClient(clientId: PlatformIDs): PlatformInterface | undefined

  handleSocketData(
    client: Client,
    data: DeviceToDeskthingData & { clientId: string }
  ): Promise<void>

  sendDataToClient(
    data: DeskThingToDeviceCore & { app?: string; clientId: string }
  ): Promise<boolean>

  refreshClients(): Promise<boolean>

  broadcastToClients(
    data: DeskThingToDeviceCore & { app?: string; clientId?: string }
  ): Promise<void>

  getPlatformStatus(): {
    activePlatforms: PlatformIDs[]
    totalClients: number
    platformStatuses: Record<PlatformIDs, PlatformStatus>
  }

  sendPlatformData<T extends PlatformIPC>(data: T): Promise<ExtractPayloadFromIPC<T>>

  sendInitialDataToClient(clientId?: string): Promise<void>
}
