import { Client } from '../types/'

type ClientListener = (client: Client[]) => void

class ConnectionStore {
  private clients: Client[] = []
  private static instance: ConnectionStore
  private clientListeners: ClientListener[] = []

  static getInstance(): ConnectionStore {
    if (!ConnectionStore.instance) {
      ConnectionStore.instance = new ConnectionStore()
    }
    return ConnectionStore.instance
  }

  on(listener: ClientListener): () => void {
    this.clientListeners.push(listener)

    return () => {
      this.clientListeners = this.clientListeners.filter((l) => l !== listener)
    }
  }

  getClients(): Client[] {
    console.log('Getting clients:', this.clients)
    return this.clients
  }

  addClient(client: Client): void {
    console.log('Adding client:', client)
    this.clients.push(client)
    this.notifyListeners()
  }

  updateClient(connectionId: string, updates: Partial<Client>): void {
    console.log('Updating client:', connectionId, updates)
    const clientIndex = this.clients.findIndex((c) => c.connectionId === connectionId)

    if (clientIndex !== -1) {
      this.clients[clientIndex] = { ...this.clients[clientIndex], ...updates }
      this.notifyListeners()
    }
  }

  removeClient(connectionId: string): void {
    console.log('Removing client:', connectionId)
    this.clients = this.clients.filter((c) => c.connectionId !== connectionId)
    this.notifyListeners()
  }

  removeAllClients(): void {
    console.log('Removing all clients')
    this.clients = []
    this.notifyListeners()
  }

  notifyListeners(): void {
    this.clientListeners.forEach((listener) => listener(this.clients))
  }
}
export default ConnectionStore.getInstance()
