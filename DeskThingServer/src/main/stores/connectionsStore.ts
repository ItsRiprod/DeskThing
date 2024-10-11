import { Client } from '@shared/types'
import { handleAdbCommands } from '../handlers/adbHandler'
import dataListener, { MESSAGE_TYPES } from '../utils/events'
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
    settingsStore.getSettings().then((settings) => {
      this.autoDetectADB = settings.autoDetectADB
    })

    dataListener.on(MESSAGE_TYPES.SETTINGS, (newSettings) => {
      try {
        if (newSettings.autoDetectADB !== undefined) {
          this.autoDetectADB = newSettings.autoDetectADB

          if (this.clearTimeout) {
            clearTimeout(this.clearTimeout)
          }

          if (newSettings.autoDetectADB) {
            this.checkAutoDetectADB()
            dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, '[ADB]: Auto-Detect is Enabled')
          } else {
            console.log('Auto-detect ADB disabled')
            dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, '[ADB]: Auto-Detect is Disabled')
          }
        }
      } catch (error) {
        dataListener.asyncEmit(MESSAGE_TYPES.ERROR, 'ADB: Error updating with settings', error)
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

  on(listener: ClientListener): () => void {
    this.clientListeners.push(listener)

    return () => {
      this.clientListeners = this.clientListeners.filter((l) => l !== listener)
    }
  }

  onDevice(listener: DeviceListener): () => void {
    this.deviceListeners.push(listener)

    return () => {
      this.deviceListeners = this.deviceListeners.filter((l) => l !== listener)
    }
  }

  getClients(): Client[] {
    console.log('Getting clients:', this.clients)
    return this.clients
  }

  getDevices(): string[] {
    console.log('Getting devices:', this.devices)
    return this.devices
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
    } else {
      console.log('Client not found:', connectionId)
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

  notifyDeviceListeners(): void {
    this.deviceListeners.forEach((listener) => listener(this.devices))
  }

  async getAdbDevices(): Promise<string[]> {
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
        dataListener.asyncEmit(MESSAGE_TYPES.LOGGING, 'ADB Device found!')
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
        console.log('Auto-detecting ADB devices...')
        await this.getAdbDevices()
        this.clearTimeout = await setTimeout(checkAndAutoDetect, 7000)
      }
    }

    checkAndAutoDetect()
  }
}

export default ConnectionStore.getInstance()
