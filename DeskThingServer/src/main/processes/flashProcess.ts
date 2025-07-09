import { parentPort } from 'worker_threads'
import { FlashProcess, FlashServer, FLASH_REQUEST } from '@shared/types'
import { FlashEvent } from 'flashthing'
import { FlashThing } from 'flashthing'

type QueueFunction = () => Promise<void>

process.title = 'Flash'

class FlashWorker {
  private flashThing: FlashThing | null = null
  private queue: QueueFunction[] = []
  private processing: boolean = false

  constructor() {
    this.initialize()
  }

  private initialize(): void {
    this.createFlashThing()
  }

  private createFlashThing = (): void => {
    try {
      this.flashThing = new FlashThing(this.flashCallback.bind(this))
    } catch (error) {
      console.error(`Failed to initialize FlashThing: ${error}`)
    }
  }

  private flashCallback(event: FlashEvent): void {
    this.sendToParent({
      type: 'flashEvent',
      payload: event
    })
  }

  private sendToParent(message: FlashProcess): void {
    parentPort?.postMessage(message)
  }

  private pushQueue(task: QueueFunction): void {
    this.queue.push(task)
    this.processQueue()
  }

  private processQueue = async (): Promise<void> => {
    // already processing
    if (this.processing) {
      return
    }
    this.processing = true

    // stop processing the queue
    if (this.queue.length === 0) {
      this.processing = false
      return
    }

    if (!this.flashThing) {
      console.log('Creating a new flash thing because the last one is undefined')
      this.createFlashThing()
    }

    const task = this.queue.shift()
    if (task) {
      await task()
      this.processing = false
      this.processQueue()
    } else {
      console.log('Queue is empty!')
      this.processing = false
      this.processQueue() // will loop again - and may just exit
    }
  }

  private async handleOperation(
    operation: Extract<FlashServer, { type: 'operation' }>['request']
  ): Promise<void> {
    try {
      switch (operation) {
        case 'start':
          this.pushQueue(async () => {
            const result = await this.flashThing
              ?.flash()
              .catch(() => false)
              .then(() => true)
            if (result) {
              this.sendToParent({
                type: 'operation',
                request: 'complete'
              })
            } else {
              this.sendToParent({
                type: 'operation',
                request: 'killed'
              })
            }
          })
          break
        case 'unbrick':
          this.pushQueue(async () => {
            await this.flashThing?.unbrick()
          })
          break
        default:
          throw new Error(`Unknown operation: ${operation}`)
      }
    } catch (error) {
      console.error(`Operation ${operation} failed: ${error}`)
      throw error
    }
  }

  private async handleRequest(request: FLASH_REQUEST): Promise<void> {
    if (!this.flashThing) {
      throw new Error('FlashThing not initialized')
    }

    try {
      switch (request) {
        case FLASH_REQUEST.STEPS:
          this.sendToParent({
            type: 'response',
            request: FLASH_REQUEST.STEPS,
            payload: await this.flashThing.getNumSteps()
          })
          break
        default:
          throw new Error(`Unknown request: ${request}`)
      }
    } catch (error) {
      console.error(`Request ${request} failed: ${error}`)
      throw error
    }
  }

  public async handleMessage(message: FlashServer): Promise<void> {
    try {
      switch (message.type) {
        case 'operation':
          await this.handleOperation(message.request)
          break
        case 'request':
          await this.handleRequest(message.request)
          break
        case 'response':
          if (message.request === FLASH_REQUEST.FILE_PATH) {
            this.pushQueue(async () => {
              console.debug(`Opening archive ${message.payload}`)
              try {
                await this.flashThing?.openStockArchive(message.payload)
              } catch (error) {
                console.error(`Error opening archive: ${error}`)
              }
            })
          } else if (message.request === FLASH_REQUEST.DEVICE_SELECTION) {
            //  Not implemented yet
            // await this.flashThing.(message.payload)
          }
          break
        default:
          throw new Error(`Unknown message type: ${JSON.stringify(message)}`)
      }
    } catch (error) {
      console.error(`Message handling failed: ${error}`)
    }
  }
}

// Initialize worker thread
if (parentPort) {
  const worker = new FlashWorker()

  parentPort.on('message', async (message: FlashServer) => {
    await worker.handleMessage(message)
  })

  // Handle unexpected termination
  process.on('uncaughtException', (error) => {
    console.error(`Uncaught exception: ${error}`)
  })

  process.on('unhandledRejection', (reason) => {
    console.error(`Unhandled rejection: ${reason}`)
  })
}
