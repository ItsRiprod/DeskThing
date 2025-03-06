import { Worker } from 'node:worker_threads'
import { app } from 'electron'
import Logger from '@server/utils/logger'
import expressWorkerPath from '../services/client/expressWorker?modulePath'
import { LOGGING_LEVELS } from '@DeskThing/types'
import { SettingsStoreClass } from '../../shared/stores/settingsStore'
import { AppStoreClass } from '../../shared/stores/appStore'
import { ExpressServerStoreClass } from '@shared/stores/expressServerStore'

export class ExpressServerManager implements ExpressServerStoreClass {
  private worker: Worker | null = null
  private isRunning = false
  private port: number

  private settingStore: SettingsStoreClass
  private appStore: AppStoreClass

  constructor(settingStore: SettingsStoreClass, appStore: AppStoreClass) {
    this.settingStore = settingStore
    this.appStore = appStore
    this.port = 8891
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      Logger.log(LOGGING_LEVELS.LOG, 'Express server already running')
      return
    }

    try {
      Logger.log(LOGGING_LEVELS.LOG, 'Starting Express server worker')

      // Create worker with the modulePath imported from electron-vite
      this.worker = new Worker(expressWorkerPath, {
        workerData: {
          userDataPath: app.getPath('userData'),
          port: this.port,
          isDevelopment: process.env.NODE_ENV === 'development',
          staticPath:
            process.env.NODE_ENV === 'development'
              ? app.getAppPath() + '/resources/static'
              : process.resourcesPath + '/static'
        }
      })

      // Set up message handling
      this.worker.on('message', this.handleWorkerMessage.bind(this))

      // Handle worker errors and exit
      this.worker.on('error', (error) => {
        Logger.error('Express worker error', { error })
        this.isRunning = false
      })

      this.worker.on('exit', (code) => {
        Logger.log(LOGGING_LEVELS.LOG, `Express worker exited with code ${code}`)
        this.isRunning = false

        // Auto-restart worker if it crashes unexpectedly
        if (code !== 0) {
          Logger.log(LOGGING_LEVELS.WARN, 'Express worker crashed, restarting...')
          setTimeout(() => this.start(), 1000)
        }
      })

      this.isRunning = true
    } catch (error) {
      Logger.error('Failed to start Express server worker', { error: error as Error })
      throw error
    }
  }

  async stop(): Promise<void> {
    if (!this.worker || !this.isRunning) {
      return
    }

    return new Promise<void>((resolve) => {
      // Set up one-time listener for shutdown confirmation
      this.worker!.once('message', (message) => {
        if (message.type === 'shutdown_complete') {
          this.isRunning = false
          resolve()
        }
      })

      // Request graceful shutdown
      this.worker!.postMessage({ type: 'shutdown' })

      // Set timeout for force termination
      setTimeout(() => {
        if (this.isRunning) {
          this.worker!.terminate()
          this.isRunning = false
          Logger.log(LOGGING_LEVELS.WARN, 'Express worker forcefully terminated')
          resolve()
        }
      }, 5000)
    })
  }

  sendAppUpdate(apps: any[]): void {
    if (!this.worker || !this.isRunning) return

    this.worker.postMessage({
      type: 'app_update',
      data: apps
    })
  }

  private handleWorkerMessage(message: any): void {
    switch (message.type) {
      case 'server_started':
        Logger.log(LOGGING_LEVELS.LOG, `Express server started on port ${message.port}`)
        break

      case 'client_connected':
        // Forward to connection store or other handlers
        const { clientId, clientInfo } = message
        Logger.log(LOGGING_LEVELS.LOG, `Client ${clientId} connected to Express server`)
        // Could integrate with your connection store here
        break

      case 'error':
        Logger.error('Express server error', { error: message.error })
        break
    }
  }

  private async handleApiRequest(requestId: string, endpoint: string, data: any): Promise<void> {
    try {
      let result

      // Handle endpoints that need access to main process stores
      switch (endpoint) {
        case 'get_apps':
          // Not used anymore
          result = await this.appStore.getAll()
          break

        case 'get_settings':
          result = await this.settingStore.getSettings()
          break

        // Add more endpoints as needed

        default:
          throw new Error(`Unknown endpoint: ${endpoint}`)
      }

      this.worker!.postMessage({
        type: 'api_response',
        requestId,
        data: result
      })
    } catch (error) {
      this.worker!.postMessage({
        type: 'api_error',
        requestId,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }
}
