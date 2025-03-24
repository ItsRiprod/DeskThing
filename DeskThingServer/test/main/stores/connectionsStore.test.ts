import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ConnectionStore } from '../../../src/main/stores/connectionsStore'
import { SettingsStoreClass } from '@shared/stores/settingsStore'
import { TaskStoreClass } from '@shared/stores/taskStore'
import { PlatformStoreClass } from '@shared/stores/platformStore'
import Logger from '@server/utils/logger'
import { handleAdbCommands } from '@server/handlers/adbHandler'

vi.mock('@server/utils/logger', () => ({
  default: {
    log: vi.fn(),
    info: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('@server/handlers/adbHandler', () => ({
  handleAdbCommands: vi.fn()
}))

vi.mock('@server/handlers/deviceHandler', () => ({
  configureDevice: vi.fn()
}))

describe('ConnectionStore', () => {
  let connectionStore: ConnectionStore
  let mockSettingsStore: SettingsStoreClass
  let mockTaskStore: TaskStoreClass
  let mockPlatformStore: PlatformStoreClass

  beforeEach(() => {
    mockSettingsStore = {
      getSettings: vi.fn().mockResolvedValue({ autoDetectADB: false, autoConfig: false }),
      addListener: vi.fn()
    } as unknown as SettingsStoreClass

    mockTaskStore = {
      completeStep: vi.fn()
    } as unknown as TaskStoreClass

    mockPlatformStore = {
      on: vi.fn()
    } as unknown as PlatformStoreClass

    connectionStore = new ConnectionStore(mockSettingsStore, mockTaskStore, mockPlatformStore)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('ADB Device Management', () => {
    it('should parse ADB devices correctly from command output', async () => {
      const mockAdbOutput = 'List of devices attached\n1234 device\n9876 device offline\n'
      vi.mocked(handleAdbCommands).mockResolvedValue(mockAdbOutput)

      const devices = await connectionStore.getAdbDevices()

      expect(devices).toHaveLength(2)
      expect(devices[0]).toEqual({
        adbId: '1234',
        offline: false,
        connected: false,
        error: '1234'
      })
      expect(devices[1]).toEqual({
        adbId: '9876',
        offline: true,
        connected: false,
        error: '9876  offline'
      })
    })

    it('should handle empty ADB device list', async () => {
      vi.mocked(handleAdbCommands).mockResolvedValue('List of devices attached\n')

      const devices = await connectionStore.getAdbDevices()

      expect(devices).toHaveLength(0)
    })

    it('should handle ADB command errors', async () => {
      vi.mocked(handleAdbCommands).mockRejectedValue(new Error('ADB error'))

      const devices = await connectionStore.getAdbDevices()

      expect(devices).toHaveLength(0)
      expect(Logger.error).toHaveBeenCalledWith('Error detecting ADB devices!', expect.any(Object))
    })
  })

  describe('Client Management', () => {
    it('should notify listeners when clients are updated', async () => {
      const mockListener = vi.fn()
      await connectionStore.on(mockListener)

      await connectionStore.addClient({
        connectionId: 'test',
        id: '',
        connected: false,
        timestamp: 0
      })

      expect(mockListener).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ connectionId: 'test' })])
      )
    })

    it('should update existing client correctly', async () => {
      await connectionStore.addClient({
        connectionId: 'test',
        id: '',
        connected: false,
        timestamp: 0
      })
      await connectionStore.updateClient('test', { id: 'Updated Client' })

      const clients = connectionStore.getClients()
      expect(clients).toHaveLength(1)
      expect(clients[0]).toEqual(
        expect.objectContaining({
          connectionId: 'test',
          id: 'Updated Client'
        })
      )
    })

    it('should handle device listener registration and notification', async () => {
      const mockDeviceListener = vi.fn()
      await connectionStore.onDevice(mockDeviceListener)

      vi.mocked(handleAdbCommands).mockResolvedValue('List of devices attached\ndevice1 device\n')
      await connectionStore.getAdbDevices()

      expect(mockDeviceListener).toHaveBeenCalled()
    })

    it('should remove client listener correctly', async () => {
      const mockListener = vi.fn()
      const removeListener = await connectionStore.on(mockListener)
      removeListener()

      await connectionStore.addClient({
        connectionId: 'test',
        id: '',
        connected: false,
        timestamp: 0
      })

      expect(mockListener).not.toHaveBeenCalled()
    })
  })
})
