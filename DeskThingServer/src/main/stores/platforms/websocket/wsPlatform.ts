import { Worker } from 'node:worker_threads'
import {
  PlatformInterface,
  PlatformEvent,
  PlatformConnectionOptions,
  PlatformEvents,
  PlatformStatus,
  PlatformPayloads,
  PlatformCapability
} from '@shared/interfaces/platformInterface'
import { SocketData, Client, DeskThingToDeviceData } from '@deskthing/types'
import wsPath from './wsWebsocket?modulePath'
import { app } from 'electron'
import logger from '@server/utils/logger'
import EventEmitter from 'node:events'
import { PlatformIDs } from '@shared/stores/platformStore'
import { PlatformIPC } from '@shared/types/ipc/ipcPlatform'

export class WebSocketPlatform extends EventEmitter<PlatformEvents> implements PlatformInterface {
  private worker: Worker | null = null
  private isActive: boolean = false
  private startTime: number = 0
  private clients: Client[] = []
  private options: PlatformConnectionOptions | undefined = undefined

  constructor() {
    super()
    this.setupWorker()
  }

  private setupWorker = async (): Promise<void> => {
    if (this.worker) this.worker?.terminate()

    this.worker = new Worker(wsPath, {
      workerData: { userDataPath: app.getPath('userData'), stdout: true, stderr: true },
      name: 'WebSocketPlatform',
      stdout: true,
      stderr: true
    })
    this.setupWorkerListeners()
  }

  public handlePlatformEvent = async <T extends PlatformIPC>(data: T): Promise<T['data']> => {
    if (data.platform !== PlatformIDs.WEBSOCKET) return undefined

    switch (data.type) {
      case 'disconnect':
        this.worker?.postMessage({
          type: 'websocketEvent',
          data: data
        })
        // handle disconnecting
        break
      case 'ping':
        this.worker?.postMessage({
          type: 'websocketEvent',
          data: data
        })
        // handle ping
        break
      case 'pong':
        this.worker?.postMessage({
          type: 'websocketEvent',
          data: data
        })
        // handle pong
        break
      case 'restart':
        this.worker?.postMessage({
          type: 'websocketEvent',
          data: data
        })
        // handle pong
        break
    }

    return undefined
  }

  public readonly id: PlatformIDs = PlatformIDs.WEBSOCKET
  public readonly name: string = 'WebSocket'
  public readonly capabilities: PlatformCapability[] = [
    PlatformCapability.DETECT,
    PlatformCapability.COMMUNICATE
  ]

  private setupWorkerListeners(): void {
    this.worker?.on('message', ({ event, data }: PlatformPayloads) => {
      switch (event) {
        case PlatformEvent.CLIENT_UPDATED:
          {
            const clientIndex = this.clients.findIndex(
              (client) => client.connectionId === data.connectionId
            )
            if (clientIndex !== -1) {
              this.clients[clientIndex] = data
            } else {
              this.clients.push(data)
            }
            this.emit(event, data)
          }
          break
        case PlatformEvent.CLIENT_CONNECTED:
          {
            const clientIndex = this.clients.findIndex(
              (client) => client.connectionId === data.connectionId
            )
            if (clientIndex !== -1) {
              this.clients[clientIndex] = data
            } else {
              this.clients.push(data)
            }
            this.emit(event, data)
          }
          break
        case PlatformEvent.CLIENT_DISCONNECTED:
          this.clients = this.clients.filter((client) => client.connectionId !== data.connectionId)
          this.emit(event, data)
          break
        case PlatformEvent.DATA_RECEIVED:
          this.emit(event, data)
          break
        case PlatformEvent.ERROR:
          this.emit(event, data)
          break
        case PlatformEvent.STATUS_CHANGED:
          this.emit(event, data)
          break
        case PlatformEvent.SERVER_STARTED:
          this.emit(event, data)
          break
      }
    })

    this.worker?.on('error', (error) => {
      logger.error(`WebSocket worker Error: ${error}`, {
        source: 'wsPlatform',
        function: 'setupWorkerListeners'
      })
      this.emit(PlatformEvent.ERROR, error)

      this.stop()

      this.start(this.options)
    })

    this.worker?.stdout?.on('data', (data) => {
      logger.info(`${data.toString().trim()}`, {
        domain: 'WebSocket',
        source: 'wsPlatform',
        function: 'stdout'
      })
    })

    this.worker?.stderr?.on('data', (data) => {
      logger.error(`${data.toString().trim()}`, {
        domain: 'WebSocket'
      })
    })
  }

  async start(options?: PlatformConnectionOptions): Promise<void> {
    if (this.isActive) return
    this.options = options
    this.worker?.postMessage({ type: 'start', options })
    this.isActive = true
    this.startTime = Date.now()
  }

  async stop(): Promise<void> {
    if (!this.isActive) return
    this.worker?.postMessage({ type: 'stop' })
    this.isActive = false
  }

  async sendData<T extends string>(
    clientId: string,
    data: DeskThingToDeviceData & { app: T }
  ): Promise<boolean> {
    if (!this.isActive) return false
    this.worker?.postMessage({ type: 'sendData', clientId, data })
    return true
  }

  async broadcastData(data: SocketData): Promise<void> {
    if (!this.isActive) return
    this.worker?.postMessage({ type: 'broadcast', data })
  }

  getClients(): Client[] {
    logger.debug(`Getting clients. Returning ${this.clients.length} clients`, {
      domain: 'wsPlatform',
      function: 'getClients'
    })
    return this.clients
  }

  getClientById(clientId: string): Client | undefined {
    return this.clients.find((client) => client.id === clientId)
  }

  updateClient(clientId: string, client: Partial<Client>): void {
    this.worker?.postMessage({ type: 'updateClient', clientId, client })
  }

  isRunning(): boolean {
    return this.isActive
  }

  getStatus(): PlatformStatus {
    return {
      isActive: this.isActive,
      clients: this.clients,
      uptime: this.isActive ? Date.now() - this.startTime : 0
    }
  }
}
