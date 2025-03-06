import { Worker } from 'node:worker_threads'
import {
  PlatformInterface,
  PlatformEvent,
  PlatformConnectionOptions,
  PlatformConnectionListener,
  PlatformEventPayloads,
  PlatformStatus
} from '@shared/interfaces/platform'
import { SocketData } from '@DeskThing/types'
import { Client } from '@shared/types'
import wsPath from './wsWebsocket?modulePath'
import { app } from 'electron'

export class WebSocketPlatform implements PlatformInterface {
  private worker: Worker
  private listeners: Map<PlatformEvent, PlatformConnectionListener<PlatformEvent>[]> = new Map()
  private isActive: boolean = false
  private startTime: number = 0
  private clients: Client[] = []

  constructor() {
    this.worker = new Worker(wsPath, { workerData: { userDataPath: app.getPath('userData') } })
    this.setupWorkerListeners()
  }

  public readonly id: string = 'websocket-platform'
  public readonly type: string = 'websocket'
  public readonly name: string = 'WebSocket Platform'

  private setupWorkerListeners(): void {
    this.worker.on(
      'message',
      <T extends PlatformEvent>(message: { event: T; payload: PlatformEventPayloads[T] }) => {
        this.notify(message.event, message.payload)
      }
    )

    this.worker.on('error', (error) => {
      this.notify(PlatformEvent.ERROR, error)
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
