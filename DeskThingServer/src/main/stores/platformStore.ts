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
  DeskThingToDeviceCore,
  ConnectionState,
  TagTypes
} from '@deskthing/types'
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
import { progressBus } from '@server/services/events/progressBus'
import { ProgressChannel } from '@shared/types'
import { ClientIdentificationService } from '@server/services/clients/clientIdentificationService'

export class PlatformStore extends EventEmitter<PlatformStoreEvents> implements PlatformStoreClass {
  private platforms: Map<PlatformIDs, PlatformInterface> = new Map()
  private clientPlatformMap: Map<string, Set<PlatformIDs>> = new Map()

  private appStore: AppStoreClass
  private appDataStore: AppDataStoreClass
  private mappingStore: MappingStoreClass

  private clientRegistry: Map<string, Client> = new Map()

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
          app: appData.source,
          appId: appData.source,
          ...appData.payload
        } as DeskThingToDeviceCore)
      }
    })

    this.appStore.on('apps', (apps) => {
      const filteredApps = apps.data.filter(
        (app) => !app.manifest?.tags.includes(TagTypes.UTILITY_ONLY)
      )
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

  private addClientPlatformMapping(clientId: string, platformId: PlatformIDs): void {
    if (!this.clientPlatformMap.has(clientId)) {
      this.clientPlatformMap.set(clientId, new Set())
    }
    this.clientPlatformMap.get(clientId)!.add(platformId)
  }

  private removeClientPlatformMapping(clientId: string, platformId: PlatformIDs): void {
    const platforms = this.clientPlatformMap.get(clientId)
    if (platforms) {
      platforms.delete(platformId)
      if (platforms.size === 0) {
        this.clientPlatformMap.delete(clientId)
      }
    }
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
      this.handleClientDisconnected(client.clientId, platformId)
      this.removeClientPlatformMapping(client.clientId, platformId)
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
    return Array.from(this.clientRegistry.values())
  }

  async fetchClients(): Promise<Client[]> {
    const clients = await Promise.all(
      Array.from(this.platforms.values()).map(async (platform) => await platform.fetchClients())
    ).then((clientArrays) => clientArrays.flat())

    const uniqueClients = Array.from(
      new Map(clients.map((client) => [client.clientId, client])).values()
    )

    Logger.debug(`Fetched ${uniqueClients.length} clients`, {
      domain: 'platformStore',
      function: 'fetchClients'
    })

    this.emit(PlatformStoreEvent.CLIENT_LIST, uniqueClients)

    return uniqueClients
  }

  async refreshClients(): Promise<boolean> {
    progressBus.startOperation(
      ProgressChannel.PLATFORM_CHANNEL,
      'Refreshing Devices...',
      'Sending updates'
    )
    const platforms = this.getAllPlatforms()
    const incrementAmount = 100 / platforms.length
    let success: boolean = true
    for (const platform of platforms) {
      const platformSuccess = await platform.refreshClients()
      if (!platformSuccess) {
        success = false
      }
      progressBus.incrementProgress(
        ProgressChannel.PLATFORM_CHANNEL,
        `Refreshed ${platform.name}`,
        incrementAmount
      )
    }

    progressBus.complete(
      ProgressChannel.PLATFORM_CHANNEL,
      'Refreshed Devices',
      'Finished refreshing devices'
    )

    return success
  }

  getClientById(clientId: string): Client | undefined {
    // First try direct lookup
    const client = this.clientRegistry.get(clientId)
    if (client) return client

    // If not found, check if it's an identifier in any client
    for (const registeredClient of this.clientRegistry.values()) {
      for (const identifier of Object.values(registeredClient.identifiers)) {
        if (identifier.id === clientId) {
          return registeredClient
        }
      }
    }

    Logger.warn(`Client ${clientId} not found`, {
      domain: 'platform',
      source: 'platformStore',
      function: 'getClientById'
    })

    return undefined
  }

  getClientsByPlatform(platformId: PlatformIDs): Client[] {
    return Array.from(this.clientRegistry.values()).filter(
      (client) => client.identifiers[platformId] && client.identifiers[platformId].active
    )
  }

  getPlatformForClient(clientId: string): PlatformInterface | undefined {
    const client = this.getClientById(clientId)
    if (client && client.primaryProviderId) {
      return this.platforms.get(client.primaryProviderId as PlatformIDs)
    }

    const platforms = this.clientPlatformMap.get(clientId)
    if (platforms && platforms.size > 0) {
      // Return the first available platform
      for (const platformId of platforms) {
        const platform = this.platforms.get(platformId)
        if (platform) return platform
      }
    }

    return undefined
  }

  async updateClient(
    clientId: string,
    clientUpdates: Partial<Client>
  ): Promise<Client | undefined> {
    // First, find the client in our registry
    const existingClient = this.getClientById(clientId)

    if (!existingClient) {
      Logger.warn(`Cannot update: Client ${clientId} not found in registry`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'updateClient'
      })
      return
    }

    const platform = this.getPlatformForClient(clientId)

    if (!platform) {
      Logger.warn(`No platform found for client ${clientId}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'updateClient'
      })
      return
    }
    // Update the client in the platform
    platform.updateClient(clientId, clientUpdates)

    // Also update our registry with the merged data
    const updatedClient = { ...existingClient, ...clientUpdates } as Client

    // If we have identifiers, recalculate the primary provider
    if (Object.values(updatedClient.identifiers).length > 0) {
      const providers = Object.values(updatedClient.identifiers).filter((id) => id.active)
      const primaryProvider = providers.sort(
        (a, b) => (b.capabilities?.length || 0) - (a.capabilities?.length || 0)
      )[0]

      if (primaryProvider) {
        updatedClient.connected = true
        updatedClient.primaryProviderId = primaryProvider.providerId
        updatedClient.timestamp = Date.now()
        updatedClient.connectionState = ConnectionState.Connected
      } else {
        updatedClient.connected = false
        updatedClient.connectionState = ConnectionState.Disconnected
        delete updatedClient.primaryProviderId
      }
    }

    // Update the registry
    this.clientRegistry.set(existingClient.clientId, updatedClient)

    // Notify other platforms about the update
    this.platforms.forEach((p) => {
      if (p.id !== platform.id) {
        // Only update other platforms that have this client
        const platformClient = p.getClientById(clientId)
        if (platformClient) {
          p.updateClient(clientId, updatedClient)
        }
      }
    })

    // Emit the updated client event
    this.emit(PlatformStoreEvent.CLIENT_UPDATED, updatedClient)

    Logger.debug(`Updated client ${clientId}`, {
      domain: 'platform',
      source: 'platformStore',
      function: 'updateClient'
    })

    return updatedClient
  }

  handleClientDisconnected = async (clientId: string, platformId: PlatformIDs): Promise<void> => {
    const client = this.getClientById(clientId)
    if (!client) return

    // Update the client's identifiers to mark this platform as inactive
    if (!client.identifiers[platformId]) {
      Logger.debug(`Client ${clientId} not connected to platform ${platformId}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'handleClientDisconnected'
      })
      return
    }
    client.identifiers[platformId].active = false

    // Recalculate primary provider
    const activeProviders = Object.values(client.identifiers).filter((id) => id.active)

    if (activeProviders.length === 0) {
      // No active providers, mark client as disconnected
      const updatedClient: Client = {
        ...client,
        connected: false,
        connectionState: ConnectionState.Disconnected
      }
      delete updatedClient.primaryProviderId

      // Update registry
      this.clientRegistry.set(client.clientId, updatedClient)

      // Emit disconnected event
      this.emit(PlatformStoreEvent.CLIENT_DISCONNECTED, client.clientId)

      Logger.debug(`Client ${client.clientId} fully disconnected (no active providers)`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'handleClientDisconnected'
      })
    } else {
      // Still has active providers, update primary provider
      const primaryProvider = activeProviders.sort(
        (a, b) => (b.capabilities?.length || 0) - (a.capabilities?.length || 0)
      )[0]

      const platform = this.platforms.get(primaryProvider.providerId as PlatformIDs)
      const updatedState = await platform?.refreshClient(client.clientId, true)

      const updatedClient: Client = {
        ...client,
        connected: updatedState?.connected ?? client.connected,
        connectionState: updatedState?.connectionState ?? client.connectionState,
        primaryProviderId: primaryProvider.providerId,
        timestamp: Date.now()
      }

      // Update registry
      this.clientRegistry.set(client.clientId, updatedClient)

      // Emit updated event
      this.emit(PlatformStoreEvent.CLIENT_UPDATED, updatedClient)

      Logger.debug(
        `Client ${client.clientId} disconnected from ${platformId} but still connected via ${primaryProvider.providerId}`,
        {
          domain: 'platform',
          source: 'platformStore',
          function: 'handleClientDisconnected'
        }
      )
    }
  }

  async handleSocketData(
    client: Extract<Client, { connected: true }>,
    data: DeviceToDeskthingData & { clientId: string }
  ): Promise<void> {
    const registeredClient = this.getClientById(client.clientId)

    if (!registeredClient) {
      Logger.warn(
        `Received data from unregistered client ${client.clientId}. Attempting to register.`,
        {
          domain: 'platform',
          source: 'platformStore',
          function: 'handleSocketData'
        }
      )

      // Try to register the client
      const platform = this.platforms.get(client.primaryProviderId as PlatformIDs)
      if (platform) {
        // Force a refresh of this client
        await platform.refreshClient(client.clientId, true)

        // Check again if client is now registered
        const updatedClient = this.getClientById(client.clientId)
        if (!updatedClient) {
          // If still not registered, we can't process the message
          Logger.error(`Failed to register client ${client.clientId}`, {
            domain: 'platform',
            source: 'platformStore',
            function: 'handleSocketData'
          })
          return
        }

        // Continue with the registered client
        return this.handleSocketData(updatedClient as Extract<Client, { connected: true }>, data)
      } else {
        Logger.error(`No platform found for client ${client.clientId}`, {
          domain: 'platform',
          source: 'platformStore',
          function: 'handleSocketData'
        })
        return
      }
    }

    const platform = this.getPlatformForClient(client.clientId)
    if (!platform) {
      Logger.warn(`No platform found for client ${client.clientId}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'handleSocketData'
      })
      return
    }

    const logData = { ...data, payload: 'Scrubbed Payload' }

    Logger.debug(`Received data from client ${client.clientId}: ${JSON.stringify(logData)}`, {
      domain: 'platform',
      source: 'platformStore',
      function: 'handleSocketData'
    })

    handlePlatformMessage(platform, client, data)
    if (registeredClient && registeredClient.primaryProviderId) {
      this.emit(PlatformStoreEvent.DATA_RECEIVED, {
        client: registeredClient as Extract<Client, { connected: true }>,
        data
      })
    }
  }

  async sendDataToClient(
    data: DeskThingToDeviceCore & { app?: string; clientId: string }
  ): Promise<boolean> {
    const logData = { ...data, payload: 'Scrubbed Payload' }
    Logger.debug(`Sending data to client ${data.clientId}: ${JSON.stringify(logData)}`, {
      domain: 'platform',
      source: 'platformStore',
      function: 'sendDataToClient'
    })

    const client = this.getClientById(data.clientId)
    if (!client) {
      Logger.warn(
        `Cannot send data: Client ${data.clientId} not found or disconnected. Client found? ${client ? 'Yes' : 'No'}`,
        {
          domain: 'platform',
          source: 'platformStore',
          function: 'sendDataToClient'
        }
      )
      return false
    }

    const platform = this.getPlatformForClient(client.clientId)
    if (!platform) {
      Logger.warn(`Cannot send data: No platform found for client ${data.clientId}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'sendDataToClient'
      })
      return false
    }

    try {
      return await platform.sendData(client.clientId, data)
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
    this.platforms.forEach((platform, id) => {
      const status = platform.getStatus()
      platformStatuses[id] = status

      if (status.isActive) {
        activePlatforms.push(id)
      }
    })

    return {
      activePlatforms,
      totalClients: this.clientRegistry.size,
      platformStatuses
    }
  }

  private setupPlatformListeners(platform: PlatformInterface): void {
    // Connection
    platform.on(PlatformEvent.CLIENT_CONNECTED, (client: Client) => {
      this.handleClientUpdate(platform, client)

      Logger.debug(`Client ${client.clientId} connected via ${platform.id}`, {
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

    // Disconnection
    platform.on(PlatformEvent.CLIENT_DISCONNECTED, (client: Client) => {
      this.handleClientDisconnected(client.clientId, platform.id)

      Logger.debug(`Client ${client.clientId} disconnected from ${platform.id}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'clientDisconnected'
      })
    })

    // Data received
    platform.on(PlatformEvent.DATA_RECEIVED, ({ client, data }) => {
      this.handleSocketData(client, data)
    })

    // Error
    platform.on(PlatformEvent.ERROR, (error: Error) => {
      Logger.error(`Platform ${platform.name} error`, {
        error,
        domain: 'platform',
        source: 'platformStore',
        function: 'platformError'
      })
    })

    // Status changed
    platform.on(PlatformEvent.STATUS_CHANGED, (status: PlatformStatus) => {
      Logger.debug(`Platform ${platform.name} status changed`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'statusChanged'
      })
      console.log(`UNIMPLEMENTED: New status of ${platform.name}:`, status)
    })

    // Server started
    platform.on(PlatformEvent.SERVER_STARTED, ({ port, address }) => {
      Logger.debug(`Platform ${platform.name} connected to ${address}:${port}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'statusChanged'
      })
    })

    // Client Updated
    platform.on(PlatformEvent.CLIENT_UPDATED, (client) => {
      this.handleClientUpdate(platform, client)

      Logger.info(`Client ${client.clientId} updated via ${platform.id}`, {
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

    // Client List
    platform.on(PlatformEvent.CLIENT_LIST, (clients: Client[]) => {
      // Get all clients currently registered for this platform
      const incomingClientIds = new Set(clients.map((client) => client.clientId))

      // Add or update clients from the incoming list
      for (const client of clients) {
        this.handleClientUpdate(platform, client)
      }

      // Handle disconnections for clients not in the list
      for (const [clientId, client] of this.clientRegistry.entries()) {
        if (client.identifiers[platform.id]?.active && !incomingClientIds.has(clientId)) {
          this.handleClientDisconnected(clientId, platform.id)
        }
      }
    })
  }

  private handleClientUpdate(platform: PlatformInterface, client: Client): void {
    // First, check if this client already exists in our registry
    let existingClientId: string | undefined
    let existingClient: Client | undefined

    // Look for matching clients
    for (const [id, registeredClient] of this.clientRegistry.entries()) {
      if (ClientIdentificationService.isSameDevice(client, registeredClient)) {
        existingClientId = id
        existingClient = registeredClient
        break
      }
    }

    if (existingClient && existingClientId) {
      // Client exists - update it

      // Check if the device is now connected
      const wasConnected = existingClient.connected

      // Merge the clients
      const mergedClient = ClientIdentificationService.mergeClients(existingClient, client)

      // Update the registry
      this.clientRegistry.set(existingClientId, mergedClient)

      if (client.clientId !== existingClientId) {
        this.clientRegistry.set(client.clientId, mergedClient)

        for (const platformId in mergedClient.identifiers) {
          const identifier = mergedClient.identifiers[platformId]
          if (identifier.id) {
            this.addClientPlatformMapping(identifier.id, platform.id)
          }
        }
        Logger.debug(
          `Added additional registry entry for ${client.clientId} -> ${existingClientId}`,
          {
            domain: 'platform',
            source: 'platformStore',
            function: 'handleClientUpdate'
          }
        )
      }

      // Update the client-platform mappings for both IDs
      this.addClientPlatformMapping(existingClientId, platform.id)
      if (client.clientId !== existingClientId) {
        this.addClientPlatformMapping(client.clientId, platform.id)
      }

      // Add all identifiers to the platform map for easier lookup
      for (const identifier of Object.values(mergedClient.identifiers)) {
        this.addClientPlatformMapping(identifier.id, platform.id)
      }

      // Notify platforms about the merged client
      this.platforms.forEach((p) => {
        if (p.id !== platform.id) {
          p.updateClient(existingClientId, mergedClient, false)
        }
      })

      // Emit the updated client event
      this.emit(PlatformStoreEvent.CLIENT_UPDATED, mergedClient)

      // If the client wasn't connected before but is now, send initial data
      if (!wasConnected && mergedClient.connected) {
        Logger.debug(`Client ${existingClientId} connected. Sending initial data`, {
          domain: 'platform',
          source: 'platformStore',
          function: 'handleClientUpdate'
        })
        this.sendInitialDataToClient(existingClientId)
      }

      Logger.debug(`Updated client ${client.clientId} (merged with ${existingClientId})`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'handleClientUpdate'
      })
    } else {
      // This is a new client
      const newClient = {
        ...client,
        connectionState: client.connected ? ConnectionState.Connected : ConnectionState.Disconnected
      }

      this.clientRegistry.set(client.clientId, newClient)
      this.addClientPlatformMapping(client.clientId, platform.id)

      // Add all identifiers to the platform map for easier lookup
      for (const identifier of Object.values(newClient.identifiers)) {
        this.addClientPlatformMapping(identifier.id, platform.id)
      }

      // Emit the new client event
      this.emit(PlatformStoreEvent.CLIENT_CONNECTED, newClient)

      if (newClient.connected && newClient.connectionState === ConnectionState.Connected) {
        Logger.debug(`New client ${client.clientId} connected. Sending initial data`, {
          domain: 'platform',
          source: 'platformStore',
          function: 'handleClientUpdate'
        })
        this.sendInitialDataToClient(client.clientId)
      }

      Logger.debug(`New client registered: ${client.clientId}`, {
        domain: 'platform',
        source: 'platformStore',
        function: 'handleClientUpdate'
      })
    }
  }

  private async sendConfigToClient(clientId?: string): Promise<void> {
    try {
      const appData = await this.appStore.getAll()
      const filteredAppData = appData.filter(
        (app) => !app.manifest?.tags.includes(TagTypes.UTILITY_ONLY)
      )

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

  private async sendclientIdToClient(clientId: string): Promise<void> {
    this.sendDataToClient({
      app: 'client',
      type: DESKTHING_DEVICE.META_DATA,
      request: 'set',
      payload: {
        clientId: clientId
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
      await this.sendclientIdToClient(clientId)
    }
  }
}
