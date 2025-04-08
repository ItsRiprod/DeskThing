/**
 * @file MappingStore.ts
 * @description This file needs to be completely redone and should not be considered production ready.
 * @author Riprod
 * @version 0.9.4
 */
import { create } from 'zustand'
import { Action, Key, ActionReference, ButtonMapping, Profile } from '@deskthing/types'
import { IpcRendererCallback } from '@shared/types'

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
  initialized: boolean

  initialize: () => Promise<void>
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
  getActions: () => Promise<Action[] | undefined>

  getActionFromReference: (
    action: ActionReference | { id: string; source: string }
  ) => Action | undefined

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
    initialized: false,

    initialize: async () => {
      if (get().initialized) return

      const handleKeyUpdate: IpcRendererCallback<'key'> = (_event, key): void => {
        get().setKeys(key)
      }
      const handleActionUpdate: IpcRendererCallback<'action'> = async (
        _event,
        action
      ): Promise<void> => {
        get().setActions(action)
      }
      const handleProfileUpdate: IpcRendererCallback<'profile'> = async (
        _event,
        profile
      ): Promise<void> => {
        get().setProfile(profile)
        const currentProfile = await window.electron.utility.getCurrentProfile()
        if (currentProfile) {
          get().setCurrentProfile(currentProfile)
        }
      }

      window.electron.ipcRenderer.on('key', handleKeyUpdate)
      window.electron.ipcRenderer.on('action', handleActionUpdate)
      window.electron.ipcRenderer.on('profile', handleProfileUpdate)

      await get().requestMappings()

      set({ initialized: true })
    },

    getProfiles: async (): Promise<Profile[]> => {
      const profileList = await window.electron.utility.getProfiles()
      set({ profiles: profileList })
      return profileList
    },

    getProfile: async (profileName): Promise<ButtonMapping> => {
      const profile = (await window.electron.utility.getProfile(profileName)) as ButtonMapping
      return profile
    },

    saveProfile: async (profile): Promise<void> => {
      await window.electron.utility.saveProfile(profile)
    },

    addProfile: async (profile): Promise<void> => {
      await window.electron.utility.addProfile(profile)
      await get().setCurrentProfile(profile)
      await get().requestMappings()
      set({ profiles: [...get().profiles, profile] })
    },

    deleteProfile: async (profile): Promise<void> => {
      await window.electron.utility.deleteProfile(profile)
    },

    setProfile: async (mapping): Promise<void> => {
      set({ currentMapping: mapping })
    },

    setCurrentProfile: async (profile: Profile): Promise<void> => {
      window.electron.utility.setCurrentProfile(profile)
      set({ currentProfile: profile })
    },

    requestMappings: async (): Promise<void> => {
      const actions = await window.electron.utility.getActions()
      const keys = await window.electron.utility.getKeys()
      const currentProfile = await window.electron.utility.getCurrentProfile()
      if (currentProfile) {
        const profile = await window.electron.utility.getProfile(currentProfile.id)
        set({
          actions: actions || undefined,
          keys: keys || undefined,
          currentMapping: profile || undefined,
          currentProfile: currentProfile || undefined
        })
      }
    },

    getKeys: async (): Promise<Key[]> => {
      const keys = await window.electron.utility.getKeys()
      set({ keys: keys || [] })
      return keys || []
    },

    getKeyById: async (keyId: string): Promise<Key | undefined> => {
      const key = get().keys.find((k) => k.id === keyId)
      return key
    },

    setKeys: async (keys): Promise<void> => {
      set({ keys })
    },

    getActions: async (): Promise<Action[] | undefined> => {
      const actions = await window.electron.utility.getActions()
      set({ actions: actions || undefined })
      return actions || undefined
    },

    getActionFromReference: (
      actionRef: ActionReference | { id: string; source: string }
    ): Action | undefined => {
      const action = get().actions.find(
        (a) => a.id === actionRef.id && a.source === actionRef.source
      )
      return action
    },

    getIcon: async (actionRef: Action | ActionReference): Promise<string | null> => {
      const action = get().actions.find((a) => a.id === actionRef.id)

      return (action && window.electron.client.getIcon(action)) || null
    },

    setActions: async (actions): Promise<void> => {
      set({ actions })
    },

    addKey: async (key): Promise<void> => {
      await window.electron.utility.addKey(key)
    },

    removeKey: async (keyId): Promise<void> => {
      await window.electron.utility.deleteKey(keyId)
    },

    executeAction: async (action): Promise<void> => {
      await window.electron.utility.runAction(action)
    }
  })
)
export default useMappingStore
