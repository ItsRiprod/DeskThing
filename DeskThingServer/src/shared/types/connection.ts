/**
 * The client object that keeps track of connected clients
 */
export interface Client {
  ip: string
  port?: number
  hostname?: string
  headers?: Record<string, string>
  userAgent?: string
  connectionId: string
  connected: boolean
  adbId?: string
  timestamp: number
  currentApp?: string
  version?: string
  client_name?: string
  description?: string
  device_type?: { id: number; name: string }
  default_view?: string
  miniplayer?: string
}

export interface ADBClient {
  adbId: string
  connected: boolean
  error?: string
  offline: boolean
}
