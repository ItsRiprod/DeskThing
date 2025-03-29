import {
  PlatformInterface,
  PlatformEvent,
  PlatformConnectionOptions,
  PlatformStatus
} from '@shared/interfaces/platformInterface'
import {
  AppSettings,
  MappingProfile,
  DeviceToDeskthingData,
  Client,
  APP_REQUESTS,
  DESKTHING_EVENTS,
  DESKTHING_DEVICE,
  DeskThingToDeviceCore
} from '@DeskThing/types'
import Logger from '@server/utils/logger'
import {
  PlatformIDs,
  PlatformStoreClass,
  PlatformStoreEvent,
  PlatformStoreEvents
} from '@shared/stores/platformStore'
import { handlePlatformMessage } from '@server/stores/platforms/platformMessage'
import { AppStoreClass } from '@shared/stores/appStore'
import { storeProvider } from './storeProvider'
import { AppDataStoreClass } from '@shared/stores/appDataStore'
import { isValidAppSettings } from '@server/services/apps/appValidator'
import { MappingStoreClass } from '@shared/stores/mappingStore'

import EventEmitter from 'node:events'
import { ExtractPayloadFromIPC, PlatformIPC } from '@shared/types/ipc/ipcPlatform'

export class PlatformStore extends EventEmitter<PlatformStoreEvents> implements PlatformStoreClass {
  private platforms: Map<PlatformIDs, PlatformInterface> = new Map()
  private clientPlatformMap: Map<string, PlatformIDs> = new Map()

  private appStore: AppStoreClass
  private appDataStore: AppDataStoreClass
  private mappingStore: MappingStoreClass

  private _initialized: boolean = false
  public get initialized(): boolean {
    return this._initialized
  }

  constructor(
    appStore: AppStoreClass,
    appDataStore: AppDataStoreClass,
    mappingStore: MappingStoreClass
  ) {
    super()
    this.appStore = appStore
    this.appDataStore = appDataStore
    this.mappingStore = mappingStore
  }
  async sendPlatformData<T extends PlatformIPC>(data: T): Promise<ExtractPayloadFromIPC<T>> {
    return this.getPlatform(data.platform)?.handlePlatformEvent(data) as ExtractPayloadFromIPC<T>
  }

  async initialize(): Promise<void> {
    if (this._initialized) return
    this._initialized = true
    this.appStore.initialize()
    this.setupListeners()
  }

  private setupListeners(): void {
    this.appStore.onAppMessage(APP_REQUESTS.SEND, (appData) => {
      if (appData.payload.clientId) {
        this.sendDataToClient({
          ...appData.payload,
          clientId: appData.payload.clientId
        } as DeskThingToDeviceCore & { clientId: string })
      } else {
        this.broadcastToClients({
          appId: appData.source,
          ...appData.payload
        } as DeskThingToDeviceCore)
      }
    })

    this.appStore.on('apps', (apps) => {
      const filteredApps = apps.data.filter((app) => app.manifest?.isWebApp !== false)
      this.broadcastToClients({
        app: 'client',
        type: DESKTHING_DEVICE.APPS,
        payload: filteredApps
      })
    })

    this.appStore.onAppMessage(
      APP_REQUESTS.GET,
      (data) => {
        if (data.request != 'connections') return
        Logger.debug(`Handling request for all of the connections`, {
          source: 'appCommunication',
          function: 'handleRequestGetConnections',
          domain: data.source
        })
        this.appStore.sendDataToApp(data.source, {
          type: DESKTHING_EVENTS.CLIENT_STATUS,
          request: 'connections',
          payload: this.getClients()
        })
      },
      { request: 'connections' }
    )

    this.appDataStore.on('settings', (settings) => {
      if (!settings?.data) return

      isValidAppSettings(settings.data)
      this.broadcastToClients({
        app: 'client',
        type: DESKTHING_DEVICE.SETTINGS,
        payload: settings.data
      })
    })

    this.mappingStore.addListener('icon', (updates) => {
      if (updates) {
        this.broadcastToClients({
          app: 'client',
          type: DESKTHING_DEVICE.ICON,
          request: 'set',
          payload: updates
        })
      }
    })

    this.on(PlatformStoreEvent.CLIENT_CONNECTED, (client) => {
      this.appStore.broadcastToApps({
        type: DESKTHING_EVENTS.CLIENT_STATUS,
        request: 'connected',
        payload: client
      })
    })

    this.on(PlatformStoreEvent.CLIENT_DISCONNECTED, (clientId) => {
      this.appStore.broadcastToApps({
        type: DESKTHING_EVENTS.CLIENT_STATUS,
        request: 'disconnected',
        payload: clientId
      })
    })
  }

  async registerPlatform(platform: PlatformInterface): Promise<void> {
    if (this.platforms.has(platform.id)) {
      throw new Error(`Platform with ID ${platform.id} already exists`)
    }

    this.platforms.set(platform.id, platform)
    this.setupPlatformListeners(platform)
    this.emit(PlatformStoreEvent.PLATFORM_ADDED, platform)

    Logger.debug(`Platform ${platform.name} (${platform.id}) added`, {
      domain: 'platform',
      source: 'platformStore',
      function: 'addPlatform'
    })
  }

  async removePlatform(platformId: PlatformIDs): Promise<boolean> {
    const platform = this.platforms.get(platformId)
    if (!platform) {
      return false
    }

    if (platform.isRunning()) {
      await platform.stop()
    }

    platform.removeAllListeners()

    this.getClientsByPlatform(platformId).forEach((client) => {
      this.clientPlatformMap.delete(client.connectionId)
    })

    this.platforms.delete(platformId)
    this.emit(PlatformStoreEvent.PLATFORM_REMOVED, platformId)

    Logger.debug(`Platform ${platform.name} (${platform.id}) removed`, {
      domain: 'platform',
      source: 'platformStore',
      function: 'removePlatform'
    })

    return true
  }

  getPlatform(platformId: PlatformIDs): PlatformInterface | undefined {
    return this.platforms.get(platformId)
  }

  getAllPlatforms(): PlatformInterface[] {
    return Array.from(this.platforms.values())
  }

  async startPlatform(
    platformId: PlatformIDs,
    options?: PlatformConnectionOptions
  ): Promise<boolean> {
    const platform = this.platforms.get(platformId)
    if (!platform) {
      return false
    }

    try {
      await platform.start(options)
      this.emit(PlatformStoreEvent.PLATFORM_STARTED, platform)

      Logger.debug(`Platform ${platform.name} (${platform.id}) started`, {
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

  async stopPlatform(platformId: PlatformIDs): Promise<boolean> {
    const platform = this.platforms.get(platformId)
    if (!platform) {
      return false
    }

    try {
      await platform.stop()
      this.emit(PlatformStoreEvent.PLATFORM_STOPPED, platform)

      Logger.debug(`Platform ${platform.name} (${platform.id}) stopped`, {
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

  async restartPlatform(
    platformId: PlatformIDs,
    options?: PlatformConnectionOptions
  ): Promise<boolean> {
    await this.stopPlatform(platformId)
    return await this.startPlatform(platformId, options)
  }

  getClients(): Client[] {
    const clients = this.getAllPlatforms().flatMap((platform) => platform.getClients())
    Logger.debug(`Got ${clients.length} clients`, {
      domain: 'platform',
      source: 'platformStore',
      function: 'getClients'
    })
    return clients
  }

  getClientById(clientId: string): Client | undefined {
    const platformId = this.clientPlatformMap.get(clientId)
    if (platformId) {
      return this.platforms.get(platformId)?.getClientById(clientId)
    }
    return
  }

  getClientsByPlatform(platformId: PlatformIDs): Client[] {
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

  updateClient(clientId: string, client: Partial<Client>): void {
    const platform = this.getPlatformForClient(clientId)
    if (platform) {
      platform.updateClient(clientId, client)
    } else {
      Logger.warn(`No platform found for client ${clientId}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'updateClient'
      })
    }
  }

  async handleSocketData(
    client: Client,
    data: DeviceToDeskthingData & { connectionId: string }
  ): Promise<void> {
    const platform = this.getPlatformForClient(client.id)
    if (!platform) {
      Logger.warn(`No platform found for client ${client.id}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'handleSocketData'
      })
      return
    }

    const logData = { ...data, payload: 'Scrubbed Payload' }

    Logger.debug(`Received data from client ${client.id}: ${JSON.stringify(logData)}`, {
      domain: 'platform',
      source: 'platformStore',
      function: 'handleSocketData'
    })

    handlePlatformMessage(platform, client, data)
    this.emit(PlatformStoreEvent.DATA_RECEIVED, { client, data })
  }

  async sendDataToClient(
    data: DeskThingToDeviceCore & { app?: string; clientId: string }
  ): Promise<boolean> {
    Logger.debug(`Sending data to client ${data.clientId}: ${JSON.stringify(data)}`, {
      domain: 'platform',
      source: 'platformStore',
      function: 'sendDataToClient'
    })

    const platform = this.getPlatformForClient(data.clientId)
    if (!platform) {
      Logger.warn(`Cannot send data: No platform found for client ${data.clientId}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'sendDataToClient'
      })
      return false
    }

    try {
      return await platform.sendData(data.clientId, data)
    } catch (error) {
      Logger.error(`Error sending data to client ${data.clientId}`, {
        error: error as Error,
        domain: 'platform',
        source: 'platformStore',
        function: 'sendDataToClient'
      })
      return false
    }
  }

  async broadcastToClients(
    data: DeskThingToDeviceCore & { app?: string; clientId?: string }
  ): Promise<void> {
    Logger.debug(`Broadcasting data to clients: ${JSON.stringify(data)}`, {
      domain: 'platform',
      source: 'platformStore',
      function: 'broadcastToClients'
    })

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

  getPlatformStatus(): {
    activePlatforms: PlatformIDs[]
    totalClients: number
    platformStatuses: Record<PlatformIDs, PlatformStatus>
  } {
    const platformStatuses = {} as Record<PlatformIDs, PlatformStatus>
    const activePlatforms: PlatformIDs[] = []
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

  private setupPlatformListeners(platform: PlatformInterface): void {
    platform.on(PlatformEvent.CLIENT_CONNECTED, (client: Client) => {
      this.clientPlatformMap.set(client.connectionId, platform.id)
      
      this.emit(PlatformStoreEvent.CLIENT_CONNECTED, client)
      this.sendInitialDataToClient(client.connectionId)

      Logger.debug(`Client ${client.connectionId} connected via ${platform.id}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'clientConnected'
      })

      Logger.debug(`Client details are ${JSON.stringify(client)}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'clientConnected'
      })

    })

    platform.on(PlatformEvent.CLIENT_DISCONNECTED, (client: Client) => {
      this.emit(PlatformStoreEvent.CLIENT_DISCONNECTED, client.id)

      Logger.debug(`Client ${client.connectionId} disconnected from ${platform.id}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'clientDisconnected'
      })

      this.clientPlatformMap.delete(client.connectionId)
    })

    platform.on(PlatformEvent.DATA_RECEIVED, ({ client, data }) => {
      this.handleSocketData(client, data)
    })

    platform.on(PlatformEvent.ERROR, (error: Error) => {
      Logger.error(`Platform ${platform.name} error`, {
        error,
        domain: 'platform',
        source: 'platformStore',
        function: 'platformError'
      })
    })

    platform.on(PlatformEvent.STATUS_CHANGED, (status: PlatformStatus) => {
      Logger.debug(`Platform ${platform.name} status changed`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'statusChanged'
      })
      console.log(`UNIMPLEMENTED: New status of ${platform.name}:`, status)
    })
    platform.on(PlatformEvent.SERVER_STARTED, ({ port, address }) => {
      Logger.debug(`Platform ${platform.name} connected to ${address}:${port}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'statusChanged'
      })
    })

    platform.on(PlatformEvent.CLIENT_UPDATED, (client) => {
      this.emit(PlatformStoreEvent.CLIENT_UPDATED, client)

      Logger.debug(`Client ${client.connectionId} updated via ${platform.id}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'clientUpdated'
      })

      Logger.debug(`Client details are now ${JSON.stringify(client)}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'clientConnected'
      })
    })
  }

  private async sendConfigToClient(clientId?: string): Promise<void> {
    try {
      const appData = await this.appStore.getAll()
      const filteredAppData = appData.filter((app) => app.manifest?.isWebApp !== false)

      if (clientId) {
        this.sendDataToClient({
          app: 'client',
          type: DESKTHING_DEVICE.APPS,
          payload: filteredAppData,
          clientId
        })
      } else {
        this.broadcastToClients({
          app: 'client',
          type: DESKTHING_DEVICE.APPS,
          payload: filteredAppData
        })
      }

      Logger.debug(`Config data sent ${clientId ? `to client ${clientId}` : 'to all clients'}`, {
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
      const mergedSettings: Record<string, AppSettings> = {}

      if (appData) {
        await Promise.all(
          appData.map(async (app) => {
            if (app) {
              const appSettings = settings || (await this.appDataStore.getSettings(app.name))
              if (appSettings) {
                mergedSettings[app.name] = appSettings
              }
            }
          })
        )
      }

      if (clientId) {
        this.sendDataToClient({
          app: 'client',
          type: DESKTHING_DEVICE.GLOBAL_SETTINGS,
          payload: mergedSettings,
          clientId
        })
      } else {
        this.broadcastToClients({
          app: 'client',
          type: DESKTHING_DEVICE.GLOBAL_SETTINGS,
          payload: mergedSettings
        })
      }

      Logger.debug(`Settings data sent ${clientId ? `to client ${clientId}` : 'to all clients'}`, {
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
      const mappingStore = await storeProvider.getStore('mappingStore')
      const mappings = await mappingStore.getMapping()
      const actions = await mappingStore.getActions()

      if (mappings) {
        const combinedActions: MappingProfile = {
          ...mappings,
          actions: actions,
          keys: null,
          profileId: 'default'
        }

        if (clientId) {
          this.sendDataToClient({
            app: 'client',
            type: DESKTHING_DEVICE.MAPPINGS,
            payload: combinedActions,
            clientId
          })
        } else {
          this.broadcastToClients({
            app: 'client',
            type: DESKTHING_DEVICE.MAPPINGS,
            payload: combinedActions
          })
        }
      }

      Logger.debug(`Mappings data sent ${clientId ? `to client ${clientId}` : 'to all clients'}`, {
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
          type: DESKTHING_DEVICE.TIME,
          request: 'set',
          payload: {
            utcTime: Date.now(),
            timezoneOffset: now.getTimezoneOffset() * -1
          }
        })
      } else {
        this.sendDataToClient({
          app: 'client',
          clientId,
          type: DESKTHING_DEVICE.TIME,
          request: 'set',
          payload: {
            utcTime: Date.now(),
            timezoneOffset: now.getTimezoneOffset() * -1
          }
        })
      }

      Logger.debug(`Time data sent ${clientId ? `to client ${clientId}` : 'to all clients'}`, {
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

  private async sendManifestRequest(clientId?: string): Promise<void> {
    if (clientId) {
      this.sendDataToClient({
        app: 'client',
        type: DESKTHING_DEVICE.GET,
        request: 'manifest',
        clientId
      })
    } else {
      this.broadcastToClients({
        app: 'client',
        type: DESKTHING_DEVICE.GET,
        request: 'manifest'
      })
    }
  }

  private async sendConnectionIdToClient(clientId: string): Promise<void> {
    this.sendDataToClient({
      app: 'client',
      type: DESKTHING_DEVICE.META_DATA,
      request: 'set',
      payload: {
        connectionId: clientId
      },
      clientId
    })
  }

  private async sendInitialDataToClient(clientId?: string): Promise<void> {
    await this.sendConfigToClient(clientId)
    await this.sendSettingsToClient(clientId)
    await this.sendMappingsToClient(clientId)
    await this.sendTimeToClient(clientId)
    await this.sendManifestRequest(clientId)
    if (clientId) {
      await this.sendConnectionIdToClient(clientId)
    }
  }
}
