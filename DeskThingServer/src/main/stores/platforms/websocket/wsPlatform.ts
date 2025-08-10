import { Worker } from 'node:worker_threads'
import {
  PlatformInterface,
  PlatformEvent,
  PlatformConnectionOptions,
  PlatformEvents,
  PlatformStatus,
  PlatformPayloads
} from '@shared/interfaces/platformInterface'
import {
  SocketData,
  Client,
  DeskThingToDeviceData,
  ProviderCapabilities,
  ClientIdentifier,
  ConnectionState,
  PlatformIDs
} from '@deskthing/types'
import wsPath from './wsWebsocket?modulePath'
import { app } from 'electron'
import logger from '@server/utils/logger'
import EventEmitter from 'node:events'
import { PlatformIPC } from '@shared/types/ipc/ipcPlatform'
import { progressBus } from '@server/services/events/progressBus'
import { ProgressChannel } from '@shared/types'

export class WebSocketPlatform extends EventEmitter<PlatformEvents> implements PlatformInterface {
  private worker: Worker | null = null
  private isActive: boolean = false
  private startTime: number = 0
  private clients: Client[] = []
  private options: PlatformConnectionOptions | undefined = undefined

  readonly identifier: Omit<ClientIdentifier, 'id' | 'active'> = {
    providerId: PlatformIDs.WEBSOCKET,
    capabilities: [ProviderCapabilities.COMMUNICATE, ProviderCapabilities.PING],
    connectionState: ConnectionState.Established
  }

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

    if (!data.type) {
      logger.error('Received platform event with undefined type', {
        source: 'wsPlatform',
        function: 'handlePlatformEvent'
      })
      return undefined
    }

    switch (data.type) {
      case 'disconnect':
        this.worker?.postMessage({
          type: 'websocketEvent',
          data: data
        })
        // handle disconnecting
        break
      case 'ping':
        return this.ping(data.clientId)
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

  public readonly id = PlatformIDs.WEBSOCKET
  public readonly name: string = 'WebSocket'

  private setupWorkerListeners(): void {
    this.worker?.on('message', ({ event, data }: PlatformPayloads) => {
      switch (event) {
        case PlatformEvent.CLIENT_UPDATED:
          {
            this.ensureClientIdentifiers(data)

            const clientIndex = this.clients.findIndex(
              (client) => client.clientId === data.clientId
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
            this.ensureClientIdentifiers(data)

            const clientIndex = this.clients.findIndex(
              (client) => client.clientId === data.clientId
            )
            if (clientIndex !== -1) {
              this.clients[clientIndex] = data
            } else {
              this.clients.push(data)
            }

            if (data.connected && data.connectionState !== ConnectionState.Connected) {
              data.connectionState = ConnectionState.Connected
            }

            logger.info(`Client ${data.clientId} connected via WebSocket`, {
              source: 'wsPlatform',
              function: 'clientConnected'
            })

            this.emit(event, data)
          }
          break
        case PlatformEvent.CLIENT_DISCONNECTED:
          this.clients = this.clients.filter((client) => client.clientId !== data.clientId)
          this.emit(event, data)
          break
        case PlatformEvent.DATA_RECEIVED:
          {
            const clientExists = this.clients.some((c) => c.clientId === data.client.clientId)
            if (clientExists) {
              this.emit(event, data)
            } else {
              logger.warn(`Received data for unknown client ${data.client.clientId}`, {
                source: 'wsPlatform',
                function: 'dataReceived'
              })

              // Request client refresh to fix the inconsistency
              this.worker?.postMessage({
                type: 'refreshClient',
                clientId: data.client.clientId,
                forceRefresh: true
              })
            }
          }
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
        case PlatformEvent.CLIENT_PONG:
          this.emit(event, data)
          break
        case PlatformEvent.REFRESHED_CLIENTS:
          logger.info(
            `Client refresh completed: ${data.active} active, ${data.disconnected} disconnected`,
            {
              source: 'wsPlatform',
              function: 'refreshClients'
            }
          )
          this.emit(event, data)
          break
        case PlatformEvent.CLIENT_LIST:
          this.clients = data
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
      logger.debug(`${data.toString().trim()}`, {
        source: 'wsPlatform',
        function: 'stdout'
      })
    })
    this.worker?.stderr?.on('data', (data) => {
      logger.error(`${data.toString().trim()}`, {
        source: 'wsPlatform',
        function: 'stderr'
      })
    })
  }

  private ensureClientIdentifiers(client: Client): void {
    // Initialize identifiers if not present
    if (!client.identifiers) {
      client.identifiers = {}
    }

    // Add WebSocket identifier if not present
    if (!client.identifiers[this.id]) {
      client.identifiers[this.id] = {
        ...this.identifier,
        id: client.clientId,
        active: true,
        connectionState: ConnectionState.Connected
      }
    } else if (client.identifiers[this.id]) {
      client.identifiers[this.id]!.id = client.clientId
      client.identifiers[this.id]!.active = true
      client.identifiers[this.id]!.connectionState = ConnectionState.Connected
    }

    // Set primary provider if not set
    if (!client.primaryProviderId) {
      client.primaryProviderId = this.id
    }
  }

  async start(options?: PlatformConnectionOptions): Promise<void> {
    if (this.isActive) return
    this.options = options
    this.worker?.postMessage({ type: 'start', options })
    this.isActive = true
    this.startTime = Date.now()
  }

  async ping(clientId: string): Promise<{ server?: number; socket?: number }> {
    progressBus.start(ProgressChannel.PLATFORM_CHANNEL, `Handling Ping`, `Pinging ${clientId}`)
    return new Promise<{ server?: number; socket?: number }>((resolve) => {
      progressBus.update(ProgressChannel.PLATFORM_CHANNEL, `Awaiting response from ${clientId}`, 50)
      const timeoutRef = setTimeout(() => {
        resolveTask({ server: 0, socket: 0 })
      }, 5000)

      const resolveTask = (res: { server?: number; socket?: number }): void => {
        progressBus.complete(
          ProgressChannel.PLATFORM_CHANNEL,
          `Pinged ${clientId} ${res ? 'successfully' : 'unsuccessfully'}`
        )
        resolve(res)
        this.removeListener(PlatformEvent.CLIENT_PONG, onceListener)
        clearTimeout(timeoutRef)
      }

      const onceListener = (data: {
        clientId: string
        result: { server?: number; socket?: number }
      }): void => {
        if (data.clientId === clientId) {
          resolveTask(data.result)
        }
      }

      this.on(PlatformEvent.CLIENT_PONG, onceListener)
      this.worker?.postMessage({
        type: 'websocketEvent',
        data: { type: 'ping', clientId }
      })
    })
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
    if (!this.isActive) {
      logger.warn('Socket is not active! Failed to send data')
      return false
    }
    this.worker?.postMessage({ type: 'sendData', clientId, data })
    return true
  }

  refreshClient(clientId: string, forceRefresh?: boolean): Promise<Client | undefined> {
    this.worker?.postMessage({ type: 'refreshClient', clientId, forceRefresh })
    return Promise.race([
      new Promise<Client | undefined>((resolve) =>
        this.once(PlatformEvent.CLIENT_UPDATED, resolve)
      ),
      new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 5000))
    ])
  }

  async refreshClients(progressMultiplier: number): Promise<boolean> {
    progressBus.start(ProgressChannel.REFRESH_CLIENTS, `Refreshing clients`, `Refreshing clients`)

    let totalProgress = 0
    const update = (message: string, progress: number): void => {
      const progressDelta = progress - totalProgress
      totalProgress += progress
      progressBus.update(
        ProgressChannel.REFRESH_CLIENTS,
        message,
        progressDelta * progressMultiplier
      )
    }

    this.worker?.postMessage({ type: 'refreshClients' })

    const res = await new Promise<boolean>((resolve) => {
      update(`Awaiting devices refresh`, 25)
      const timeoutRef = setTimeout(() => {
        resolveTask(false)
        progressBus.warn(ProgressChannel.PING, `Timed out waiting for clients to refresh`)
      }, 15000)

      const resolveTask = (res: boolean): void => {
        update(`Pinged`, 75)
        resolve(res)
        this.removeListener(PlatformEvent.REFRESHED_CLIENTS, onceListener)
        clearTimeout(timeoutRef)
      }

      const onceListener = (data: { active: number; disconnected: number }): void => {
        update(`Refreshed clients. ${data.active} active, ${data.disconnected} disconnected`, 50)
        resolveTask(true)
      }

      this.once(PlatformEvent.REFRESHED_CLIENTS, onceListener)
    })

    update(`Clients refreshed`, 100)
    return res
  }

  async broadcastData(data: SocketData): Promise<void> {
    if (!this.isActive) return
    this.worker?.postMessage({ type: 'broadcast', data })
  }

  getClients(): Client[] {
    logger.debug(`Getting clients. Returning ${this.clients.length} clients`, {
      function: 'getClients'
    })
    return this.clients
  }

  fetchClients(): Promise<Client[]> {
    this.worker?.postMessage({ type: 'fetchClients' })
    return new Promise((resolve) => this.once(PlatformEvent.CLIENT_LIST, resolve))
  }

  getClientById(clientId: string): Client | undefined {
    return this.clients.find((client) => client.clientId === clientId)
  }

  async updateClient(clientId: string, client: Partial<Client>, notify = true): Promise<void> {
    this.worker?.postMessage({ type: 'updateClient', clientId, client, notify })
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
