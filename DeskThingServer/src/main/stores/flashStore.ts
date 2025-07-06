import { CacheableStore } from '@shared/types'
import EventEmitter from 'node:events'
import { progressBus } from '@server/services/events/progressBus'
import { ProgressChannel } from '@shared/types'
import { handleError } from '@server/utils/errorHandler'
import logger from '@server/utils/logger'
import { FlashStoreClass, FlashStoreEvents } from '@shared/stores/flashStore'
import flashProcessPath from '@processes/flashProcess?modulePath'
import type { FlashEvent } from 'flashthing'
import { Worker } from 'node:worker_threads'
import { app } from 'electron/main'

export class FlashStore
  extends EventEmitter<FlashStoreEvents>
  implements CacheableStore, FlashStoreClass
{
  private flashProcess: Worker | null = null
  private _initialized: boolean = false
  private _lastStatus: FlashEvent | null = null

  public get initialized(): boolean {
    return this._initialized
  }

  constructor(private flashStore: FlashStoreClass) {
    super()
  }

  private setupWorker = async (): Promise<void> => {
    if (this.flashProcess) this.flashProcess?.terminate()

    this.flashProcess = new Worker(flashProcessPath, {
      workerData: { userDataPath: app.getPath('userData'), stdout: true, stderr: true },
      name: 'FlashProcess',
      stdout: true,
      stderr: true
    })
    this.setupWorkerListeners()
  }

  private setupWorkerListeners(): void {
    this.flashProcess?.on('message', (data: FlashEvent) => {
      switch (data.type) {
        case 'Bl2Boot':
          {
            // handle
          }
          break
        case 'Connected':
          {
            // handle
          }
          break
      }
    })

    this.flashProcess?.on('error', (error) => {
      logger.error(`WebSocket worker Error: ${error}`, {
        source: 'wsPlatform',
        function: 'setupWorkerListeners'
      })
    })

    this.flashProcess?.stdout?.on('data', (data) => {
      logger.debug(`${data.toString().trim()}`, {
        domain: 'WebSocket',
        source: 'wsPlatform',
        function: 'stdout'
      })
    })
    this.flashProcess?.stderr?.on('data', (data) => {
      logger.error(`${data.toString().trim()}`, {
        domain: 'WebSocket',
        source: 'wsPlatform',
        function: 'stderr'
      })
    })
  }

  // Wraps the post message to type it
  private async sendToFlash(message: any): Promise<void> {
    this.flashProcess?.postMessage(message)
  }

  async initialize(): Promise<void> {
    if (this._initialized) return
    this._initialized = true
  }

  public clearCache = async (): Promise<void> => {
    this._lastStatus = null
  }

  public saveToFile = async (): Promise<void> => {
    // No persistent data to save
  }

  async startFlash(devicePath: string): Promise<void> {
    try {
      await this.setupWorker()
      progressBus.startOperation(
        ProgressChannel.ST_DEVICE_FLASH,
        'Flash-Device',
        'Initializing flash process...'
      )

      this._lastStatus = null
      this.emit('flash-started', devicePath)

      // TODO: Implement actual flash logic using superbird/flashService

      progressBus.complete(
        ProgressChannel.ST_DEVICE_FLASH,
        'Flash-Device',
        'Device flashed successfully!'
      )

      this._lastStatus = null
      this.emit('flash-completed', devicePath)
    } catch (error) {
      this._lastStatus = null
      progressBus.error(
        ProgressChannel.ST_DEVICE_FLASH,
        'Flash-Device',
        'Error flashing device',
        handleError(error)
      )
      this.emit('flash-failed', devicePath, error as Error)
    }
  }

  async cancelFlash(): Promise<void> {
    try {
      // TODO: Implement cancel logic
      this._lastStatus = null
      logger.debug('Flash process cancelled', {
        function: 'cancelFlash',
        source: 'flash-store'
      })
    } catch (error) {
      logger.error(`Failed to cancel flash process: ${handleError(error)}`, {
        function: 'cancelFlash',
        source: 'flash-store'
      })
    }
  }

  async getFlashStatus(): Promise<FlashEvent | null> {
    return this._lastStatus
  }

  async getFlashSteps(): Promise<number | null> {
    return 1 // TODO: Fix later
  }
}
