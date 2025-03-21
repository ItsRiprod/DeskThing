import { Worker } from 'node:worker_threads'
import {
  PlatformInterface,
  PlatformEvent,
  PlatformConnectionOptions,
  PlatformConnectionListener,
  PlatformEventPayloads,
  PlatformStatus
} from '@shared/interfaces/platform'
import { SocketData, Client } from '@DeskThing/types'
import wsPath from './wsWebsocket?modulePath'
import { app } from 'electron'
import logger from '@server/utils/logger'

export class WebSocketPlatform implements PlatformInterface {
  private worker: Worker
  private listeners: Map<PlatformEvent, PlatformConnectionListener<PlatformEvent>[]> = new Map()
  private isActive: boolean = false
  private startTime: number = 0
  private clients: Client[] = []

  constructor() {
    this.worker = new Worker(wsPath, {
      workerData: { userDataPath: app.getPath('userData'), stdout: true, stderr: true }
    })
    this.setupWorkerListeners()
  }

  public readonly id: string = 'websocket-platform'
  public readonly type: string = 'websocket'
  public readonly name: string = 'WebSocket'

  private setupWorkerListeners(): void {
    this.worker.on(
      'message',
      <T extends PlatformEvent>({
        event,
        payload
      }: {
        event: T
        payload: PlatformEventPayloads[T]
      }) => {
        this.notify(event, payload)

        switch (event) {
          case PlatformEvent.CLIENT_UPDATED:
            {
              const client = payload as PlatformEventPayloads[typeof PlatformEvent.CLIENT_UPDATED]
              const clientIndex = this.clients.findIndex((client) => client.id === client.id)
              if (clientIndex !== -1) {
                this.clients[clientIndex] = client
              }
            }
            break
        }
      }
    )

    this.worker.on('error', (error) => {
      logger.error(`WebSocket worker Error: ${error}`, {
        source: 'wsPlatform',
        function: 'setupWorkerListeners'
      })
      this.notify(PlatformEvent.ERROR, error)
    })

    this.worker.stdout?.on('data', (data) => {
      logger.debug(`${data.toString().trim()}`, {
        domain: 'WebSocket'
      })
    })

    this.worker.stderr?.on('data', (data) => {
      logger.error(`${data.toString().trim()}`, {
        domain: 'WebSocket'
      })
    })
  }

  on<T extends PlatformEvent>(event: T, listener: PlatformConnectionListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    const listeners = this.listeners.get(event) as PlatformConnectionListener<T>[]
    listeners.push(listener)
    return () => {
      const index = listeners.indexOf(listener)
      if (index !== -1) {
        listeners.splice(index, 1)
      }
    }
  }

  off<T extends PlatformEvent>(event: T, listener: PlatformConnectionListener<T>): void {
    const eventListeners = this.listeners.get(event) as PlatformConnectionListener<T>[] | undefined
    if (eventListeners) {
      const index = eventListeners.indexOf(listener)
      if (index !== -1) {
        eventListeners.splice(index, 1)
      }
    }
  }

  removeAllListeners(): void {
    this.listeners.clear()
  }

  private notify<T extends PlatformEvent>(event: T, payload: PlatformEventPayloads[T]): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach((listener) => listener(payload))
    }
  }

  async start(options?: PlatformConnectionOptions): Promise<void> {
    if (this.isActive) return
    this.worker.postMessage({ type: 'start', options })
    this.isActive = true
    this.startTime = Date.now()
  }

  async stop(): Promise<void> {
    if (!this.isActive) return
    this.worker.postMessage({ type: 'stop' })
    this.isActive = false
  }

  async sendData(clientId: string, data: SocketData): Promise<boolean> {
    if (!this.isActive) return false
    this.worker.postMessage({ type: 'sendData', clientId, data })
    return true
  }

  async broadcastData(data: SocketData): Promise<void> {
    if (!this.isActive) return
    this.worker.postMessage({ type: 'broadcast', data })
  }

  getClients(): Client[] {
    return this.clients
  }

  getClientById(clientId: string): Client | undefined {
    return this.clients.find((client) => client.id === clientId)
  }

  updateClient(clientId: string, client: Partial<Client>): void {
    this.worker.postMessage({ type: 'updateClient', clientId, client })
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
