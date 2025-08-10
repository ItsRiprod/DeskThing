import { PlatformStoreClass } from '@shared/stores/platformStore'
import { TimeStoreClass } from '@shared/stores/timeStoreClass'

export class TimeStore implements TimeStoreClass {
  private platformStore: PlatformStoreClass
  private _initialized = false
  private timer: NodeJS.Timeout | null = null

  public get initialized(): boolean {
    return this._initialized
  }

  constructor(platformStore: PlatformStoreClass) {
    this.platformStore = platformStore
  }

  public async initialize(): Promise<void> {
    if (this._initialized) return
    this._initialized = true
    this.scheduleNextTick()
  }

  public stop(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this._initialized = false
  }

  public async start(): Promise<void> {
    this.initialize()
  }

  private async sendTimeToClients(): Promise<void> {
    await this.platformStore.sendTimeToClient()
  }

  private scheduleNextTick(): void {
    const now = new Date()
    const seconds = now.getSeconds()
    const ms = now.getMilliseconds()
    let nextInterval: number

    if (seconds < 30) {
      // Next tick at :30
      nextInterval = (30 - seconds) * 1000 - ms
    } else {
      // Next tick at :00 of next minute
      nextInterval = (60 - seconds) * 1000 - ms
    }

    this.timer = setTimeout(async () => {
      await this.sendTimeToClients()
      this.scheduleNextTick()
    }, nextInterval)
  }
}
