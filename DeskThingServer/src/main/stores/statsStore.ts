import type { Stats, Registration, Stat } from '@shared/types'
import { DeskThingStats } from '@server/services/stats/statsFetchWrapper'
import logger from '@server/utils/logger'
import { getMachineId } from '@server/utils/machineId'
import os from 'os'
import { StatsStoreClass } from '@shared/stores/statsStore'
import { handleError } from '@server/utils/errorHandler'

export class StatsStore implements StatsStoreClass {
  private stats: DeskThingStats | null = null
  private statsQueue: Map<string, { stat: Stat; timestamp: number }> = new Map()
  private _initialized = false
  private _registered = false
  private _flushing = false
  private flushInterval: NodeJS.Timeout | null = null
  private readonly FLUSH_INTERVAL = 30 * 60 * 1000 // 30 minutes

  public get initialized(): boolean {
    return this._initialized
  }

  async initialize(): Promise<void> {
    if (this._initialized) return

    try {
      let privateKeyData = process.env.STATS_PRIVATE_KEY
      let clientId = process.env.STATS_CLIENT_ID

      if (!privateKeyData || !clientId) {
        const machineData = await getMachineId()
        privateKeyData = machineData.privateKey
        clientId = machineData.clientId // Use the generated client ID

        logger.info('Using machine-generated keys for stats', {
          function: 'initialize',
          source: 'statsStore'
        })
      }

      const privateKey = await DeskThingStats.readPrivateKey(privateKeyData)
      this.stats = new DeskThingStats(clientId, privateKey)

      // Handle registration on first initialization
      await this.ensureRegistration()

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

  private async ensureRegistration(): Promise<void> {
    if (!this.stats || this._registered) return

    try {
      const machineData = await getMachineId()
      const registration: Registration = {
        id: machineData.clientId,
        publicKey: machineData.publicKey,
        os: os.platform(),
        cpus: os.cpus().length,
        memory: os.totalmem()
      }

      await this.register(registration)
      this._registered = true
    } catch (error) {
      logger.error('Failed to ensure registration', {
        error: error as Error,
        function: 'ensureRegistration',
        source: 'statsStore'
      })
    }
  }

  private startFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flushInterval = setInterval(() => {
      logger.debug('Flushing stats queue due to interval', {
        function: 'startFlushInterval',
        source: 'statsStore'
      })
      this.flush()
    }, this.FLUSH_INTERVAL)
  }

  async clearCache(): Promise<void> {
    this.statsQueue.clear()
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

    if (process.env.NODE_ENV == 'development') {
      logger.debug('Skipping registration in development mode', {
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

  private generateStatKey(stat: Stat): string {
    switch (stat.stat) {
      case 'system':
        return `system:${stat.type}` // Only one system stat per type

      case 'usage':
        return `usage:${stat.type}` // Only latest usage stat per type

      case 'app':
        if (stat.type === 'summary') {
          return 'app:summary' // Only one summary
        }
        return `app:${stat.type}:${stat.data.appId}` // Per app for install/uninstall/update

      case 'kv':
        return `kv:${stat.type}:${stat.key}` // Per key per type

      default: {
        // Ensure stat has a 'stat' property, otherwise fallback to a generic key
        if ('stat' in stat) {
          return `${(stat as Stat).stat}:${Date.now()}` // Fallback with timestamp
        }
        return `unknown:${Date.now()}`
      }
    }
  }

  /**
   * Determine if a stat should always be sent (no deduplication)
   */
  private shouldAlwaysSend(stat: Stat): boolean {
    return (
      stat.stat === 'app' &&
      (stat.type === 'install' || stat.type === 'uninstall' || stat.type === 'update')
    )
  }

  async collect(stat: Stats[number]): Promise<void> {
    const key = this.generateStatKey(stat)
    const timestamp = Date.now()

    if (this.shouldAlwaysSend(stat)) {
      this.statsQueue.set(`${key}:${timestamp}`, { stat, timestamp })
    } else {
      // Check if we already have this stat type
      const existing = this.statsQueue.get(key)

      if (!existing) {
        this.statsQueue.set(key, { stat, timestamp })

        logger.debug(`Queued stat: ${stat.stat}:${stat.type}`, {
          function: 'collect',
          source: 'statsStore'
        })
      } else {
        // If we already have this stat type, check if it's newer
        if (timestamp > existing.timestamp) {
          this.statsQueue.set(key, { stat, timestamp })
          logger.debug(`Updated stat: ${stat.stat}:${stat.type}`, {
            function: 'collect',
            source: 'statsStore'
          })
        } else {
          logger.debug(`Skipped older duplicate stat: ${stat.stat}:${stat.type}`, {
            function: 'collect',
            source: 'statsStore'
          })
        }
      }
    }

    // If queue gets too large, flush early
    if (this.statsQueue.size >= 50) {
      // Reduced threshold due to deduplication
      logger.debug('Stats queue size exceeded threshold, flushing', {
        function: 'collect',
        source: 'statsStore'
      })
      await this.flush()
    }
  }

  private getSortedStats(): Stat[] {
    const entries = Array.from(this.statsQueue.values())

    // Sort by priority (registration first, then by timestamp)
    return entries
      .sort((a, b) => {
        // Registration stats first
        if (a.stat.stat === 'system' && b.stat.stat !== 'system') return -1
        if (a.stat.stat !== 'system' && b.stat.stat === 'system') return 1

        // Then by timestamp (oldest first)
        return a.timestamp - b.timestamp
      })
      .map((entry) => entry.stat)
  }

  private async flush(): Promise<void> {
    if (!this.stats || this.statsQueue.size === 0) return

    if (this.statsQueue.size === 0) return

    if (this._flushing) {
      logger.debug('Flush already in progress, skipping', {
        function: 'flush',
        source: 'statsStore'
      })
      return
    }
    this._flushing = true

    const statsToSend = this.getSortedStats()

    try {
      if (process.env.NODE_ENV == 'development') {
        logger.debug('Skipping stats flush in development mode', {
          function: 'flush',
          source: 'statsStore'
        })
        return
      }
      const result = await this.stats.send(statsToSend)
      if (result.success) {
        this.statsQueue.clear()
        logger.debug('Stats flushed successfully', {
          function: 'flush',
          source: 'statsStore'
        })
      } else {
        throw new Error(result.error.message)
      }
    } catch (error) {
      logger.error(`Failed to flush stats ${handleError(error)}`, {
        error: error as Error,
        function: 'flush',
        source: 'statsStore'
      })
    } finally {
      this._flushing = false
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
