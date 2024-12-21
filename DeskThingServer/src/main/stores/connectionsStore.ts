/**
 * The ConnectionStore class is a singleton that manages the state of connected clients and devices.
 * It provides methods to add, update, and remove clients, as well as to get the list of connected clients and devices.
 * The class also handles the auto-detection of ADB devices and notifies listeners of changes to the client and device lists.
 */
console.log('[Connection Store] Starting')
import { Client, MESSAGE_TYPES } from '@shared/types'
import loggingStore from '../stores/loggingStore'
import settingsStore from './settingsStore'

type ClientListener = (client: Client[]) => void
type DeviceListener = (device: string[]) => void

class ConnectionStore {
  private clients: Client[] = []
  private devices: string[] = []
  private static instance: ConnectionStore
  private clientListeners: ClientListener[] = []
  private deviceListeners: DeviceListener[] = []
  private autoDetectADB: boolean = false
  private clearTimeout: NodeJS.Timeout | null = null

  constructor() {
    this.setupConnectionListeners()
  }

  private setupConnectionListeners = async (): Promise<void> => {
    settingsStore.getSettings().then((settings) => {
      this.autoDetectADB = settings.autoDetectADB
    })

    settingsStore.addListener((newSettings) => {
      try {
        if (newSettings.autoDetectADB !== undefined) {
          this.autoDetectADB = newSettings.autoDetectADB

          if (this.clearTimeout) {
            clearTimeout(this.clearTimeout)
          }

          if (newSettings.autoDetectADB) {
            this.checkAutoDetectADB()
            loggingStore.log(MESSAGE_TYPES.LOGGING, '[ADB]: Auto-Detect is Enabled')
          } else {
            loggingStore.log(MESSAGE_TYPES.LOGGING, '[ADB]: Auto-Detect is Disabled')
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          loggingStore.log(MESSAGE_TYPES.ERROR, 'ADB: Error updating with settings', error.message)
        } else {
          loggingStore.log(MESSAGE_TYPES.ERROR, 'ADB: Error updating with settings', String(error))
        }
      }
    })

    // Initial check
    this.checkAutoDetectADB()
  }

  static getInstance(): ConnectionStore {
    if (!ConnectionStore.instance) {
      ConnectionStore.instance = new ConnectionStore()
    }
    return ConnectionStore.instance
  }

  async on(listener: ClientListener): Promise<() => void> {
    this.clientListeners.push(listener)

    return () => {
      this.clientListeners = this.clientListeners.filter((l) => l !== listener)
    }
  }

  async onDevice(listener: DeviceListener): Promise<() => void> {
    this.deviceListeners.push(listener)

    return () => {
      this.deviceListeners = this.deviceListeners.filter((l) => l !== listener)
    }
  }

  pingClient(connectionId: string): boolean {
    loggingStore.log(MESSAGE_TYPES.LOGGING, 'Pinging client:', connectionId)
    const clientIndex = this.clients.findIndex((c) => c.connectionId === connectionId)
    console.error('PINGING CLIENTS NOT IMPLEMENTED YET')
    if (clientIndex !== -1) {
      // this.clients[clientIndex] = Date.now()
      return true
    }
    return false
  }

  getClients(): Client[] {
    return this.clients
  }

  getDevices(): string[] {
    return this.devices
  }

  async addClient(client: Client): Promise<void> {
    this.clients.push(client)
    this.notifyListeners()
  }

  async updateClient(connectionId: string, updates: Partial<Client>): Promise<void> {
    loggingStore.log(MESSAGE_TYPES.LOGGING, 'Updating client:' + connectionId + updates)
    const clientIndex = this.clients.findIndex((c) => c.connectionId === connectionId)

    if (clientIndex !== -1) {
      this.clients[clientIndex] = { ...this.clients[clientIndex], ...updates }
      this.notifyListeners()
    } else {
      loggingStore.log(MESSAGE_TYPES.LOGGING, 'Client not found:', connectionId)
    }
  }

  async removeClient(connectionId: string): Promise<void> {
    loggingStore.log(MESSAGE_TYPES.LOGGING, 'Removing client:' + connectionId)
    this.clients = this.clients.filter((c) => c.connectionId !== connectionId)
    this.notifyListeners()
  }

  async removeAllClients(): Promise<void> {
    loggingStore.log(MESSAGE_TYPES.LOGGING, 'Removing all clients')
    this.clients = []
    this.notifyListeners()
  }

  async notifyListeners(): Promise<void> {
    this.clientListeners.forEach((listener) => listener(this.clients))
  }

  async notifyDeviceListeners(): Promise<void> {
    this.deviceListeners.forEach((listener) => listener(this.devices))
  }

  async getAdbDevices(): Promise<string[]> {
    const { handleAdbCommands } = await import('../handlers/adbHandler')
    return handleAdbCommands('devices')
      .then((result) => {
        const parseADBDevices = (response: string): string[] => {
          return response
            .split('\n')
            .filter(
              (line) => line && !line.startsWith('List of devices attached') && line.trim() !== ''
            )
            .map((line) => line.replace('device', '').trim())
        }
        const newDevices = parseADBDevices(result) || []
        this.devices = newDevices
        this.notifyDeviceListeners()
        loggingStore.log(MESSAGE_TYPES.LOGGING, 'ADB Device found!')
        return newDevices
      })
      .catch((error) => {
        console.error('Error auto-detecting ADB devices:', error)
        return []
      })
  }

  async checkAutoDetectADB(): Promise<void> {
    if (this.clearTimeout) {
      clearTimeout(this.clearTimeout)
    }

    const checkAndAutoDetect = async (): Promise<void> => {
      if (this.autoDetectADB === true) {
        loggingStore.log(MESSAGE_TYPES.LOGGING, 'Auto-detecting ADB devices...')
        await this.getAdbDevices()
        this.clearTimeout = await setTimeout(checkAndAutoDetect, 7000)
      }
    }

    checkAndAutoDetect()
  }
}

export default ConnectionStore.getInstance()
