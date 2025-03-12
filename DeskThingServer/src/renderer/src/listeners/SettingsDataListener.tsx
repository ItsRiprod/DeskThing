import { useEffect } from 'react'
import { useSettingsStore } from '../stores/'
import { IpcRendererCallback } from '@shared/types'

let mounted = false

const SettingsDataListener = (): null => {
  const setSettings = useSettingsStore((state) => state.setSettings)
  const addRequest = useSettingsStore((state) => state.addRequest)

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

    const handleLinkRequest: IpcRendererCallback<'link-request'> = async (
      _event,
      request
    ): Promise<void> => {
      addRequest(request)
    }

    window.electron.ipcRenderer.on('settings-updated', handleSettingsUpdate)
    window.electron.ipcRenderer.on('link-request', handleLinkRequest)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('settings-updated')
      window.electron.ipcRenderer.removeAllListeners('link-request')
    }
  }, [])

  return null
}

export default SettingsDataListener
