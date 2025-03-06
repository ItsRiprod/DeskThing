import Logger from '@server/utils/logger'
import { CacheableStore } from '@shared/types'

class CacheManager {
  private static instance: CacheManager
  private stores: Set<CacheableStore> = new Set()

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  registerStore(store: CacheableStore): void {
    this.stores.add(store)
  }

  async hibernateAll(): Promise<void> {
    Logger.info('Hibernating all stores', { source: 'CacheManager' })

    const beforeMemory = process.memoryUsage()

    const promises = Array.from(this.stores).map(async (store) => {
      await store.saveToFile()
      await store.clearCache()
    })

    await Promise.all(promises)

    // Cooldown to let stuff settle
    await new Promise((resolve) => setTimeout(resolve, 5000))

    const afterMemory = process.memoryUsage()
    const savedHeapUsed = (beforeMemory.heapUsed - afterMemory.heapUsed) / 1024 / 1024

    Logger.info(`Memory saved after hibernation: ${savedHeapUsed.toFixed(2)} MB`, {
      source: 'CacheManager'
    })
  }
}

export default CacheManager.getInstance()
