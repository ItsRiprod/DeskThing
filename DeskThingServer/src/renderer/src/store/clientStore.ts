export interface ServerManifest {
  name: string
  id: string
  short_name: string
  description: string
  builtFor: string
  reactive: boolean
  author: string
  version: string
  port: number
  ip: string
  default_view: string
  miniplayer: string
}

export interface Client {
  ip: string
  port?: number
  hostname?: string
  headers?: Record<string, string>
  userAgent?: string
  connectionId: string
  connected: boolean
  timestamp: number
  currentApp?: string
  version?: string
  client_name?: string
  description?: string
}

type EVENTS = 'ADBDevices' | 'Connections' | 'Clients' | string

type callback = (client: string[] | Client[] | number) => void

export class ClientStore {
  private static instance: ClientStore
  private ADBDevices: string[] = []
  private connections: number = 0
  private clients: Client[] = []
  private listeners: { [key in EVENTS]: callback[] } = {}
  constructor() {
    window.electron.ipcRenderer.on('connections', (event, data) =>
      this.handleConnection(event, data)
    )
    window.electron.ipcRenderer.on('clients', (event, data) => this.handleClients(event, data))
    this.requestADBDevices()
  }

  static getInstance(): ClientStore {
    if (!ClientStore.instance) {
      ClientStore.instance = new ClientStore()
    }
    return ClientStore.instance
  }

  private handleConnection = (_event, ipcData): void => {
    this.connections = ipcData.data
    this.notifyListeners('Connections', this.connections)
  }
  private handleClients = (_event, ipcData): void => {
    this.clients = ipcData.data
    this.notifyListeners('Clients', this.clients)
  }

  requestADBDevices = async (): Promise<string[]> => {
    const response = await window.electron.runAdbCommand('devices')
    if (response) {
      console.log(response)
      // Assuming response is a string with device names separated by newline
      const deviceList = response
        .split('\n')
        .filter(
          (line) => line && !line.startsWith('List of devices attached') && line.trim() !== ''
        )
        .map((line) => line.replace('device', '').trim())
      this.ADBDevices = deviceList
      this.notifyListeners('ADBDevices', deviceList)
      return deviceList
    } else {
      console.log('No devices found')
      return []
    }
  }
  requestConnections = (): void => window.electron.ipcRenderer.send('get-connections')

  getConnections = (): number => {
    return this.connections
  }

  getADBDevices = async (): Promise<string[]> => {
    if (this.ADBDevices) {
      return this.ADBDevices
    } else {
      return this.requestADBDevices()
    }
  }

  getClients = (): Client[] => {
    if (this.clients) {
      return this.clients
    } else {
      this.getConnections()
      return []
    }
  }

  on(event: EVENTS, callback: callback): () => void {
    if (this.listeners[event]) {
      this.listeners[event].push(callback)
    } else {
      this.listeners[event] = [callback]
    }

    return () => {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback)
    }
  }

  notifyListeners(event: EVENTS, data: string[] | Client[] | number): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(data))
    }
  }
}

export default ClientStore.getInstance()
