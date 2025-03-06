import { useEffect } from 'react'
import { useSettingsStore } from '../stores/'
import { IpcRendererCallback } from '@shared/types'

let mounted = false

const SettingsDataListener = (): null => {
  const setSettings = useSettingsStore((state) => state.setSettings)

  if (!mounted) {
    const getInitialSettings = async (): Promise<void> => {
      const settings = await window.electron.getSettings()
      setSettings(settings)
    }

    getInitialSettings()
    mounted = true
  }

  useEffect(() => {
    const handleSettingsUpdate: IpcRendererCallback<'settings-updated'> = async (
      _event,
      settings
    ): Promise<void> => {
      await setSettings(settings)
    }

    window.electron.ipcRenderer.on('settings-updated', handleSettingsUpdate)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('settings-updated')
    }
  }, [])

  return null
}

export default SettingsDataListener
