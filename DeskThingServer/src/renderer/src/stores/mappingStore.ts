/**
 * @file MappingStore.ts
 * @description This file needs to be completely redone and should not be considered production ready.
 * @author Riprod
 * @version 0.9.4
 */
import { create } from 'zustand'
import { Action, Key, ButtonMapping, ActionReference, Profile } from '@shared/types'

const DefaultProfile: Profile = {
  id: 'default',
  name: 'Default',
  version: '0.9.4',
  version_code: 9.4
}

interface MappingStoreState {
  currentMapping: ButtonMapping
  currentProfile: Profile
  profiles: Profile[]
  actions: Action[]
  keys: Key[]

  getProfiles: () => Promise<Profile[]>
  getProfile: (profileName: string) => Promise<ButtonMapping>
  saveProfile: (profile: ButtonMapping) => Promise<void>
  addProfile: (profile: Profile) => Promise<void>
  deleteProfile: (profileName: string) => Promise<void>

  getIcon: (action: Action | ActionReference) => Promise<string | null>

  setCurrentProfile: (profile: Profile) => Promise<void>

  setProfile: (mapping: ButtonMapping) => Promise<void>

  requestMappings: () => Promise<void>

  getKeys: () => Promise<Key[]>
  setKeys: (keys: Key[]) => Promise<void>
  getKeyById: (keyId: string) => Promise<Key | undefined>
  setActions: (actions: Action[]) => Promise<void>
  getActions: () => Promise<Action[]>

  addKey: (key: Key) => Promise<void>
  removeKey: (keyId: string) => Promise<void>

  executeAction: (action: Action | ActionReference) => Promise<void>
}

const useMappingStore = create<MappingStoreState>(
  (set, get): MappingStoreState => ({
    currentMapping: {} as ButtonMapping,
    currentProfile: DefaultProfile,
    actions: [],
    keys: [],
    profiles: [],

    getProfiles: async (): Promise<Profile[]> => {
      const profileList = await window.electron.getProfiles()
      set({ profiles: profileList })
      return profileList
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
      await get().setCurrentProfile(profile)
      await get().requestMappings()
      set({ profiles: [...get().profiles, profile] })
    },

    deleteProfile: async (profile): Promise<void> => {
      await window.electron.deleteProfile(profile)
    },

    setProfile: async (mapping): Promise<void> => {
      set({ currentMapping: mapping })
    },

    setCurrentProfile: async (profile: Profile): Promise<void> => {
      window.electron.setCurrentProfile(profile)
      set({ currentProfile: profile })
    },

    requestMappings: async (): Promise<void> => {
      const actions = await window.electron.getActions()
      const keys = await window.electron.getKeys()
      const currentProfile = (await window.electron.getCurrentProfile()) || 'default'
      const profile = await window.electron.getProfile(currentProfile.id)
      set({ actions, keys, currentMapping: profile, currentProfile })
    },

    getKeys: async (): Promise<Key[]> => {
      const keys = await window.electron.getKeys()
      set({ keys })
      return keys
    },

    getKeyById: async (keyId: string): Promise<Key | undefined> => {
      const key = get().keys.find((k) => k.id === keyId)
      return key
    },

    setKeys: async (keys): Promise<void> => {
      set({ keys })
    },

    getActions: async (): Promise<Action[]> => {
      const actions = await window.electron.getActions()
      set({ actions })
      return actions
    },

    getIcon: async (actionRef: Action | ActionReference): Promise<string | null> => {
      const action = get().actions.find((a) => a.id === actionRef.id)

      return window.electron.getIcon(action)
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
