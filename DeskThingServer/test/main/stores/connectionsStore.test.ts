import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import ConnectionStore from '@server/stores/connectionsStore'
import { Client } from '@shared/types'

vi.mock('@server/stores/settingsStore', () => ({
  default: {
    getSettings: vi.fn().mockResolvedValue({ autoDetectADB: false }),
    addListener: vi.fn()
  }
}))

vi.mock('@server/stores/loggingStore', () => ({
  default: {
    log: vi.fn()
  }
}))

vi.mock('@server/handlers/adbHandler', () => ({
  handleAdbCommands: vi.fn()
}))

describe('ConnectionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('Client Management', () => {
    it('should add and retrieve clients', async () => {
      const client: Client = {
        connectionId: '123',
        client_name: 'test',
        ip: '',
        connected: false,
        timestamp: 0
      }
      await ConnectionStore.addClient(client)
      expect(ConnectionStore.getClients()).toContainEqual(client)
    })

    it('should update existing client', async () => {
      const client: Client = {
        connectionId: '123',
        client_name: 'test',
        ip: '',
        connected: false,
        timestamp: 0
      }
      const updates: Partial<Client> = { client_name: 'updated' }
      await ConnectionStore.addClient(client)
      await ConnectionStore.updateClient('123', updates)
      expect(ConnectionStore.getClients()[0].client_name).toBe('updated')
    })

    it('should remove specific client', async () => {
      const client: Client = {
        connectionId: '123',
        client_name: 'test',
        ip: '',
        connected: false,
        timestamp: 0
      }
      await ConnectionStore.addClient(client)
      await ConnectionStore.removeClient('123')
      expect(ConnectionStore.getClients()).toHaveLength(0)
    })

    it('should remove all clients', async () => {
      const client1: Client = {
        connectionId: '123',
        client_name: 'test1',
        ip: '',
        connected: false,
        timestamp: 0
      }
      const client2: Client = {
        connectionId: '456',
        client_name: 'test2',
        ip: '',
        connected: false,
        timestamp: 0
      }
      await ConnectionStore.addClient(client1)
      await ConnectionStore.addClient(client2)
      await ConnectionStore.removeAllClients()
      expect(ConnectionStore.getClients()).toHaveLength(0)
    })
  })

  describe('Listeners', () => {
    it('should notify client listeners when clients change', async () => {
      const listener = vi.fn()
      await ConnectionStore.on(listener)
      await ConnectionStore.addClient({
        connectionId: '123',
        client_name: 'test',
        ip: '',
        connected: false,
        timestamp: 0
      })
      expect(listener).toHaveBeenCalled()
    })

    it('should remove listeners correctly', async () => {
      const listener = vi.fn()
      const removeListener = await ConnectionStore.on(listener)
      removeListener()
      await ConnectionStore.addClient({
        connectionId: '123',
        client_name: 'test',
        ip: '',
        connected: false,
        timestamp: 0
      })
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('ADB Detection', () => {
    it('should parse ADB devices correctly', async () => {
      const { handleAdbCommands } = await import('@server/handlers/adbHandler')
      vi.mocked(handleAdbCommands).mockResolvedValue(
        'List of devices attached\nClient1\tdevice\nClient2\tdevice\n'
      )
      const devices = await ConnectionStore.getAdbDevices()
      expect(devices).toEqual(['Client1', 'Client2'])
    })

    it('should handle empty ADB device list', async () => {
      const { handleAdbCommands } = await import('@server/handlers/adbHandler')
      vi.mocked(handleAdbCommands).mockResolvedValue('List of devices attached\n')
      const devices = await ConnectionStore.getAdbDevices()
      expect(devices).toEqual([])
    })

    it('should handle ADB command errors', async () => {
      const { handleAdbCommands } = await import('@server/handlers/adbHandler')
      vi.mocked(handleAdbCommands).mockRejectedValue(new Error('ADB error'))
      const devices = await ConnectionStore.getAdbDevices()
      expect(devices).toEqual([])
    })
  })
})
