/**
 * The ConnectionStore class is a singleton that manages the state of connected clients and devices.
 * It provides methods to add, update, and remove clients, as well as to get the list of connected clients and devices.
 * The class also handles the auto-detection of ADB devices and notifies listeners of changes to the client and device lists.
 */
console.log('[Connection Store] Starting')
import { LOGGING_LEVELS } from '@DeskThing/types'
import { CacheableStore, Client } from '@shared/types'
import { settingsStore } from '.'
import Logger from '@server/utils/logger'
type ClientListener = (client: Client[]) => void
type DeviceListener = (device: string[]) => void

class ConnectionStore implements CacheableStore {
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

  public clearCache = async (): Promise<void> => {
    this.clearTimeout && clearTimeout(this.clearTimeout)

    this.devices = []
  }
  public saveToFile = async (): Promise<void> => {
    /**
     * Nothing to save to file for this store
     */
  }

  private setupConnectionListeners = async (): Promise<void> => {
    // Cooldown to let the settings store startup
    await new Promise((res) => setTimeout(res, 200))

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
            Logger.log(LOGGING_LEVELS.LOG, '[ADB]: Auto-Detect is Enabled', {
              function: 'setupConnectionListeners',
              source: 'ConnectionStore'
            })
          } else {
            Logger.log(LOGGING_LEVELS.LOG, '[ADB]: Auto-Detect is Disabled', {
              function: 'setupConnectionListeners',
              source: 'ConnectionStore'
            })
          }
        }
      } catch (error) {
        Logger.log(LOGGING_LEVELS.ERROR, 'ADB: Error updating with settings', {
          error: error as Error,
          function: 'setupConnectionListeners',
          source: 'ConnectionStore'
        })
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
    Logger.log(LOGGING_LEVELS.LOG, 'Pinging client:' + connectionId, {
      function: 'pingClient',
      source: 'ConnectionStore'
    })
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
    Logger.log(LOGGING_LEVELS.LOG, 'Updating client:' + connectionId + updates, {
      function: 'updateClient',
      source: 'ConnectionStore'
    })
    const clientIndex = this.clients.findIndex((c) => c.connectionId === connectionId)

    if (clientIndex !== -1) {
      this.clients[clientIndex] = { ...this.clients[clientIndex], ...updates }
      this.notifyListeners()
    } else {
      Logger.log(LOGGING_LEVELS.LOG, 'Client not found:' + connectionId, {
        function: 'updateClient',
        source: 'ConnectionStore'
      })
    }
  }

  async removeClient(connectionId: string): Promise<void> {
    Logger.log(LOGGING_LEVELS.LOG, 'Removing client:' + connectionId)
    this.clients = this.clients.filter((c) => c.connectionId !== connectionId)
    this.notifyListeners()
  }

  async removeAllClients(): Promise<void> {
    Logger.log(LOGGING_LEVELS.LOG, 'Removing all clients')
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
        Logger.log(LOGGING_LEVELS.LOG, 'ADB Device found!')
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
        Logger.log(LOGGING_LEVELS.LOG, 'Auto-detecting ADB devices...')
        await this.getAdbDevices()
        this.clearTimeout = await setTimeout(checkAndAutoDetect, 7000)
      }
    }

    checkAndAutoDetect()
  }
}

export default ConnectionStore.getInstance()
