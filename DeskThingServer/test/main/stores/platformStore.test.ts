import { describe, expect, it, vi, beforeEach, afterEach, Mock } from 'vitest'
import { PlatformStore } from '../../../src/main/stores/platformStore'
import { AppStoreClass } from '@shared/stores/appStore'
import { AppDataStoreClass } from '@shared/stores/appDataStore'
import { PlatformInterface, PlatformEvent } from '@shared/interfaces/platformInterface'
import {
  Client,
  DeviceToDeskthingData,
  DESKTHING_DEVICE,
  DeskThingToDeviceCore,
  ConnectionState,
  ProviderCapabilities,
  DEVICE_DESKTHING
} from '@deskthing/types'
import Logger from '@server/utils/logger'
import { PlatformIDs, PlatformStoreEvent } from '@shared/stores/platformStore'
import { MappingStoreClass } from '@shared/stores/mappingStore'

vi.mock('@server/utils/logger', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn()
  }
}))

describe('PlatformStore', () => {
  let platformStore: PlatformStore
  let mockAppStore: AppStoreClass
  let mockAppDataStore: AppDataStoreClass
  let mockMappingStore: MappingStoreClass
  let mockPlatform: PlatformInterface
  let testClient: Client

  beforeEach(() => {
    mockAppStore = {
      onAppMessage: vi.fn(),
      on: vi.fn(),
      getAll: vi.fn().mockResolvedValue([]),
      initialize: vi.fn(),
      broadcastToApps: vi.fn(),
      sendDataToApp: vi.fn()
    } as unknown as AppStoreClass

    mockAppDataStore = {
      on: vi.fn(),
      getSettings: vi.fn()
    } as unknown as AppDataStoreClass

    testClient = {
      clientId: 'test-connection',
      connected: true,
      timestamp: Date.now(),
      connectionState: ConnectionState.Connected,
      primaryProviderId: PlatformIDs.ADB,
      identifiers: {
        [PlatformIDs.ADB]: {
          id: 'test-connection',
          providerId: PlatformIDs.ADB,
          active: true,
          capabilities: [ProviderCapabilities.COMMUNICATE]
        }
      }
    } as Client

    mockPlatform = {
      id: PlatformIDs.ADB,
      name: 'Test Platform',
      type: 'test',
      identifier: {
        capabilities: [ProviderCapabilities.COMMUNICATE],
      },
      isRunning: vi.fn().mockReturnValue(true),
      start: vi.fn(),
      stop: vi.fn(),
      getStatus: vi.fn().mockReturnValue({ isActive: true, clients: [testClient] }),
      getClients: vi.fn().mockReturnValue([testClient]),
      getClientById: vi.fn().mockReturnValue(testClient),
      sendData: vi.fn(),
      broadcastData: vi.fn().mockReturnValue(Promise.resolve()),
      on: vi.fn(),
      emit: vi.fn(),
      removeAllListeners: vi.fn(),
      updateClient: vi.fn(),
      handlePlatformEvent: vi.fn(),
      fetchClients: vi.fn().mockResolvedValue([testClient]),
      refreshClients: vi.fn().mockResolvedValue(true),
      refreshClient: vi.fn()
    } as unknown as PlatformInterface

    mockMappingStore = {
      getAction: vi.fn(),
      addAction: vi.fn(),
      on: vi.fn(),
      addListener: vi.fn(),
      removeAllListeners: vi.fn()
    } as unknown as MappingStoreClass

    platformStore = new PlatformStore(mockAppStore, mockAppDataStore, mockMappingStore)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Platform Management', () => {
    it('should handle platform restart', async () => {
      await platformStore.registerPlatform(mockPlatform)
      const result = await platformStore.restartPlatform(PlatformIDs.ADB)

      expect(mockPlatform.stop).toHaveBeenCalled()
      expect(mockPlatform.start).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should handle platform status updates', () => {
      platformStore.registerPlatform(mockPlatform)
      const status = platformStore.getPlatformStatus()

      expect(status.activePlatforms).toContain(PlatformIDs.ADB)
      expect(status.totalClients).toBe(0)
    })
  })

  describe('Client Management', () => {
    it('should handle client updates', async () => {
      await platformStore.registerPlatform(mockPlatform)

      // Simulate client connection through platform event
      const platformEventHandler = mockPlatform.on as Mock
      platformEventHandler.mock.calls.find(
        (call) => call[0] === PlatformEvent.CLIENT_CONNECTED
      )?.[1](testClient)

      const clientUpdate: Partial<Client> = {
        clientId: testClient.clientId,
        connected: true,
        connectionState: ConnectionState.Connected
      }

      await platformStore.updateClient(testClient.clientId, clientUpdate)

      expect(mockPlatform.updateClient).toHaveBeenCalledWith(testClient.clientId, clientUpdate)
    })
    it('should broadcast data to all clients', async () => {
      const testData: DeskThingToDeviceCore = {
        app: 'client',
        type: DESKTHING_DEVICE.APPS,
        request: 'manifest',
        payload: []
      }

      await platformStore.registerPlatform(mockPlatform)
      await platformStore.broadcastToClients(testData)

      expect(mockPlatform.broadcastData).toHaveBeenCalledWith(testData)
    })
  })

  describe('Event Handling', () => {
    it('should handle platform events correctly', async () => {
      const eventListener = vi.fn()
      platformStore.on(PlatformStoreEvent.PLATFORM_ADDED, eventListener)

      await platformStore.registerPlatform(mockPlatform)

      expect(eventListener).toHaveBeenCalledWith(mockPlatform)
    })

    it('should handle socket data from clients', async () => {
      await platformStore.registerPlatform(mockPlatform)

      // Simulate client connection through platform event
      const platformEventHandler = mockPlatform.on as Mock
      platformEventHandler.mock.calls.find(
        (call) => call[0] === PlatformEvent.CLIENT_CONNECTED
      )?.[1](testClient)

      const testData: DeviceToDeskthingData & { clientId: string } = {
        clientId: testClient.clientId,
        app: 'test-app',
        type: DEVICE_DESKTHING.PING,
        request: 'set',
        payload: { test: true }
      } as DeviceToDeskthingData & { clientId: string }

      await platformStore.handleSocketData(
        testClient as Extract<Client, { connected: true }>,
        testData
      )

      expect(Logger.warn).not.toHaveBeenCalled()
    })
  })
})
