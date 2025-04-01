import { Client, DeskThingToDeviceCore, ClientManifest } from '@deskthing/types'
import {
  PlatformEvents,
  PlatformInterface,
  PlatformStatus,
  PlatformEvent,
  PlatformCapability,
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
  public readonly capabilities: PlatformCapability[] = [
    PlatformCapability.DETECT,
    PlatformCapability.CONFIGURE
  ]

  constructor() {
    super()
    this.adbService = new ADBService()
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
                'Push Staged',
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
                  error instanceof Error ? error.message : 'Unknown error',
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
          `Configuring ${data.adbId}`,
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
        const existingClient = this.clients.find(
          (client) => client.connectionId === adbDevice.adbId
        )

        if (existingClient) {
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
                  mac_bt: macBt
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

          this.updateClient(existingClient.id, updates)
        } else {
          const newClient: Client = {
            id: adbDevice.adbId,
            connectionId: adbDevice.adbId,
            connected: false,
            timestamp: Date.now()
          }

          try {
            const version = await this.adbService.getDeviceManifestVersion(adbDevice.adbId)
            const deviceVersion = await this.adbService.getDeviceVersion(adbDevice.adbId)
            const usid = await this.adbService.getDeviceUSID(adbDevice.adbId)
            const macBt = await this.adbService.getDeviceMacBT(adbDevice.adbId)

            newClient.manifest = {
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
                mac_bt: macBt
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
        }
      }

      progressBus.update(ProgressChannel.REFRESH_DEVICES, 'Cleaning up old devices', 60)

      // Mark clients not found in ADB as disconnected
      this.clients.forEach((client) => {
        if (!adbDevices.find((adb) => adb.adbId === client.connectionId)) {
          this.updateClient(client.id, { connected: false, timestamp: Date.now() })
          this.emit(PlatformEvent.CLIENT_DISCONNECTED, client)
        }
      })
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
    return this.clients.find((client) => client.id === clientId)
  }

  updateClient(clientId: string, clientUpdate: Partial<Client>): void {
    const index = this.clients.findIndex((client) => client.id === clientId)
    if (index !== -1) {
      const updatedClient = { ...this.clients[index], ...clientUpdate }
      this.clients[index] = updatedClient
      this.emit(PlatformEvent.CLIENT_UPDATED, updatedClient)
    }
  }

  async sendData(
    _clientId: string,
    _data: DeskThingToDeviceCore & { app?: string }
  ): Promise<boolean> {
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
