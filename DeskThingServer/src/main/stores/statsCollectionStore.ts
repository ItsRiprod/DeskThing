/**
 * @file statsCollector.ts
 * @description Service for collecting statistics from various stores and sending them to the statsStore
 * @author Riprod
 * @version 0.11.11
 */

import { storeProvider } from '@server/stores/storeProvider'
import { Stat } from '@shared/types/stats'
import Logger from '@server/utils/logger'
import { PlatformStoreEvent } from '@shared/stores/platformStore'
import os from 'os'
import { StatsStoreClass } from '@shared/stores/statsStore'
import { StoreInterface } from '@shared/interfaces/storeInterface'
import { CacheableStore } from '@shared/types'
import { app } from 'electron/main'

/**
 * StatsCollector class responsible for listening to store events and collecting statistics
 */
export class StatsCollector implements StoreInterface, CacheableStore {
  private statsStore: StatsStoreClass | null = null
  private _initialized = false
  private cleanupFunctions: (() => void)[] = []
  private sessionStartTime = Date.now()
  private resourceMonitorInterval: NodeJS.Timeout | null = null
  private readonly RESOURCE_MONITOR_INTERVAL = 60000 * 30 // 30 minutes
  private lastResourceUsage: { cpu: number; memory: number } | null = null

  public get initialized(): boolean {
    return this._initialized
  }

  constructor(statsStore: StatsStoreClass) {
    this.statsStore = statsStore
  }

  public clearCache = async (): Promise<void> => {
    this.statsStore?.clearCache()
    this.lastResourceUsage = null
  }
  public saveToFile = async (): Promise<void> => {
    this.statsStore?.saveToFile()
  }

  /**
   * Initialize the stats collector and set up listeners
   */
  async initialize(): Promise<void> {
    if (this._initialized) return

    this._initialized = true
    try {
      if (!this.statsStore) {
        Logger.warn('Stats store not available', {
          function: 'initialize',
          source: 'statsCollector'
        })
        return
      }

      this.statsStore.initialize()

      await this.setupStoreListeners()
      this.startResourceMonitoring()
      this.collectSystemStats()
      this.collectSessionOpenStats()

      Logger.info('Stats collector initialized', {
        function: 'initialize',
        source: 'statsCollector'
      })
    } catch (error) {
      Logger.error('Failed to initialize stats collector', {
        error: error as Error,
        function: 'initialize',
        source: 'statsCollector'
      })
    }
  }

  /**
   * Set up listeners for all relevant stores
   */
  private async setupStoreListeners(): Promise<void> {
    try {
      // App Store listeners
      const appStore = await storeProvider.getStore('appStore', false)
      const appStoreCleanup = appStore.on('apps', ({ data }) => {
        this.collectAppSummaryStats(data.length)
      })
      this.cleanupFunctions.push(appStoreCleanup)

      const appUpdateCleanup = appStore.on('appUpdate', ({ appId, currentVersion, newVersion }) => {
        this.collectStat({
          stat: 'app',
          type: 'update',
          data: { appId, currentVersion, newVersion }
        })
      })
      this.cleanupFunctions.push(appUpdateCleanup)

      // Listen for app uninstalls
      const appUninstallCleanup = appStore.on('appUninstall', ({ appId }) => {
        this.collectStat({
          stat: 'app',
          type: 'uninstall',
          data: { appId }
        })
      })
      this.cleanupFunctions.push(appUninstallCleanup)

      // Listen for app installations
      const appInstallCleanup = appStore.on('appInstall', ({ appId }) => {
        this.collectStat({
          stat: 'app',
          type: 'install',
          data: { appId }
        })
      })
      this.cleanupFunctions.push(appInstallCleanup)

      // Platform Store listeners
      const platformStore = await storeProvider.getStore('platformStore', false)

      platformStore.on(PlatformStoreEvent.CLIENT_LIST, (clients) => {
        this.collectStat({
          stat: 'kv',
          type: 'number',
          key: 'clients_connected',
          value: clients.length
        })
      })

      // Client Store listeners
      const clientStore = await storeProvider.getStore('clientStore', false)

      clientStore.on('client-updated', (client) => {
        this.collectStat({
          stat: 'system',
          type: 'client',
          data: {
            clientId: client.id,
            version: client.version || 'unknown'
          }
        })
      })

      const flashStore = await storeProvider.getStore('flashStore', false)

      flashStore.on('flash-completed', (status) => {
        this.collectStat({
          stat: 'kv',
          type: 'boolean',
          key: 'flash_completed',
          value: status
        })
      })

      // // Mapping Store listeners
      // const mappingStore = await storeProvider.getStore('mappingStore', false)

      // const mappingActionCleanup = mappingStore.addListener('action', (actions) => {
      //   this.collectStat({
      //     stat: 'kv',
      //     type: 'number',
      //     key: 'custom_actions',
      //     value: actions?.length || 0
      //   })
      // })
      // this.cleanupFunctions.push(mappingActionCleanup)

      // const mappingKeyCleanup = mappingStore.addListener('key', (keys) => {
      //   this.collectStat({
      //     stat: 'kv',
      //     type: 'number',
      //     key: 'mapped_keys',
      //     value: keys?.length || 0
      //   })
      // })
      // this.cleanupFunctions.push(mappingKeyCleanup)

      Logger.info('Store listeners set up successfully', {
        function: 'setupStoreListeners',
        source: 'statsCollector'
      })
    } catch (error) {
      Logger.error('Failed to set up store listeners', {
        error: error as Error,
        function: 'setupStoreListeners',
        source: 'statsCollector'
      })
    }
  }

  /**
   * Start monitoring system resources
   */
  private startResourceMonitoring(): void {
    if (this.resourceMonitorInterval) {
      clearInterval(this.resourceMonitorInterval)
    }

    this.resourceMonitorInterval = setInterval(() => {
      this.collectResourceUsageStats()
    }, this.RESOURCE_MONITOR_INTERVAL)
  }

  /**
   * Collect system statistics
   */
  private collectSystemStats(): void {
    const systemInfo = {
      os: os.platform(),
      version: app.getVersion(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: process.uptime()
    }

    this.collectStat({
      stat: 'system',
      type: 'server',
      data: systemInfo
    })
  }

  /**
   * Collect session open statistics
   */
  private collectSessionOpenStats(): void {
    this.collectStat({
      stat: 'usage',
      type: 'open',
      data: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    })
  }

  /**
   * Collect resource usage statistics
   */
  private collectResourceUsageStats(): void {
    const memoryUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    const currentUsage = {
      cpu: cpuUsage.user + cpuUsage.system,
      memory: memoryUsage.heapUsed
    }

    if (
      !this.lastResourceUsage ||
      Math.abs(currentUsage.cpu - this.lastResourceUsage.cpu) > 1000000 ||
      Math.abs(currentUsage.memory - this.lastResourceUsage.memory) > 10485760
    ) {
      // 10MB threshold

      this.collectStat({
        stat: 'usage',
        type: 'resource',
        data: currentUsage
      })

      this.lastResourceUsage = currentUsage
    }
  }

  /**
   * Collect app summary statistics
   */
  private collectAppSummaryStats(appCount: number): void {
    this.collectStat({
      stat: 'app',
      type: 'summary',
      data: {
        count: appCount
      }
    })
  }

  /**
   * Collect a single statistic
   */
  private collectStat(stat: Stat): void {
    if (!this.statsStore) return

    Logger.debug(`Collecting stats on ${stat.stat}`, {
      function: 'collectStat',
      source: 'statsCollector'
    })

    this.statsStore.collect(stat).catch((error) => {
      Logger.error('Failed to collect stat', {
        error: error as Error,
        function: 'collectStat',
        source: 'statsCollector'
      })
    })
  }

  /**
   * Collect session close statistics and cleanup
   */
  async collectSessionCloseStats(): Promise<void> {
    const uptime = Math.floor((Date.now() - this.sessionStartTime) / 1000)

    this.collectStat({
      stat: 'usage',
      type: 'close',
      data: {
        uptime
      }
    })

    // Flush any remaining stats
    if (this.statsStore) {
      await this.statsStore.saveToFile()
    }
  }

  /**
   * Cleanup and dispose of resources
   */
  dispose(): void {
    // Clean up all listeners
    this.cleanupFunctions.forEach((cleanup) => cleanup())
    this.cleanupFunctions = []

    // Stop resource monitoring
    if (this.resourceMonitorInterval) {
      clearInterval(this.resourceMonitorInterval)
      this.resourceMonitorInterval = null
    }

    // Collect final stats
    this.collectSessionCloseStats().catch((error) => {
      Logger.error('Failed to collect session close stats', {
        error: error as Error,
        function: 'dispose',
        source: 'statsCollector'
      })
    })

    this._initialized = false
    Logger.info('Stats collector disposed', {
      function: 'dispose',
      source: 'statsCollector'
    })
  }
}
