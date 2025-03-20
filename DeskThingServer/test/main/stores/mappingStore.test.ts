import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { MappingStore } from '@server/stores/mappingStore'
import { AppStoreClass } from '@shared/stores/appStore'
import { Action, EventMode, Key, Profile } from '@DeskThing/types'
import Logger from '@server/utils/logger'

vi.mock('@server/utils/logger', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
    info: vi.fn()
  }
}))

vi.mock('@server/services/files/fileService', () => ({
  writeToFile: vi.fn(),
  readFromFile: vi.fn()
}))

describe('MappingStore', () => {
  let mappingStore: MappingStore
  let mockAppStore: AppStoreClass

  beforeEach(() => {
    mockAppStore = {
      sendDataToApp: vi.fn(),
      onAppMessage: vi.fn()
    } as unknown as AppStoreClass

    mappingStore = new MappingStore(mockAppStore)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Action Management', () => {
    it('should add and retrieve an action', async () => {
      const testAction: Action = {
        id: 'test-action',
        name: 'Test Action',
        description: 'Test Description',
        source: 'test-source',
        version: '1.0.0',
        enabled: true,
        tag: 'basic'
      }

      await mappingStore.addAction(testAction)
      const retrievedAction = await mappingStore.getAction('test-action')
      expect(retrievedAction).toEqual(testAction)
    })

    it('should handle invalid action addition', async () => {
      const invalidAction = {} as Action
      await mappingStore.addAction(invalidAction)
      expect(Logger.error).toHaveBeenCalled()
    })
  })

  describe('Profile Management', () => {
    it('should prevent modification of default profile', async () => {
      const defaultProfile: Profile = {
        id: 'default',
        name: 'Default Profile',
        description: 'Default Profile',
        version: '',
        version_code: 0
      }

      await mappingStore.addProfile(defaultProfile)
      expect(Logger.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Cannot edit the default profile')
      )
    })

    it('should handle profile removal correctly', async () => {
      const testProfile: Profile = {
        id: 'test-profile',
        name: 'Test Profile',
        description: 'Test Profile',
        version: '',
        version_code: 0
      }

      await mappingStore.addProfile(testProfile)
      await mappingStore.removeProfile('test-profile')
      const profiles = await mappingStore.getProfiles()
      expect(profiles.find((p) => p.id === 'test-profile')).toBeUndefined()
    })
  })

  describe('Key Management', () => {
    it('should handle key trigger with missing profile', async () => {
      await mappingStore.triggerKey('test-key', EventMode.PressShort)
      expect(Logger.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Profile was null or undefined')
      )
    })

    it('should add and retrieve keys', async () => {
      const testKey: Key = {
        id: 'test-key',
        description: 'Test Key',
        source: 'test-source',
        version: '1.0.0',
        enabled: true,
        modes: [EventMode.PressShort]
      }

      await mappingStore.addKey(testKey)
      const keys = await mappingStore.getKeys()
      expect(keys).toContainEqual(testKey)
    })
  })

  describe('Listener Management', () => {
    it('should handle listener addition and removal', () => {
      const mockListener = vi.fn()
      const removeListener = mappingStore.addListener('key', mockListener)

      removeListener()

      mappingStore['notifyListeners']('key', [])
      expect(mockListener).not.toHaveBeenCalled()
    })

    it('should notify multiple listeners', async () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      mappingStore.addListener('action', listener1)
      mappingStore.addListener('action', listener2)

      await mappingStore['notifyListeners']('action', [])

      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()
    })
  })
})
