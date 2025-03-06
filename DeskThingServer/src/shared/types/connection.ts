import { ClientManifest } from '@deskthing/types'

/**
 * The client object that keeps track of connected clients
 */
export interface Client extends Partial<ClientManifest> {
  id: string
  hostname?: string
  headers?: Record<string, string>
  userAgent?: string
  connectionId: string
  connected: boolean
  adbId?: string
  timestamp: number
  currentApp?: string
  miniplayer?: string
  default_view?: string
}

export interface ADBClient {
  adbId: string
  connected: boolean
  error?: string
  offline: boolean
}
