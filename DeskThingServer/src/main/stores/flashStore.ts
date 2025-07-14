import {
  CacheableStore,
  FLASH_REQUEST,
  FlashingState,
  FlashProcess,
  FlashServer
} from '@shared/types'
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
import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process'
import { LOGGING_LEVELS } from '@deskthing/types'

export class FlashStore
  extends EventEmitter<FlashStoreEvents>
  implements CacheableStore, FlashStoreClass
{
  private flashProcess: Worker | null = null
  private _initialized: boolean = false

  private _flashState: FlashingState = {
    progress: {}
  }

  public get initialized(): boolean {
    return this._initialized
  }

  constructor() {
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
    this.flashProcess?.on('message', (data: FlashProcess) => {
      try {
        switch (data.type) {
          case 'flashEvent':
            this.handleFlashEvent(data.payload)
            break
          case 'request':
            this.handleFlashRequest(data)
            break
          case 'response':
            this.handleFlashResponse(data)
            break
          case 'operation':
            this.handleFlashOperation(data)
            break
        }
      } catch (error) {
        logger.error(`FlashProcess error handling worker data: ${handleError(error)}`, {
          source: 'flashStore',
          function: 'handleFlashEvent'
        })
      }
    })

    this.flashProcess?.on('error', (error) => {
      logger.error(`FlashProcess worker Error: ${error}`, {
        source: 'flashStore',
        function: 'setupWorkerListeners'
      })
    })

    this.flashProcess?.on('messageerror', (error) => {
      logger.error(`FlashProcess message error: ${error}`, {
        source: 'flashStore',
        function: 'setupWorkerListeners'
      })
    })

    this.flashProcess?.stdout?.on('data', (data) => {
      logger.debug(`${data.toString().trim()}`, {
        domain: 'flashProcess',
        source: 'flashStore',
        function: 'stdout'
      })
    })
    this.flashProcess?.stderr?.on('data', (data) => {
      logger.error(`${data.toString().trim()}`, {
        domain: 'flashProcess',
        source: 'flashStore',
        function: 'stderr'
      })
    })
  }

  private async handleFlashRequest(
    data: Extract<FlashProcess, { type: 'request' }>
  ): Promise<void> {
    switch (data.request) {
      case FLASH_REQUEST.FILE_PATH:
        break
      case FLASH_REQUEST.DEVICE_SELECTION:
        break
    }
  }

  private async handleFlashResponse(
    data: Extract<FlashProcess, { type: 'response' }>
  ): Promise<void> {
    switch (data.request) {
      case FLASH_REQUEST.STEPS:
        this._flashState.stepTotal = data.payload
        this.emit('flash-state', this._flashState)
        this.emit('total-steps', data.payload)
        break
    }
  }

  private async handleFlashOperation(
    data: Extract<FlashProcess, { type: 'operation' }>
  ): Promise<void> {
    switch (data.request) {
      case 'complete':
        this.emit('flash-stopped', true)
        break
      case 'killed':
        this.emit('flash-stopped', false)
        break
    }
  }

  private async handleFlashEvent(data: FlashEvent): Promise<void> {
    switch (data.type) {
      case 'Log':
        {
          const levelMap: Record<string, LOGGING_LEVELS> = {
            TRACE: LOGGING_LEVELS.DEBUG,
            DEBUG: LOGGING_LEVELS.DEBUG,
            INFO: LOGGING_LEVELS.LOG,
            WARN: LOGGING_LEVELS.WARN,
            ERROR: LOGGING_LEVELS.ERROR,
            FATAL: LOGGING_LEVELS.FATAL
          }
          const level = levelMap[data.data.level] || LOGGING_LEVELS.LOG
          logger.log(level, data.data.message, {
            function: 'flashProcess',
            source: 'flashStore'
          })

          if (level == LOGGING_LEVELS.ERROR || level == LOGGING_LEVELS.FATAL) {
            this._flashState.state = 'error'
            this._flashState.errorText = data.data.message
            this._flashState.suggestion = 'Read the logs for the full error'
            this.emit('flash-state', this._flashState)
          }
        }
        break
      case 'FindingDevice':
      case 'DeviceMode':
      case 'Connecting':
      case 'Connected':
      case 'Bl2Boot':
      case 'Resetting':
        this._flashState.stepTitle = data.type
        this.emit('flash-state', this._flashState)
        progressBus.update(ProgressChannel.FN_FLASH_RUNNER, data.type)
        break
      case 'StepChanged':
        this._flashState.step = data.step
        this._flashState.stepTitle =
          data.data.type == 'RestorePartition' ? data.data.value.name : data.data.type
        this._flashState.pastTitles = [
          ...(this._flashState.pastTitles || []),
          this._flashState.stepTitle
        ]
        this._flashState.state = 'progress'
        this._flashState.errorText = undefined
        this._flashState.suggestion = undefined
        this.emit('flash-state', this._flashState)

        if (!this._flashState.stepTotal) {
          this.sendToFlash({ type: 'request', request: FLASH_REQUEST.STEPS })
        }

        if (this._flashState.stepTotal && this._flashState.step) {
          const { step, stepTotal } = this._flashState

          // Calculate progress from completed steps
          const totalProgress = ((step - 1) / stepTotal) * 100

          // Ensure it's within bounds
          const calculatedProgress = Math.min(Math.max(totalProgress, 0), 100)

          progressBus.update(
            ProgressChannel.FN_FLASH_RUNNER,
            `${this._flashState?.stepTitle || 'Flashing...'} - ${this._flashState.progress.percent?.toFixed(2)}% Complete`,
            calculatedProgress
          )
        }

        break
      case 'FlashInfo':
        this._flashState.progress = {
          percent: data.data.percent,
          elapsedS: data.data.elapsed / 1000,
          etaS: data.data.eta / 1000,
          rate: data.data.rate
        }
        this._flashState.state = 'progress'
        this._flashState.errorText = undefined
        this._flashState.suggestion = undefined

        // Only able to be calculated if stepTotal has been found
        if (this._flashState.stepTotal && this._flashState.step) {
          const { step, progress, stepTotal } = this._flashState

          // Calculate progress from completed steps
          const completedStepsProgress = ((step - 1) / stepTotal) * 100

          // Calculate progress from current step
          const currentStepProgress = (progress?.percent || 1) / stepTotal

          // Combine for total progress
          const totalProgress = completedStepsProgress + currentStepProgress

          // Ensure it's within bounds
          const calculatedProgress = Math.min(Math.max(totalProgress, 0), 100)

          progressBus.update(
            ProgressChannel.FN_FLASH_RUNNER,
            `${this._flashState?.stepTitle || 'Flashing...'} - ${data.data.percent.toFixed(2)}% Complete`,
            calculatedProgress
          )
        }

        this.emit('flash-state', this._flashState)
        break
    }
  }

  // Wraps the post message to type it
  private async sendToFlash(message: FlashServer): Promise<void> {
    if (!this.flashProcess) {
      await this.setupWorker()
    }

    this.flashProcess?.postMessage(message)
  }

  async initialize(): Promise<void> {
    if (this._initialized) return
    this._initialized = true
  }

  public clearCache = async (): Promise<void> => {
    if (this._flashState.state != 'progress') {
      this.flashProcess?.terminate()
      this.flashProcess = null
    }
  }

  public saveToFile = async (): Promise<void> => {
    // No persistent data to save
  }

  async startFlash(imagePath: string): Promise<void> {
    try {
      progressBus.startOperation(
        ProgressChannel.ST_FLASH_RUNNER,
        'Flash-Device',
        'Initializing flash process...',
        [
          {
            channel: ProgressChannel.FN_FLASH_RUNNER,
            weight: 100
          }
        ]
      )

      this._flashState.pastTitles = []

      await this.sendToFlash({
        type: 'response',
        request: FLASH_REQUEST.FILE_PATH,
        payload: imagePath
      })

      this.getFlashSteps()

      progressBus.start(ProgressChannel.FN_FLASH_RUNNER, 'Flashing Device', 'Initializing Flash')

      await this.sendToFlash({ type: 'operation', request: 'start' })

      await new Promise((resolve, reject) =>
        this.once('flash-stopped', (data) =>
          data ? resolve(true) : reject('Flash was killed unexpectedly')
        )
      )

      if (
        !this._flashState.step ||
        !this._flashState.stepTotal ||
        this._flashState.step < this._flashState.stepTotal
      ) {
        throw new Error('Flash did not complete all of the required steps!')
      }

      progressBus.complete(
        ProgressChannel.FN_FLASH_RUNNER,
        'Flash-Device',
        'Device flashed successfully!'
      )

      progressBus.complete(
        ProgressChannel.ST_FLASH_RUNNER,
        'Flash-Device',
        'Device flashed successfully!'
      )

      this.emit('flash-completed', true)

      this._flashState.state = 'completed'

      this.emit('flash-state', this._flashState)
    } catch (error) {
      progressBus.error(
        ProgressChannel.ST_FLASH_RUNNER,
        'Flash-Device',
        'Error flashing device',
        error instanceof Error ? error.message : handleError(error)
      )
      this._flashState.state = 'error'
      this._flashState.errorText = error instanceof Error ? error.message : 'Unknown error'
      this._flashState.suggestion = undefined
      this.emit('flash-completed', false)
      throw error
    }
  }

  async configureUSBMode(imagePath: string): Promise<void> {
    try {
      progressBus.startOperation(
        ProgressChannel.ST_FLASH_RUNNER,
        'Configure-Device',
        'Initializing USB Mode Process...',
        [
          {
            channel: ProgressChannel.FN_FLASH_RUNNER,
            weight: 100
          }
        ]
      )

      // TODO: Implement actual flash logic using superbird/flashService

      await this.sendToFlash({
        type: 'response',
        request: FLASH_REQUEST.FILE_PATH,
        payload: imagePath
      })

      progressBus.complete(
        ProgressChannel.ST_FLASH_RUNNER,
        'Configure-Device',
        'Device configured successfully!'
      )

      this._flashState.state = 'completed'
      this.emit('flash-state', this._flashState)
    } catch (error) {
      this._flashState.state = 'error'
      this._flashState.errorText = error instanceof Error ? error.message : 'Unknown error'
      this._flashState.suggestion = undefined

      progressBus.error(
        ProgressChannel.ST_FLASH_RUNNER,
        'Flash-Device',
        'Error flashing device',
        handleError(error)
      )
    }
  }

  async cancelFlash(): Promise<void> {
    try {
      // TODO: Implement cancel logic

      this._flashState.state = 'cancelled'

      this.emit('flash-state', this._flashState)

      await this.flashProcess?.terminate()
      this.flashProcess = null
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

  async getFlashStatus(): Promise<FlashingState | null> {
    return this._flashState
  }

  async getFlashSteps(): Promise<number | null> {
    if (this._flashState.stepTotal != undefined) {
      return this._flashState.stepTotal
    }

    return new Promise((resolve) => {
      this.once('total-steps', (steps) => {
        resolve(steps)
      })
      this.sendToFlash({ type: 'request', request: FLASH_REQUEST.STEPS })
    })
  }

  async configureDriverForDevice(): Promise<void> {
    let childProcess: ChildProcessWithoutNullStreams | null = null

    try {
      progressBus.start(
        ProgressChannel.ST_FLASH_DRIVER,
        'Driver-Install',
        'Installing device driver...'
      )

      if (process.platform === 'win32') {
        // For Windows, use PowerShell with proper command structure
        childProcess = spawn(
          'powershell.exe',
          ['-ExecutionPolicy', 'Bypass', '-Command', 'irm https://driver.terbium.app/get | iex'],
          {
            shell: false // Don't use shell since we're calling powershell.exe directly
          }
        )
      } else {
        // For Unix-like systems, use bash with proper pipe handling
        childProcess = spawn('bash', ['-c', 'curl -sSL https://driver.terbium.app/get | bash'], {
          shell: false // Don't use shell since we're calling bash directly
        })
      }

      childProcess.stdout.on('data', (data) => {
        const output = data.toString().trim()
        if (output) {
          progressBus.update(ProgressChannel.ST_FLASH_DRIVER, 'Driver-Install', output)
        }
      })

      childProcess.stderr.on('data', (data) => {
        const error = data.toString().trim()
        if (error) {
          logger.warn(`Driver installation stderr: ${error}`, {
            function: 'configureDriverForDevice',
            source: 'flash-store'
          })
        }
      })

      await new Promise((resolve, reject) => {
        childProcess?.on('close', (code) => {
          if (code === 0) {
            resolve(null)
          } else {
            reject(new Error(`Process exited with code ${code}`))
          }
        })
        childProcess?.on('error', reject)
      })

      progressBus.complete(
        ProgressChannel.ST_FLASH_DRIVER,
        'Driver-Install',
        'Driver installation completed successfully'
      )
    } catch (error) {
      progressBus.error(
        ProgressChannel.ST_FLASH_DRIVER,
        'Driver-Install',
        'Driver installation failed',
        handleError(error)
      )
      throw error
    } finally {
      if (childProcess) {
        childProcess?.kill()
      }
    }
  }
}
