import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { PlatformStore } from '../../../src/main/stores/platformStore'
import { AppStoreClass } from '@shared/stores/appStore'
import { AppDataStoreClass } from '@shared/stores/appDataStore'
import { PlatformInterface } from '@shared/interfaces/platformInterface'
import {
  Client,
  DeviceToDeskthingData,
  DESKTHING_DEVICE,
  DeskThingToDeviceCore
} from '@deskthing/types'
import Logger from '@server/utils/logger'
import { PlatformIDs, PlatformStoreEvent } from '@shared/stores/platformStore'
import { MappingStoreClass } from '@shared/stores/mappingStore'

vi.mock('@server/utils/logger', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
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
      getAll: vi.fn().mockResolvedValue([])
    } as unknown as AppStoreClass

    mockAppDataStore = {
      on: vi.fn(),
      getSettings: vi.fn()
    } as unknown as AppDataStoreClass

    testClient = {
      id: 'test-client',
      connectionId: 'test-connection',
      connected: false,
      timestamp: 0
    }

    mockPlatform = {
      id: PlatformIDs.ADB,
      name: 'Test Platform',
      type: 'test',
      isRunning: vi.fn().mockReturnValue(true),
      start: vi.fn(),
      stop: vi.fn(),
      getStatus: vi.fn().mockReturnValue({ isActive: true, clients: [testClient] }),
      getClients: vi.fn().mockReturnValue([testClient]),
      getClientById: vi.fn(),
      sendData: vi.fn(),
      broadcastData: vi.fn().mockReturnValue(Promise.resolve()),
      on: vi.fn(),
      removeAllListeners: vi.fn(),
      updateClient: vi.fn()
    } as unknown as PlatformInterface

    mockMappingStore = {
      getAction: vi.fn(),
      addAction: vi.fn(),
      on: vi.fn(),
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
      expect(status.totalClients).toBe(1)
    })
  })

  describe('Client Management', () => {
    it('should handle client updates', () => {
      const clientUpdate: Partial<Client> = {
        id: 'test-client'
      }

      vi.spyOn(platformStore, 'getPlatformForClient').mockReturnValue(mockPlatform)

      platformStore.registerPlatform(mockPlatform)
      platformStore.updateClient('test-client', clientUpdate)

      expect(mockPlatform.updateClient).toHaveBeenCalledWith('test-client', clientUpdate)
    })

    it('should broadcast data to all clients', async () => {
      const testData: DeskThingToDeviceCore = {
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
      const testData = {
        app: 'test-app',
        type: 'test-type',
        payload: { test: true }
      } as unknown as DeviceToDeskthingData & { connectionId: string }

      vi.spyOn(platformStore, 'getPlatformForClient').mockReturnValue(mockPlatform)
      await platformStore.registerPlatform(mockPlatform)
      await platformStore.handleSocketData(testClient, testData)
      expect(Logger.warn).not.toHaveBeenCalled()
    })
  })
})
