import { Client } from '@deskthing/types'
import { PlatformCapability } from './platformInterface'
import { PlatformIDs } from '@shared/stores/platformStore'

export interface ConnectionMethod {
  platformId: PlatformIDs
  capabilities: PlatformCapability[]
}

export interface DeviceIdentifier {
  // Primary identifiers (used for matching)
  adbId?: string

  // Secondary identifiers (additional info)
  ip?: string
  name?: string

  // Connection info
  connectionMethods: ConnectionMethod[] // e.g., ['adb', 'websocket']

  // Function to check if this identifier matches another
  matches(other: DeviceIdentifier): boolean
}

export interface MergedClient extends Client {
  // Original clients from different platforms
  sourceClients: Map<PlatformIDs, Client> // platformId -> Client

  // Identity information
  identity: DeviceIdentifier

  // Primary connection method (the one currently used for communication)
  primaryConnectionMethod: PlatformIDs

  hasFullCommunication: boolean
}
