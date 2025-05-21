import {
  Client,
  DeskThingToDeviceCore,
  ClientManifest,
  ProviderCapabilities,
  ConnectionState,
  ClientIdentifier
} from '@deskthing/types'
import {
  PlatformEvents,
  PlatformInterface,
  PlatformStatus,
  PlatformEvent,
  PlatformConnectionOptions
} from '@shared/interfaces/platformInterface'
import EventEmitter from 'node:events'
import { ADBService } from './adbService'
import { storeProvider } from '@server/stores/storeProvider'
import logger from '@server/utils/logger'
import { PlatformIDs } from '@shared/stores/platformStore'
import { PlatformIPC } from '@shared/types/ipc/ipcPlatform'
import { app } from 'electron'
import { join } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import { progressBus } from '@server/services/events/progressBus'
import { ProgressChannel } from '@shared/types'
import { handleError } from '@server/utils/errorHandler'

export class ADBPlatform extends EventEmitter<PlatformEvents> implements PlatformInterface {
  private adbService: ADBService
  private isActive: boolean = false
  private startTime: number = 0
  private clients: Client[] = []
  private initialized: boolean = false
  private intervalId: NodeJS.Timeout | null = null
  private adbPort: number = 8891

  public readonly id: PlatformIDs = PlatformIDs.ADB
  public readonly name: string = 'ADB'

  readonly identifier: Omit<ClientIdentifier, 'id' | 'active'> = {
    providerId: PlatformIDs.ADB,
    capabilities: [ProviderCapabilities.CONFIGURE, ProviderCapabilities.PING]
  }

  constructor() {
    super()
    this.adbService = new ADBService()
  }

  fetchClients = async (): Promise<Client[]> => {
    this.refreshClients()
    return this.clients
  }

  private getInternalId(clientId: string): string | undefined {
    // Early quick lookup if the client hasn't been changed or taken
    if (this.clients[clientId]) {
      return clientId
    }

    const client = this.clients.find(
      (c) => c.clientId === clientId || c.identifiers[this.id]?.id === clientId
    )
    return client?.identifiers[this.id]?.id
  }

  public handlePlatformEvent = async <T extends PlatformIPC>(data: T): Promise<T['data']> => {
    if (data.platform !== PlatformIDs.ADB) return undefined

    switch (data.type) {
      case 'get':
        switch (data.request) {
          case 'manifest': {
            const manifest = await this.adbService.getDeviceManifest(data.adbId)
            return manifest
          }
          default:
            break
        }
        break
      case 'set': {
        switch (data.request) {
          case 'manifest': {
            await this.updateClientManifest(data.manifest)
            break
          }
          case 'supervisor': {
            await this.adbService.toggleSupervisorService(data.adbId, data.service, data.state)
            await this.refreshClient(data.adbId, true)
            return true
          }
          default:
            break
        }
        break
      }
      case 'push':
        {
          switch (data.request) {
            case 'staged':
              progressBus.startOperation(
                ProgressChannel.PLATFORM_CHANNEL,
                'Push Staged Client',
                'Initializing push',
                [
                  {
                    channel: ProgressChannel.CONFIGURE_DEVICE,
                    weight: 100
                  }
                ]
              )
              try {
                await this.pushStagedClient(data.adbId, this.adbPort)
                progressBus.complete(ProgressChannel.PLATFORM_CHANNEL, 'Push complete')
              } catch (error) {
                progressBus.error(
                  ProgressChannel.PLATFORM_CHANNEL,
                  'Error pushing staged client',
                  handleError(error),
                  'ADB Error'
                )
              }
              return
          }
        }
        break
      case 'refresh': {
        progressBus.startOperation(
          ProgressChannel.PLATFORM_CHANNEL,
          'Refreshing Devices',
          'Initializing refresh',
          [
            {
              channel: ProgressChannel.REFRESH_DEVICES,
              weight: 100
            }
          ]
        )
        await this.refreshDevices()
        const clients = await this.getClients()
        progressBus.complete(ProgressChannel.PLATFORM_CHANNEL, 'Refresh complete')
        return clients
      }
      case 'run': {
        progressBus.startOperation(
          ProgressChannel.PLATFORM_CHANNEL,
          'Running ADB command',
          `Running ${data.command}`,
          [
            {
              channel: ProgressChannel.ADB,
              weight: 100
            }
          ]
        )

        const response = await this.adbService.sendCommand(data.command, data.adbId)

        progressBus.complete(
          ProgressChannel.PLATFORM_CHANNEL,
          `Got response ${response.substring(0, 15)}...`,
          'Successfully Ran Command'
        )
        return response
      }

      case 'configure': {
        progressBus.startOperation(
          ProgressChannel.PLATFORM_CHANNEL,
          `Configuring Device`,
          `Configuring ${data.adbId || 'unknown device'}`,
          [
            {
              channel: ProgressChannel.CONFIGURE_DEVICE,
              weight: 100
            }
          ]
        )

        await this.adbService.configureDevice(data.adbId, this.adbPort)

        progressBus.complete(ProgressChannel.PLATFORM_CHANNEL, 'Completed Operation')
      }
    }

    return undefined
  }

  private async updateClientManifest(manifest: Partial<ClientManifest>): Promise<void> {
    const userDataPath = app.getPath('userData')
    const manifestPath = join(userDataPath, 'webapp', 'manifest.json')

    try {
      const existingManifest = await readFile(manifestPath, 'utf8')
      const parsedManifest = JSON.parse(existingManifest)
      const updatedManifest = { ...parsedManifest, ...manifest }
      await writeFile(manifestPath, JSON.stringify(updatedManifest), 'utf8')
    } catch (error) {
      logger.error('Error updating client manifest:', {
        function: 'updateClientManifest',
        source: 'adbPlatform',
        error: error as Error
      })
    }
  }

  async start(options: PlatformConnectionOptions): Promise<void> {
    if (this.isActive) return
    this.adbPort = options.port ?? this.adbPort
    this.isActive = true
    this.startTime = Date.now()
    await this.refreshDevices()

    if (!this.initialized) {
      await this.initialize()
    }
  }

  private async initialize(): Promise<void> {
    const settingStore = await storeProvider.getStore('settingsStore')
    const settings = await settingStore.getSettings()
    this.restartInterval(settings?.autoDetectADB)
    settingStore.addListener((settings) => {
      this.restartInterval(settings?.autoDetectADB)
    })
  }

  private restartInterval(autoDetect?: boolean): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }

    logger.debug(`Auto detect is ${autoDetect}`, {
      domain: 'adbPlatform',
      function: 'restartInterval'
    })

    if (!autoDetect) {
      this.intervalId = null
      return
    }

    this.intervalId = setInterval(async () => {
      await this.refreshDevices()
    }, 5000)
  }

  private async refreshDevices(): Promise<void> {
    try {
      progressBus.start(
        ProgressChannel.REFRESH_DEVICES,
        'Refreshing Devices',
        'Initializing refresh'
      )
      progressBus.update(ProgressChannel.REFRESH_DEVICES, 'Getting Devices', 10)
      const adbDevices = await this.adbService.getDevices()
      progressBus.update(ProgressChannel.REFRESH_DEVICES, `Found ${adbDevices.length} devices`, 30)

      for (const adbDevice of adbDevices) {
        await this.refreshClient(adbDevice.adbId)
      }

      progressBus.update(ProgressChannel.REFRESH_DEVICES, 'Cleaning up old devices', 60)

      // Mark clients not found in ADB as disconnected
      this.clients.forEach((client) => {
        if (!adbDevices.find((adb) => adb.adbId === client.identifiers[this.id]?.id)) {
          this.emit(PlatformEvent.CLIENT_DISCONNECTED, client)
        }
      })

      // ensure the local list of clients is up to date
      this.clients = this.clients.filter((client) => {
        return adbDevices.find((adb) => adb.adbId === client.identifiers[this.id]?.id)
      })

      this.emit(PlatformEvent.CLIENT_LIST, this.clients)
      progressBus.complete(ProgressChannel.REFRESH_DEVICES, 'Refresh complete')
    } catch (error) {
      progressBus.error(ProgressChannel.REFRESH_DEVICES, 'Refresh failed', 'Refresh failed')
      logger.error(`Failed to refresh devices`, {
        error: error as Error,
        function: 'refreshDevices',
        source: 'adbPlatform'
      })
    }
  }

  async refreshClient(adbId: string, forceRefresh = false): Promise<Client | undefined> {
    const adbDevice = (await this.adbService.getDevices()).find((device) => device.adbId === adbId)
    if (!adbDevice) return

    const existingClient = this.clients.find(
      (client) => client.identifiers[this.id]?.id === adbDevice.adbId
    )

    if (existingClient && !forceRefresh) {
      const updates: Partial<Client> = {
        connected: !adbDevice.offline,
        timestamp: Date.now()
      }

      if (!existingClient.manifest) {
        try {
          progressBus.update(
            ProgressChannel.REFRESH_DEVICES,
            `Getting manifest for ${adbDevice.adbId}`
          )
          const version = await this.adbService.getDeviceManifestVersion(adbDevice.adbId)
          const deviceVersion = await this.adbService.getDeviceVersion(adbDevice.adbId)
          const usid = await this.adbService.getDeviceUSID(adbDevice.adbId)
          const macBt = await this.adbService.getDeviceMacBT(adbDevice.adbId)
          const services = await this.adbService.getSupervisorStatus(adbDevice.adbId)

          const transformedServices: Record<string, boolean> = Object.entries(services).reduce(
            (acc, [key, val]) => {
              return {
                ...acc,
                [key]: val === 'RUNNING'
              }
            },
            {}
          )

          const manifest: ClientManifest = {
            id: adbDevice.adbId,
            name: 'Superbird Device',
            short_name: 'Superbird',
            description: 'Spotify Car Thing Device',
            reactive: true,
            repository: '',
            author: 'Spotify',
            version: version,
            compatibility: {
              server: '>=0.0.0',
              app: '>=0.0.0'
            },
            context: {
              ...adbDevice,
              app_version: deviceVersion,
              usid,
              mac_bt: macBt,
              services: transformedServices
            }
          }
          updates.manifest = manifest
        } catch (error) {
          logger.warn(`Failed to get manifest for device ${adbDevice.adbId}`, {
            error: error as Error,
            function: 'refreshDevices',
            source: 'adbPlatform'
          })
          // Continue without manifest updates if device is unreachable
        }
      }

      return await this.updateClient(existingClient.identifiers[this.id].id, updates)
    } else {
      const newClient: Client = {
        clientId: adbDevice.adbId,
        connectionState: ConnectionState.Established, // not actually connected
        identifiers: {
          [this.id]: {
            id: adbDevice.adbId,
            active: true,
            providerId: this.id,
            capabilities: this.identifier.capabilities
          }
        },
        connected: false,
        timestamp: Date.now()
      }

      try {
        const manifest = await this.adbService.getDeviceManifest(adbDevice.adbId)

        if (manifest) {
          const deviceVersion = await this.adbService.getDeviceVersion(adbDevice.adbId)
          const usid = await this.adbService.getDeviceUSID(adbDevice.adbId)
          const macBt = await this.adbService.getDeviceMacBT(adbDevice.adbId)
          const services = await this.adbService.getSupervisorStatus(adbDevice.adbId)

          const transformedServices: Record<string, boolean> = Object.entries(services).reduce(
            (acc, [key, val]) => {
              return {
                ...acc,
                [key]: val === 'RUNNING'
              }
            },
            {}
          )
          newClient.manifest = {
            ...manifest,
            context: {
              ...adbDevice,
              app_version: deviceVersion,
              usid,
              mac_bt: macBt,
              services: transformedServices
            }
          }
        }
      } catch (error) {
        logger.warn(`Failed to get manifest for device ${adbDevice.adbId}`, {
          error: error as Error,
          function: 'refreshDevices',
          source: 'adbPlatform'
        })
      }

      progressBus.update(
        ProgressChannel.REFRESH_DEVICES,
        `Getting version for ${adbDevice.adbId}`,
        50
      )

      this.clients.push(newClient)
      this.emit(PlatformEvent.CLIENT_CONNECTED, newClient)
      return newClient
    }
  }
  private pushStagedClient(clientId: string, port: number): Promise<void> {
    return this.adbService.configureDevice(clientId, port, true)
  }

  async stop(): Promise<void> {
    if (!this.isActive) return
    this.isActive = false
    this.clients = []
  }

  isRunning(): boolean {
    return this.isActive
  }

  getClients(): Client[] {
    return this.clients
  }

  getClientById(clientId: string): Client | undefined {
    const internalId = this.getInternalId(clientId)
    return this.clients.find((client) => client.identifiers[this.id]?.id === internalId)
  }

  async updateClient(
    clientId: string,
    newClient: Partial<Client>,
    notify = true
  ): Promise<Client | undefined> {
    try {
      const internalId = this.getInternalId(clientId)
      const index = this.clients.findIndex(
        (client) => client.identifiers[this.id]?.id === internalId
      )
      if (index === -1) {
        console.error(`Unable to find the client for id ${clientId}`)
        return undefined
      }

      const client = this.clients[index]
      const updatedClient = { ...client, ...newClient } as Client

      if (Object.values(updatedClient.identifiers).length > 0) {
        const providers = Object.values(updatedClient.identifiers).filter((id) => id.active)
        const primaryProvider = providers.sort(
          (a, b) => (b.capabilities?.length || 0) - (a.capabilities?.length || 0)
        )[0]

        if (primaryProvider) {
          updatedClient.connected = true
          updatedClient.primaryProviderId = primaryProvider.providerId
          updatedClient.timestamp = Date.now()
        } else {
          updatedClient.connected = false
          delete updatedClient.primaryProviderId
        }
      } else {
        updatedClient.connected = false
        delete updatedClient.primaryProviderId
      }

      this.clients[index] = updatedClient
      if (notify) this.emit(PlatformEvent.CLIENT_UPDATED, updatedClient)
      return updatedClient
    } catch (error) {
      console.error('Error updating client:', error)
      this.emit(
        PlatformEvent.ERROR,
        error instanceof Error
          ? error
          : new Error('Unknown error occurred updating client: ' + handleError(error), { cause: error })
      )
    }
    return undefined
  }

  async refreshClients(): Promise<boolean> {
    await this.refreshDevices()
    return true
  }

  async sendData(
    clientId: string,
    _data: DeskThingToDeviceCore & { app?: string }
  ): Promise<boolean> {
    const internalId = this.getInternalId(clientId)
    logger.warn('Unable to send data via ADB! Failed.')
    if (!internalId) return false
    return false
  }

  async broadcastData(_data: DeskThingToDeviceCore & { app?: string }): Promise<void> {
    return
  }

  getStatus(): PlatformStatus {
    return {
      isActive: this.isActive,
      clients: this.clients,
      uptime: this.isActive ? Date.now() - this.startTime : 0
    }
  }
}
