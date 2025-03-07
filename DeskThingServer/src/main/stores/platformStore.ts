import {
  PlatformInterface,
  PlatformEvent,
  PlatformConnectionOptions,
  PlatformStatus
} from '@shared/interfaces/platform'
import { AppSettings, SEND_TYPES, SocketData } from '@DeskThing/types'
import Logger from '@server/utils/logger'
import { Client } from '@shared/types'
import {
  PlatformStoreClass,
  PlatformStoreEvent,
  PlatformStoreEvents,
  PlatformStoreListener
} from '@shared/stores/platformStore'
import { handlePlatformMessage } from '@server/services/platforms/platformMessage'
import { AppStoreClass } from '@shared/stores/appStore'
import { storeProvider } from '.'
import { AppDataStoreClass } from '@shared/stores/appDataStore'

export class PlatformStore implements PlatformStoreClass {
  private platforms: Map<string, PlatformInterface> = new Map()
  private clientPlatformMap: Map<string, string> = new Map() // Maps clientId to platformId
  private listeners: { [key in PlatformStoreEvent]: PlatformStoreListener<key>[] } = {
    [PlatformStoreEvent.PLATFORM_ADDED]: [],
    [PlatformStoreEvent.PLATFORM_REMOVED]: [],
    [PlatformStoreEvent.PLATFORM_STARTED]: [],
    [PlatformStoreEvent.PLATFORM_STOPPED]: [],
    [PlatformStoreEvent.CLIENT_CONNECTED]: [],
    [PlatformStoreEvent.CLIENT_DISCONNECTED]: [],
    [PlatformStoreEvent.DATA_RECEIVED]: []
  }
  private appStore: AppStoreClass
  private appDataStore: AppDataStoreClass

  constructor(appStore: AppStoreClass, appDataStore: AppDataStoreClass) {
    this.appStore = appStore
    this.appDataStore = appDataStore
    this.setupAppStoreListeners()
  }

  private setupAppStoreListeners(): void {
    this.appStore.onAppMessage(SEND_TYPES.SEND, (AppData) => {
      this.broadcastToClients({ app: AppData.source, ...AppData.payload })
    })

    this.appStore.on('apps', (apps) => {
      const filteredApps = apps.data.filter((app) => app.manifest?.isWebApp !== false)
      this.broadcastToClients({
        app: 'client',
        type: 'apps',
        payload: filteredApps
      })
    })

    this.appDataStore.on('settings', (settings) => {
      this.broadcastToClients({
        app: 'client',
        type: 'settings',
        payload: settings
      })
    })
  }
  /**
   * Adds a listener for a specific event
   * @param event
   * @param listener
   * @returns A function to remove the listener
   */
  public on = <T extends PlatformStoreEvent>(
    event: T,
    listener: PlatformStoreListener<T>
  ): (() => void) => {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(listener)
    return () => {
      this.listeners[event] = this.listeners[event].filter((l) => l !== listener) as []
    }
  }

  /**
   * Removes a listener
   * @param event
   * @param listener
   * @returns
   */
  public off = <T extends PlatformStoreEvent>(
    event: T,
    listener: PlatformStoreListener<T>
  ): void => {
    if (!this.listeners[event]) {
      return
    }
    this.listeners[event] = this.listeners[event].filter((l) => l !== listener) as []
  }

  private notify<T extends PlatformStoreEvent>(event: T, payload: PlatformStoreEvents[T]): void {
    if (!this.listeners[event]) {
      return
    }
    this.listeners[event].forEach((listener) => {
      listener(payload)
    })
  }

  // Platform management
  async addPlatform(platform: PlatformInterface): Promise<void> {
    if (this.platforms.has(platform.id)) {
      throw new Error(`Platform with ID ${platform.id} already exists`)
    }

    this.platforms.set(platform.id, platform)
    this.setupPlatformListeners(platform)
    this.notify(PlatformStoreEvent.PLATFORM_ADDED, platform)

    Logger.info(`Platform ${platform.name} (${platform.type}) added`, {
      domain: 'platform',
      source: 'platformStore',
      function: 'addPlatform'
    })
  }

  async removePlatform(platformId: string): Promise<boolean> {
    const platform = this.platforms.get(platformId)
    if (!platform) {
      return false
    }

    // Stop platform if running
    if (platform.isRunning()) {
      await platform.stop()
    }

    // Clean up listeners
    platform.removeAllListeners()

    // Remove all clients associated with this platform
    this.getClientsByPlatform(platformId).forEach((client) => {
      this.clientPlatformMap.delete(client.connectionId)
    })

    this.platforms.delete(platformId)
    this.notify(PlatformStoreEvent.PLATFORM_REMOVED, platformId)

    Logger.info(`Platform ${platform.name} (${platform.type}) removed`, {
      domain: 'platform',
      source: 'platformStore',
      function: 'removePlatform'
    })

    return true
  }

  getPlatform(platformId: string): PlatformInterface | undefined {
    return this.platforms.get(platformId)
  }

  getPlatformByType(type: string): PlatformInterface | undefined {
    return Array.from(this.platforms.values()).find((p) => p.type === type)
  }

  getAllPlatforms(): PlatformInterface[] {
    return Array.from(this.platforms.values())
  }

  async startPlatform(platformId: string, options?: PlatformConnectionOptions): Promise<boolean> {
    const platform = this.platforms.get(platformId)
    if (!platform) {
      return false
    }

    try {
      await platform.start(options)
      this.notify(PlatformStoreEvent.PLATFORM_STARTED, platform)

      Logger.info(`Platform ${platform.name} (${platform.type}) started`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'startPlatform'
      })

      return true
    } catch (error) {
      Logger.error(`Error starting platform ${platform.name}`, {
        error: error as Error,
        domain: 'platform',
        source: 'platformStore',
        function: 'startPlatform'
      })
      return false
    }
  }

  async stopPlatform(platformId: string): Promise<boolean> {
    const platform = this.platforms.get(platformId)
    if (!platform) {
      return false
    }

    try {
      await platform.stop()
      this.notify(PlatformStoreEvent.PLATFORM_STOPPED, platform)

      Logger.info(`Platform ${platform.name} (${platform.type}) stopped`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'stopPlatform'
      })

      return true
    } catch (error) {
      Logger.error(`Error stopping platform ${platform.name}`, {
        error: error as Error,
        domain: 'platform',
        source: 'platformStore',
        function: 'stopPlatform'
      })
      return false
    }
  }

  async restartPlatform(platformId: string, options?: PlatformConnectionOptions): Promise<boolean> {
    await this.stopPlatform(platformId)
    return await this.startPlatform(platformId, options)
  }

  // Client management
  getClients(): Client[] {
    const allClients: Client[] = []
    this.platforms.forEach((platform) => {
      allClients.push(...platform.getClients())
    })
    return allClients
  }

  getClientById(clientId: string): Client | undefined {
    const platformId = this.clientPlatformMap.get(clientId)
    if (!platformId) {
      return undefined
    }

    const platform = this.platforms.get(platformId)
    return platform?.getClientById(clientId)
  }

  getClientsByPlatform(platformId: string): Client[] {
    const platform = this.platforms.get(platformId)
    return platform ? platform.getClients() : []
  }

  getPlatformForClient(clientId: string): PlatformInterface | undefined {
    const platformId = this.clientPlatformMap.get(clientId)
    if (!platformId) {
      return undefined
    }
    return this.platforms.get(platformId)
  }

  // Data handling
  async handleSocketData(client: Client, data: SocketData): Promise<void> {
    // TODO: Fully implement this
    const platform = this.getPlatformForClient(client.id)
    if (!platform) {
      Logger.warn(`No platform found for client ${client.id}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'handleSocketData'
      })
      return
    }

    handlePlatformMessage(platform, client, data)

    // Data is already received at this point, just relay it to listeners
    this.notify(PlatformStoreEvent.DATA_RECEIVED, { client, data })
  }

  async sendDataToClient(clientId: string, data: SocketData): Promise<boolean> {
    console.log('Sending data to', clientId, data)
    const platform = this.getPlatformForClient(clientId)
    if (!platform) {
      Logger.warn(`Cannot send data: No platform found for client ${clientId}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'sendDataToClient'
      })
      return false
    }

    try {
      return await platform.sendData(clientId, data)
    } catch (error) {
      Logger.error(`Error sending data to client ${clientId}`, {
        error: error as Error,
        domain: 'platform',
        source: 'platformStore',
        function: 'sendDataToClient'
      })
      return false
    }
  }

  async broadcastToClients(data: SocketData): Promise<void> {
    const promises = Array.from(this.platforms.values())
      .filter((platform) => platform.isRunning())
      .map((platform) =>
        platform.broadcastData(data).catch((err) => {
          Logger.error(`Error broadcasting to platform ${platform.id}`, {
            error: err,
            domain: 'platform',
            source: 'platformStore',
            function: 'broadcastToClients'
          })
        })
      )

    await Promise.all(promises)
  }

  // Status information
  getPlatformStatus(): {
    activePlatforms: string[]
    totalClients: number
    platformStatuses: Record<string, PlatformStatus>
  } {
    const platformStatuses: Record<string, PlatformStatus> = {}
    const activePlatforms: string[] = []
    let totalClients = 0

    this.platforms.forEach((platform, id) => {
      const status = platform.getStatus()
      platformStatuses[id] = status

      if (status.isActive) {
        activePlatforms.push(id)
      }

      totalClients += status.clients.length
    })

    return {
      activePlatforms,
      totalClients,
      platformStatuses
    }
  }

  // Private helper methods
  private setupPlatformListeners(platform: PlatformInterface): void {
    // Client connected handler
    platform.on(PlatformEvent.CLIENT_CONNECTED, (client: Client) => {
      this.clientPlatformMap.set(client.connectionId, platform.id)
      this.notify(PlatformStoreEvent.CLIENT_CONNECTED, client)
      this.sendInitialDataToClient(client.connectionId)

      Logger.info(`Client ${client.connectionId} connected via ${platform.type}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'clientConnected'
      })
    })

    // Client disconnected handler
    platform.on(PlatformEvent.CLIENT_DISCONNECTED, (client: Client) => {
      this.clientPlatformMap.delete(client.connectionId)
      this.notify(PlatformStoreEvent.CLIENT_DISCONNECTED, client.id)

      Logger.info(`Client ${client.connectionId} disconnected from ${platform.type}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'clientDisconnected'
      })
    })

    // Data received handler
    platform.on(PlatformEvent.DATA_RECEIVED, ({ client, data }) => {
      this.handleSocketData(client, data)
    })

    // Error handler
    platform.on(PlatformEvent.ERROR, (error: Error) => {
      Logger.error(`Platform ${platform.name} error`, {
        error,
        domain: 'platform',
        source: 'platformStore',
        function: 'platformError'
      })
    })

    // Status changed handler
    platform.on(PlatformEvent.STATUS_CHANGED, (status: PlatformStatus) => {
      Logger.debug(`Platform ${platform.name} status changed`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'statusChanged'
      })
      console.log(`UNIMPLEMENTED: New status of ${platform.name}:`, status)
    })

    // Status changed handler
    platform.on(PlatformEvent.SERVER_STARTED, ({ port, address }) => {
      Logger.debug(`Platform ${platform.name} connected to ${address}:${port}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'statusChanged'
      })
    })
  }

  private async sendConfigToClient(clientId?: string): Promise<void> {
    try {
      const appData = await this.appStore.getAll()
      const filteredAppData = appData.filter((app) => app.manifest?.isWebApp !== false)

      if (clientId) {
        this.sendDataToClient(clientId, {
          app: 'client',
          type: 'config',
          payload: filteredAppData
        })
      } else {
        this.broadcastToClients({
          app: 'client',
          type: 'config',
          payload: filteredAppData
        })
      }

      Logger.info(`Config data sent ${clientId ? `to client ${clientId}` : 'to all clients'}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'sendConfigToClient'
      })
    } catch (error) {
      Logger.error(
        `Error sending config data ${clientId ? `to client ${clientId}` : 'to all clients'}`,
        {
          error: error as Error,
          domain: 'platform',
          source: 'platformStore',
          function: 'sendConfigToClient'
        }
      )
    }
  }

  private async sendSettingsToClient(clientId?: string, settings?: AppSettings): Promise<void> {
    try {
      const appData = await this.appStore.getAll()
      const appDataStore = storeProvider.getStore('appDataStore')
      const mergedSettings = {}

      if (appData) {
        await Promise.all(
          appData.map(async (app) => {
            if (app) {
              const appSettings = settings || (await appDataStore.getSettings(app.name))
              if (appSettings) {
                mergedSettings[app.name] = appSettings
              }
            }
          })
        )
      }

      if (clientId) {
        this.sendDataToClient(clientId, {
          app: 'client',
          type: 'settings',
          payload: mergedSettings
        })
      } else {
        this.broadcastToClients({
          app: 'client',
          type: 'settings',
          payload: mergedSettings
        })
      }

      Logger.info(`Settings data sent ${clientId ? `to client ${clientId}` : 'to all clients'}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'sendSettingsToClient'
      })
    } catch (error) {
      Logger.error(
        `Error sending settings data ${clientId ? `to client ${clientId}` : 'to all clients'}`,
        {
          error: error as Error,
          domain: 'platform',
          source: 'platformStore',
          function: 'sendSettingsToClient'
        }
      )
    }
  }

  private async sendMappingsToClient(clientId?: string): Promise<void> {
    try {
      const mappingStore = storeProvider.getStore('mappingStore')
      const mappings = await mappingStore.getMapping()
      const actions = await mappingStore.getActions()

      if (mappings) {
        const combinedActions = {
          ...mappings,
          actions: actions
        }

        if (clientId) {
          this.sendDataToClient(clientId, {
            app: 'client',
            type: 'button_mappings',
            payload: combinedActions
          })
        } else {
          this.broadcastToClients({
            app: 'client',
            type: 'button_mappings',
            payload: combinedActions
          })
        }
      }

      Logger.info(`Mappings data sent ${clientId ? `to client ${clientId}` : 'to all clients'}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'sendMappingsToClient'
      })
    } catch (error) {
      Logger.error(
        `Error sending mappings data ${clientId ? `to client ${clientId}` : 'to all clients'}`,
        {
          error: error as Error,
          domain: 'platform',
          source: 'platformStore',
          function: 'sendMappingsToClient'
        }
      )
    }
  }

  private async sendTimeToClient(clientId?: string): Promise<void> {
    try {
      const now = new Date()
      if (!clientId) {
        this.broadcastToClients({
          app: 'client',
          type: 'set',
          request: 'time',
          payload: {
            utcTime: Date.now(),
            timezoneOffset: now.getTimezoneOffset() * -1
          }
        })
      } else {
        this.sendDataToClient(clientId, {
          app: 'client',
          type: 'set',
          request: 'time',
          payload: {
            utcTime: Date.now(),
            timezoneOffset: now.getTimezoneOffset() * -1
          }
        })
      }

      Logger.info(`Time data sent ${clientId ? `to client ${clientId}` : 'to all clients'}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'sendTimeToClient'
      })
    } catch (error) {
      Logger.error(
        `Error sending time data ${clientId ? `to client ${clientId}` : 'to all clients'}`,
        {
          error: error as Error,
          domain: 'platform',
          source: 'platformStore',
          function: 'sendTimeToClient'
        }
      )
    }
  }

  private async sendInitialDataToClient(clientId?: string): Promise<void> {
    await this.sendConfigToClient(clientId)
    await this.sendSettingsToClient(clientId)
    await this.sendMappingsToClient(clientId)
    await this.sendTimeToClient(clientId)
  }
}
