/**
 * @file MappingStore.ts
 * @description This file needs to be completely redone and should not be considered production ready.
 * @author Riprod
 * @version 0.9.4
 */
import { create } from 'zustand'
import { Action, Key, ButtonMapping, ActionReference } from '@shared/types'

interface MappingStoreState {
  currentMapping: ButtonMapping
  currentProfile: string
  actions: Action[]
  keys: Key[]

  getProfiles: () => Promise<ButtonMapping[]>
  getProfile: (profileName: string) => Promise<ButtonMapping>
  saveProfile: (profile: ButtonMapping) => Promise<void>
  addProfile: (profile: { name: string; base?: string }) => Promise<void>

  setCurrentProfile: (profile: string) => Promise<void>

  setProfile: (mapping: ButtonMapping) => Promise<void>

  requestMappings: () => Promise<void>

  getKeys: () => Promise<Key[]>
  setKeys: (keys: Key[]) => Promise<void>
  setActions: (actions: Action[]) => Promise<void>
  getActions: () => Promise<Action[]>

  addKey: (key: Key) => Promise<void>
  removeKey: (keyId: string) => Promise<void>

  executeAction: (action: Action | ActionReference) => Promise<void>
}

const useMappingStore = create<MappingStoreState>(
  (set): MappingStoreState => ({
    currentMapping: {} as ButtonMapping,
    currentProfile: 'default',
    actions: [],
    keys: [],

    getProfiles: async (): Promise<ButtonMapping[]> => {
      return (await window.electron.getProfiles()) as ButtonMapping[]
    },

    getProfile: async (profileName): Promise<ButtonMapping> => {
      const profile = (await window.electron.getProfile(profileName)) as ButtonMapping
      return profile
    },

    saveProfile: async (profile): Promise<void> => {
      await window.electron.saveProfile(profile)
    },

    addProfile: async (profile): Promise<void> => {
      await window.electron.addProfile(profile)
    },

    setProfile: async (mapping): Promise<void> => {
      set({ currentMapping: mapping })
    },

    setCurrentProfile: async (profile: string): Promise<void> => {
      set({ currentProfile: profile })
    },

    requestMappings: async (): Promise<void> => {
      const actions = await window.electron.getActions()
      const keys = await window.electron.getKeys()
      const currentProfile = (await window.electron.getCurrentProfile()) || 'default'
      const profile = await window.electron.getProfile(currentProfile)
      set({ actions, keys, currentMapping: profile, currentProfile })
    },

    getKeys: async (): Promise<Key[]> => {
      return await window.electron.getKeys()
    },

    setKeys: async (keys): Promise<void> => {
      set({ keys })
    },

    getActions: async (): Promise<Action[]> => {
      return await window.electron.getActions()
    },

    setActions: async (actions): Promise<void> => {
      set({ actions })
    },

    addKey: async (key): Promise<void> => {
      await window.electron.addKey(key)
    },

    removeKey: async (keyId): Promise<void> => {
      await window.electron.deleteKey(keyId)
    },

    executeAction: async (action): Promise<void> => {
      await window.electron.runAction(action)
    }
  })
)
export default useMappingStore
