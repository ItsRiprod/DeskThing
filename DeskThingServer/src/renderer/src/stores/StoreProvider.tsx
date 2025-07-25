import React, { useEffect, useState } from 'react'
import useAppStore from './appStore'
import useSettingsStore from './settingsStore'
import useLogStore from './logStore'
import useClientStore from './clientStore'
import useReleaseStore from './releaseStore'
import useTaskStore from './taskStore'
import { useProgressStore } from './progressStore'
import useMappingStore from './mappingStore'
import useUpdateStore from './updateStore'
import useNotificationStore from './notificationStore'
import useFlashStore from './flashStore'

export const StoreProvider: React.FC = () => {
  const [initialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (initialized) {
      return
    }

    const initializeStores = async (): Promise<void> => {
      try {
        console.log('Initializing store')
        // Initialize stores in parallel when possible, or in sequence when dependencies exist
        await Promise.all([
          useSettingsStore.getState().initialize(),
          useAppStore.getState().initialize(),
          useLogStore.getState().initialize(),
          useClientStore.getState().initialize(),
          useReleaseStore.getState().initialize(),
          useTaskStore.getState().initialize(),
          useProgressStore.getState().initialize(),
          useMappingStore.getState().initialize(),
          useUpdateStore.getState().initialize(),
          useNotificationStore.getState().initialize(),
          useFlashStore.getState().initialize()
        ])

        setIsInitialized(true)
      } catch (err) {
        console.error('Failed to initialize stores:', err)
      }
    }

    initializeStores()
  }, [])

  return null
}
