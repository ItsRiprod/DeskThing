import { useEffect } from 'react'
import { Action, ButtonMapping, Key } from '@shared/types'
import useMappingStore from '@renderer/stores/mappingStore'

const MappingsDataListener = (): null => {
  const setKeys = useMappingStore((state) => state.setKeys)
  const setActions = useMappingStore((state) => state.setActions)
  const setProfile = useMappingStore((state) => state.setProfile)
  const setCurrentProfile = useMappingStore((state) => state.setCurrentProfile)
  const requestMappings = useMappingStore((state) => state.requestMappings)

  useEffect(() => {
    const handleKeyUpdate = async (_event, key: Key[]): Promise<void> => {
      setKeys(key)
    }
    const handleActionUpdate = async (_event, action: Action[]): Promise<void> => {
      setActions(action)
    }
    const handleProfileUpdate = async (_event, profile: ButtonMapping): Promise<void> => {
      console.log(profile)
      setProfile(profile)
      const currentProfile = await window.electron.getCurrentProfile()
      setCurrentProfile(currentProfile)
    }

    requestMappings()

    window.electron.ipcRenderer.on('key', handleKeyUpdate)
    window.electron.ipcRenderer.on('action', handleActionUpdate)
    window.electron.ipcRenderer.on('profile', handleProfileUpdate)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('key')
      window.electron.ipcRenderer.removeAllListeners('action')
      window.electron.ipcRenderer.removeAllListeners('profile')
    }
  }, [])

  return null
}

export default MappingsDataListener
