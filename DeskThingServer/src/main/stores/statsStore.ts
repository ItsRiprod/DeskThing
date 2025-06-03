import type { Stats, Registration } from '@shared/types'
import { CacheableStore } from '@shared/types'
import { DeskThingStats } from '@server/services/stats/statsFetchWrapper'
import logger from '@server/utils/logger'

export class StatsStore implements CacheableStore {
  private stats: DeskThingStats | null = null
  private statsQueue: Stats = []
  private _initialized = false
  private flushInterval: NodeJS.Timeout | null = null
  private readonly FLUSH_INTERVAL = 5 * 60 * 1000 // 5 minutes

  public get initialized(): boolean {
    return this._initialized
  }

  async initialize(): Promise<void> {
    if (this._initialized) return

    try {
      const privateKeyData = process.env.STATS_PRIVATE_KEY
      const clientId = process.env.STATS_CLIENT_ID

      if (!privateKeyData || !clientId) {
        logger.warn('Stats credentials not configured', {
          function: 'initialize',
          source: 'statsStore'
        })
        return
      }

      const privateKey = await DeskThingStats.readPrivateKey(privateKeyData)
      this.stats = new DeskThingStats(clientId, privateKey)

      this.startFlushInterval()
      this._initialized = true

      logger.info('Stats store initialized', {
        function: 'initialize',
        source: 'statsStore'
      })
    } catch (error) {
      logger.error('Failed to initialize stats store', {
        error: error as Error,
        function: 'initialize',
        source: 'statsStore'
      })
    }
  }

  private startFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flushInterval = setInterval(() => this.flush(), this.FLUSH_INTERVAL)
  }

  async clearCache(): Promise<void> {
    this.statsQueue = []
  }

  async saveToFile(): Promise<void> {
    await this.flush()
  }

  async register(registration: Registration): Promise<void> {
    if (!this.stats) {
      logger.warn('Stats not initialized', {
        function: 'register',
        source: 'statsStore'
      })
      return
    }

    try {
      const result = await this.stats.register(registration)
      if (!result.success) {
        throw new Error(result.error.message)
      }
      logger.info('Registration successful', {
        function: 'register',
        source: 'statsStore'
      })
    } catch (error) {
      logger.error('Failed to register', {
        error: error as Error,
        function: 'register',
        source: 'statsStore'
      })
    }
  }

  async collect(stat: Stats[number]): Promise<void> {
    this.statsQueue.push(stat)

    // If queue gets too large, flush early
    if (this.statsQueue.length >= 100) {
      await this.flush()
    }
  }

  private async flush(): Promise<void> {
    if (!this.stats || this.statsQueue.length === 0) return

    try {
      const result = await this.stats.send(this.statsQueue)
      if (result.success) {
        this.statsQueue = []
        logger.debug('Stats flushed successfully', {
          function: 'flush',
          source: 'statsStore'
        })
      } else {
        throw new Error(result.error.message)
      }
    } catch (error) {
      logger.error('Failed to flush stats', {
        error: error as Error,
        function: 'flush',
        source: 'statsStore'
      })
    }
  }

  dispose(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flush().catch((error) => {
      logger.error('Failed to flush stats during disposal', {
        error: error as Error,
        function: 'dispose',
        source: 'statsStore'
      })
    })
  }
}
