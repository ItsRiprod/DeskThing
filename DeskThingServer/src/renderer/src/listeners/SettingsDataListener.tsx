import { useEffect } from 'react'
import { useSettingsStore } from '../stores/'
import { Settings } from '@shared/types'

const SettingsDataListener = (): null => {
  const setSettings = useSettingsStore((state) => state.setSettings)

  useEffect(() => {
    const handleSettingsUpdate = async (_event, settings: Settings): Promise<void> => {
      await setSettings(settings)
    }

    const getInitialSettings = async (): Promise<void> => {
      const settings = await window.electron.getSettings()
      console.log('Initial Settings', settings)
      setSettings(settings)
    }

    getInitialSettings()

    window.electron.ipcRenderer.on('settings-updated', handleSettingsUpdate)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('settings-updated')
    }
  }, [])

  return null
}

export default SettingsDataListener
