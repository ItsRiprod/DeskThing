/**
 * The ConnectionStore class is a singleton that manages the state of connected clients and devices.
 * It provides methods to add, update, and remove clients, as well as to get the list of connected clients and devices.
 * The class also handles the auto-detection of ADB devices and notifies listeners of changes to the client and device lists.
 */
console.log('[Connection Store] Starting')
import { LOGGING_LEVELS } from '@DeskThing/types'
import { ADBClient, CacheableStore, Client } from '@shared/types'
import Logger from '@server/utils/logger'
import { configureDevice } from '@server/handlers/deviceHandler'
import {
  ClientListener,
  ConnectionStoreClass,
  DeviceListener
} from '@shared/stores/connectionsStore'
import { handleAdbCommands } from '@server/handlers/adbHandler'
import { SettingsStoreClass } from '@shared/stores/settingsStore'
import { TaskStoreClass } from '@shared/stores/taskStore'
import { PlatformStoreClass, PlatformStoreEvent } from '@shared/stores/platformStore'

export class ConnectionStore implements CacheableStore, ConnectionStoreClass {
  private clients: Client[] = []
  private devices: ADBClient[] = []
  private clientListeners: ClientListener[] = []
  private deviceListeners: DeviceListener[] = []
  private autoDetectADB: boolean = false
  private clearTimeout: NodeJS.Timeout | null = null

  // Stores that are DI
  private settingsStore: SettingsStoreClass
  private taskStore: TaskStoreClass
  private platformStore: PlatformStoreClass

  constructor(
    settingsStore: SettingsStoreClass,
    taskStore: TaskStoreClass,
    platformStore: PlatformStoreClass
  ) {
    this.settingsStore = settingsStore
    this.taskStore = taskStore
    this.platformStore = platformStore
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
    // Setting Store listeners
    this.settingsStore.getSettings().then((settings) => {
      if (settings) {
        this.autoDetectADB = settings.autoDetectADB
      }
    })

    this.settingsStore.addListener((newSettings) => {
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

    // Connection store
    this.platformStore.on(PlatformStoreEvent.CLIENT_CONNECTED, (client) => {
      this.addClient(client)
    })

    this.platformStore.on(PlatformStoreEvent.CLIENT_DISCONNECTED, (client) => {
      this.removeClient(client)
    })

    this.platformStore.on(PlatformStoreEvent.CLIENT_UPDATED, (client) => {
      this.updateClient(client.id, client)
    })
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

  getDevices(): Promise<ADBClient[]> {
    return this.getAdbDevices()
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

  private parseADBDevices = (response: string): ADBClient[] => {
    const lines = response
      .split('\n')
      .filter((line) => line && !line.startsWith('List of devices attached') && line.trim() !== '')

    // Get all of the adb ids that are connected for use later
    const connectedAdbIds = this.clients.reduce(
      (acc, client) => (client.adbId ? [...acc, client.adbId] : acc),
      [] as string[]
    )

    // Filter out the 'device' keywords but only include lines with the device keyword
    const adbDevices: ADBClient[] = lines.reduce((acc, line) => {
      if (line.includes('device')) {
        const deviceId = line.replace('device', '').trim()

        const adbClient: ADBClient = {
          // the device id
          adbId: deviceId.split(' ')[0],
          // if the device is offline
          offline: deviceId.includes('offline'),
          // If the device is in the connected list
          connected: connectedAdbIds.includes(deviceId),

          // If there is more than one "section" then that means there is some type of error
          error: deviceId.split(' ').length > 0 ? deviceId : ''
        }

        return [...acc, adbClient]
      } else {
        return acc
      }
    }, [] as ADBClient[])

    return adbDevices
  }

  async getAdbDevices(): Promise<ADBClient[]> {
    try {
      Logger.info('Getting ADB devices', {
        function: 'getAdbDevices',
        source: 'ConnectionsStore'
      })
      const result = await handleAdbCommands('devices')

      const newDevices = this.parseADBDevices(result) || []

      if (newDevices.length > 0) {
        this.taskStore.completeStep('server', 'device', 'detect')
        if (newDevices.some((device) => device.connected)) {
          this.taskStore.completeStep('server', 'device', 'configure')
        }
      }

      this.devices = newDevices

      this.notifyDeviceListeners()
      Logger.info('ADB Device found!', {
        function: 'getAdbDevices',
        source: 'ConnectionsStore'
      })

      try {
        // Automatically config the devices if it is both not offline and not connected
        const settings = await this.settingsStore.getSettings()
        if (settings?.autoConfig && newDevices.some((device) => !device.connected)) {
          // Wait for all of the devices to configure
          Logger.info('Automatically configuring disconnected devices', {
            function: 'getAdbDevices',
            source: 'connectionsStore'
          })
          await Promise.all(
            newDevices.map(async (device) => {
              if (!device.connected && !device.offline) {
                await configureDevice(device.adbId)
              }
            })
          )
        }
      } catch (error) {
        Logger.error('Error auto-configuring devices!', {
          error: error as Error,
          function: 'getAdbDevices',
          source: 'ConnectionsStore'
        })
      }

      return newDevices
    } catch (error) {
      Logger.error('Error detecting ADB devices!', {
        error: error as Error,
        function: 'getAdbDevices',
        source: 'ConnectionsStore'
      })
      return []
    }
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
