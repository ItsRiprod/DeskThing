import logger from '@server/utils/logger'
import type { Stats, Registration } from '@shared/types'

type StatsResult =
  | { success: true; status: number }
  | { success: false; status: number; error: Error }
type StatsOptions = { fetch?: typeof globalThis.fetch; baseUrl?: string; headers?: HeadersInit }

export class DeskThingStats {
  private readonly baseUrl: string
  private readonly fetch: typeof globalThis.fetch
  private readonly endpoints = {
    register: '/v1/register',
    stats: '/v1/stats'
  }

  static async readPrivateKey(keyData: string): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      'pkcs8',
      Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0)),
      { name: 'Ed25519' },
      false,
      ['sign']
    )
  }

  constructor(
    private readonly clientId: string,
    private readonly privateKey: CryptoKey,
    private readonly options: StatsOptions = {
      fetch: globalThis.fetch,
      baseUrl: 'https://stats.deskthing.app',
      headers: {}
    }
  ) {
    this.baseUrl = options.baseUrl ?? 'https://stats.deskthing.app'
    this.fetch = options.fetch ?? globalThis.fetch
  }

  private async signData(stringifiedData: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(stringifiedData)
    const signature = await crypto.subtle.sign('Ed25519', this.privateKey, data)
    return btoa(String.fromCharCode(...new Uint8Array(signature)))
  }

  private async makeHeaders(stringifiedData: string): Promise<HeadersInit> {
    return {
      'Content-Type': 'application/json',
      'X-Client-ID': this.clientId,
      'X-Signature': await this.signData(stringifiedData),
      ...(this.options.headers ?? {})
    }
  }

  async register(data: Registration): Promise<StatsResult> {
    const stringifiedData = JSON.stringify(data)
    const headers = await this.makeHeaders(stringifiedData)

    try {
      const response = await this.fetch(`${this.baseUrl}${this.endpoints.register}`, {
        method: 'POST',
        headers,
        body: stringifiedData
      })

      if (response.ok) return { success: true, status: response.status }
      else {
        logger.error(
          `Failed to register client: ${response.status} - ${response.statusText}. Registering with headers ${JSON.stringify(headers)} and registration data: ${stringifiedData}`,
          {
            function: 'register',
            source: 'statsFetchWrapper'
          }
        )
        return {
          success: false,
          status: response.status,
          error: new Error(`Failed to register client: ${response.statusText}`)
        }
      }
    } catch (error) {
      console.error('registration error:', error)
      return {
        success: false,
        status: 0,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }

  async send(data: Stats): Promise<StatsResult> {
    const stringifiedData = JSON.stringify(data)
    const headers = await this.makeHeaders(stringifiedData)

    try {
      const response = await this.fetch(`${this.baseUrl}${this.endpoints.stats}`, {
        method: 'POST',
        headers,
        body: stringifiedData
      })

      if (response.ok) return { success: true, status: response.status }
      else {
        logger.error(`Failed to send stats: ${response.status} - ${response.statusText}`, {
          function: 'send',
          source: 'statsFetchWrapper'
        })
        return {
          success: false,
          status: response.status,
          error: new Error(`Failed to send stats: ${response.statusText}`)
        }
      }
    } catch (error) {
      console.error('stats error:', error)
      return {
        success: false,
        status: 0,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }
}
