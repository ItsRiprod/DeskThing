export interface ADBClient {
  adbId: string
  connected: boolean
  error?: string
  offline: boolean
}
