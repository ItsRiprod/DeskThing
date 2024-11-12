/**
 * @file keyStore.ts
 * @description This file needs to be completely redone and should not be considered production ready.
 * @author Riprod
 * @version 0.9.0
 */
import { create } from 'zustand'
import { Action, Key, MappingStructure, EventMode } from '@shared/types'

interface KeyMapStoreState {
  mappingStructure: MappingStructure | null
  selectedProfile: string
  actions: Action[]
  keys: Key[]

  // Fetch mapping structure from Electron or any other source
  requestMappings: () => Promise<void>

  // Set mappings directly (useful when you already have the structure)
  setMappingStructure: (mapping: MappingStructure) => void

  // Add or update action in the list of actions
  addAction: (action: Action) => void

  // Remove an action by its ID
  removeAction: (actionId: string) => void

  // Add or update a key in the list of keys
  addKey: (key: Key) => void

  // Remove a key by its ID
  removeKey: (keyId: string) => void

  // Set selected profile
  setSelectedProfile: (profile: string) => void

  // Update a specific button mapping (e.g., for remapping actions)
  updateButtonMapping: (profile: string, keyId: string, Mode: EventMode, action: Action) => void
}

const useKeyMapStore = create<KeyMapStoreState>((set) => ({
  mappingStructure: null,
  selectedProfile: 'default',
  actions: [],
  keys: [],

  // Fetch mappings (e.g., from Electron or an API)
  requestMappings: async (): Promise<void> => {
    const mappingStructure = await window.electron.getMappings() // Assuming this is how you fetch mappings
    set({
      mappingStructure,
      selectedProfile: mappingStructure.selected_profile,
      actions: mappingStructure.actions,
      keys: mappingStructure.keys
    })
  },

  // Set the mapping structure directly
  setMappingStructure: (mapping: MappingStructure): void => {
    set({
      mappingStructure: mapping,
      selectedProfile: mapping.selected_profile,
      actions: mapping.actions,
      keys: mapping.keys
    })
  },

  // Add or update an action in the store
  addAction: (action: Action): void => {
    set((state) => {
      const actionIndex = state.actions.findIndex((a) => a.id === action.id)
      if (actionIndex > -1) {
        const updatedActions = [...state.actions]
        updatedActions[actionIndex] = action
        return { actions: updatedActions }
      }
      return { actions: [...state.actions, action] }
    })
  },

  // Remove an action by its ID
  removeAction: (actionId: string): void => {
    set((state) => ({
      actions: state.actions.filter((action) => action.id !== actionId)
    }))
  },

  // Add or update a key in the store
  addKey: (key: Key): void => {
    set((state) => {
      const keyIndex = state.keys.findIndex((k) => k.id === key.id)
      if (keyIndex > -1) {
        const updatedKeys = [...state.keys]
        updatedKeys[keyIndex] = key
        return { keys: updatedKeys }
      }
      return { keys: [...state.keys, key] }
    })
  },

  // Remove a key by its ID
  removeKey: (keyId: string): void => {
    set((state) => ({
      keys: state.keys.filter((key) => key.id !== keyId)
    }))
  },

  // Set the selected profile
  setSelectedProfile: (profile: string): void => {
    set(() => ({
      selectedProfile: profile
    }))
  },

  // Update a specific button mapping for a key and Mode in the selected profile
  updateButtonMapping: (
    profile: string,
    keyId: string,
    Mode: EventMode,
    action: Action
  ): void => {
    set((state) => {
      if (!state.mappingStructure) return state

      const updatedMappingStructure = { ...state.mappingStructure }
      const profileMapping =
        updatedMappingStructure.profiles[profile] || updatedMappingStructure.profiles['default']
      if (!profileMapping) return state

      const mapping = profileMapping.mapping[keyId] || {}
      mapping[Mode] = action

      profileMapping.mapping[keyId] = mapping
      updatedMappingStructure.profiles[profile] = profileMapping

      return { mappingStructure: updatedMappingStructure }
    })
  }
}))

export default useKeyMapStore
