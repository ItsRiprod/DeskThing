import { useEffect } from 'react'
import { useSettingsStore } from '../stores/'
import { Settings } from '@shared/types'
import { IpcRendererListener } from '@electron-toolkit/preload'

const SettingsDataListener = (): null => {
  const setSettings = useSettingsStore((state) => state.setSettings)

  useEffect(() => {
    const handleSettingsUpdate: IpcRendererListener = async (
      _event,
      settings: Settings
    ): Promise<void> => {
      setSettings(settings)
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
