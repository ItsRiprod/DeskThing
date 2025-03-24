import WebSocket, { WebSocketServer } from 'ws'
import { Server as HttpServer, IncomingMessage } from 'http'
import { parentPort, workerData } from 'worker_threads'
import express from 'express'
import crypto from 'crypto'
import {
  PlatformEvent,
  PlatformConnectionOptions,
  PlatformEventPayloads,
  PlatformStatus
} from '@shared/interfaces/platform'
import { SocketData, Client, DeviceToDeskthingData, DeskThingToAppCore } from '@deskthing/types'
import { ExpressServer } from './expressWorker'

type AdditionalOptions = {
  port?: number
  address?: string
}

export class WSPlatform {
  private server: WebSocketServer | null = null
  private httpServer: HttpServer | null = null
  private clients: Map<string, { client: Client; socket: WebSocket }> = new Map()
  private isActive: boolean = false
  private startTime: number = 0
  private userDataPath: string
  private expressServer: ExpressServer | null = null
  private options: PlatformConnectionOptions<AdditionalOptions> = {
    port: 8891,
    address: 'localhost'
  }

  public readonly id: string

  constructor(userDataPath: string) {
    this.userDataPath = userDataPath
    this.id = crypto.randomUUID()
  }

  private sendToParent = <T extends PlatformEvent>(
    event: T,
    payload: PlatformEventPayloads[T]
  ): void => {
    parentPort?.postMessage({ event, payload })
  }

  async start(options?: PlatformConnectionOptions<AdditionalOptions>): Promise<void> {
    if (this.isActive) return

    this.options = options ?? this.options
    const port = this.options.port || 8891
    const address = this.options.address

    const expressApp = express()
    this.expressServer = new ExpressServer(expressApp, this.userDataPath, port)
    this.expressServer.initializeServer()
    this.httpServer = this.expressServer.getServer() as HttpServer

    this.server = new WebSocketServer({ server: this.httpServer })

    this.server.on('connection', this.handleConnection.bind(this))

    this.server.on('listening', () => {
      this.sendToParent(PlatformEvent.SERVER_STARTED, { port, address })
    })

    this.isActive = true
    this.startTime = Date.now()
    this.sendToParent(PlatformEvent.STATUS_CHANGED, this.getStatus())
  }

  async stop(): Promise<void> {
    if (!this.isActive) return

    this.clients.forEach((client) => {
      client.socket.terminate()
    })
    this.clients.clear()

    if (this.server) {
      this.server.close()
      this.server = null
    }

    if (this.expressServer) {
      await this.expressServer.shutdown()
      this.expressServer = null
    }

    if (this.httpServer) {
      this.httpServer = null
    }

    this.isActive = false
    this.sendToParent(PlatformEvent.STATUS_CHANGED, this.getStatus())
  }

  private handleConnection(socket: WebSocket, req: IncomingMessage): void {
    const connectionId = crypto.randomUUID()

    const client: Client = {
      id: connectionId,
      connected: true,
      timestamp: Date.now(),
      connectionId,
      userAgent: req.headers['user-agent'] || ''
    }

    this.clients.set(connectionId, { client, socket })
    this.sendToParent(PlatformEvent.CLIENT_CONNECTED, client)

    socket.on('message', (message: string) => {
      try {
        const data = JSON.parse(message) as DeviceToDeskthingData & { connectionId: string }
        this.sendToParent(PlatformEvent.DATA_RECEIVED, { client: client, data: data })
      } catch (error) {
        this.sendToParent(PlatformEvent.ERROR, new Error(`Invalid message format: ${error}`))
      }
    })

    socket.on('close', () => {
      this.clients.delete(connectionId)
      this.sendToParent(PlatformEvent.CLIENT_DISCONNECTED, client)
    })

    socket.on('error', (error) => {
      this.sendToParent(PlatformEvent.ERROR, error)
    })
  }

  async sendData(clientId: string, data: DeskThingToAppCore): Promise<boolean> {
    const clientConnection = this.clients.get(clientId)
    if (!clientConnection) return false

    try {
      clientConnection.socket.send(JSON.stringify(data))
      return true
    } catch (error) {
      this.sendToParent(
        PlatformEvent.ERROR,
        error instanceof Error
          ? error
          : new Error('Unknown error occurred sending data to websocket', { cause: error })
      )
      return false
    }
  }

  async broadcastData(data: SocketData): Promise<void> {
    this.clients.forEach(({ socket }) => {
      try {
        if (socket.readyState == WebSocket.OPEN) {
          socket.send(JSON.stringify(data))
        } else {
          console.error('Socket not open, adding to queue')
        }
      } catch (error) {
        console.error('Encountered error ', error)
        this.sendToParent(
          PlatformEvent.ERROR,
          error instanceof Error
            ? error
            : new Error('Unknown error occurred broadcasting data to websocket clients', {
                cause: error
              })
        )
      }
    })
  }

  getClients(): Client[] {
    return Array.from(this.clients.values()).map(({ client }) => client)
  }

  getClientById(clientId: string): Client | undefined {
    return this.clients.get(clientId)?.client
  }

  isRunning(): boolean {
    return this.isActive
  }

  updateClient(clientId: string, newClient: Partial<Client>): void {
    const clientObj = this.clients.get(clientId)
    if (!clientObj) {
      console.error(`Unable to find the client for id ${clientId}`)
      return
    }

    const { client } = clientObj
    clientObj.client = { ...client, ...newClient }
    this.sendToParent(PlatformEvent.CLIENT_UPDATED, clientObj.client)
    this.clients.set(clientId, clientObj)
    console.log('Updated the client')
  }

  getStatus(): PlatformStatus {
    return {
      isActive: this.isActive,
      clients: this.getClients(),
      uptime: this.isActive ? Date.now() - this.startTime : 0
    }
  }
}

// Worker thread communication
if (parentPort) {
  const platform = new WSPlatform(workerData.userDataPath)

  parentPort.on('message', async (message) => {
    switch (message.type) {
      case 'start':
        await platform.start(message.options)
        break
      case 'stop':
        await platform.stop()
        break
      case 'sendData':
        await platform.sendData(message.clientId, message.data)
        break
      case 'broadcast':
        await platform.broadcastData(message.data)
        break
      case 'updateClient':
        await platform.updateClient(message.clientId, message.client)
        break
    }
  })
}
