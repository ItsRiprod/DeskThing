import WebSocket, { WebSocketServer } from 'ws'
import { Server as HttpServer, IncomingMessage } from 'http'
import { parentPort, workerData } from 'worker_threads'
import express from 'express'
import crypto from 'crypto'
import {
  PlatformEvent,
  PlatformConnectionOptions,
  PlatformStatus,
  PlatformPayloads
} from '@shared/interfaces/platformInterface'
import { SocketData, Client, DeviceToDeskthingData, DeskThingToAppCore } from '@deskthing/types'
import { ExpressServer } from './expressWorker'
import { WebsocketPlatformIPC } from '@shared/types'

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

  private sendToParent = (data: PlatformPayloads): void => {
    parentPort?.postMessage(data)
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
      this.sendToParent({ event: PlatformEvent.SERVER_STARTED, data: { port, address } })
    })

    this.isActive = true
    this.startTime = Date.now()
    this.sendToParent({ event: PlatformEvent.STATUS_CHANGED, data: this.getStatus() })
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
    this.sendToParent({ event: PlatformEvent.STATUS_CHANGED, data: this.getStatus() })
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
    this.sendToParent({ event: PlatformEvent.CLIENT_CONNECTED, data: client })

    socket.on('message', (message: string) => {
      try {
        const data = JSON.parse(message) as DeviceToDeskthingData & { connectionId: string }
        this.sendToParent({
          event: PlatformEvent.DATA_RECEIVED,
          data: { client, data }
        })
      } catch (error) {
        this.sendToParent({
          event: PlatformEvent.ERROR,
          data: new Error(`Invalid message format: ${error}`)
        })
      }
    })

    socket.on('close', () => {
      this.clients.delete(connectionId)
      this.sendToParent({ event: PlatformEvent.CLIENT_DISCONNECTED, data: client })
    })

    socket.on('error', (error) => {
      this.sendToParent({ event: PlatformEvent.ERROR, data: error })
    })
  }

  async sendData(clientId: string, data: DeskThingToAppCore): Promise<boolean> {
    const clientConnection = this.clients.get(clientId)
    if (!clientConnection) return false

    try {
      clientConnection.socket.send(JSON.stringify(data))
      return true
    } catch (error) {
      this.sendToParent({
        event: PlatformEvent.ERROR,
        data:
          error instanceof Error
            ? error
            : new Error('Unknown error occurred sending data to websocket', { cause: error })
      })
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
        this.sendToParent({
          event: PlatformEvent.ERROR,
          data:
            error instanceof Error
              ? error
              : new Error('Unknown error occurred broadcasting data to websocket clients', {
                  cause: error
                })
        })
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
    this.sendToParent({ event: PlatformEvent.CLIENT_UPDATED, data: clientObj.client })
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

  // Custom websocket-specific operations

  async handleClientDisconnected(clientId: string): Promise<void> {
    console.log('CLosing connection to client', clientId)
    this.clients.get(clientId)?.socket.close()
  }

  async handleCustomEvent(data: WebsocketPlatformIPC): Promise<void> {
    switch (data.type) {
      case 'disconnect':
        await this.handleClientDisconnected(data.clientId)
        break
      case 'restart':
        console.log('Restarting websocket server')
        await this.stop()
        await this.start(this.options)
        break
      default:
        console.error(`Unsupported event: ${data.type}`)
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
      case 'getStatus':
        parentPort?.postMessage({ type: 'status', status: platform.getStatus() })
        break
      case 'websocketEvent':
        await platform.handleCustomEvent(message.data)
        break
    }
  })
}
