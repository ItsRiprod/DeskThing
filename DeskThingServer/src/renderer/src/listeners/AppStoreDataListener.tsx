import { useEffect } from 'react'
import { useAppStore } from '../stores'
import { IpcRendererCallback } from '@shared/types'

let mounted = false

/**
 * Listens for app data events and updates the app list in the application store.
 *
 * This component is responsible for fetching the initial list of apps from the
 * Electron main process and subscribing to 'app-data' events to update the app
 * list in the application store. When the component unmounts, it removes the
 * 'app-data' event listener to avoid memory leaks.
 */
const AppStoreDataListener = (): null => {
  const setAppList = useAppStore((state) => state.setAppList)
  // const setAppSettings = useAppStore((state) => state.setAppSettings)

  if (!mounted) {
    const initialRequest = async (): Promise<void> => {
      const appsList = await window.electron.getApps()
      setAppList(appsList)
    }

    initialRequest()
    mounted = true
  }

  useEffect(() => {
    const handleAppData: IpcRendererCallback<'app-data'> = async (
      _event,
      response
    ): Promise<void> => {
      setAppList(response)
    }

    // const handleAppSettings: IpcRendererCallback<'app-settings'> = async (
    //   _event,
    //   appData
    // ): Promise<void> => {
    //   setAppSettings(appData.appId, appData.data)
    // }

    // Listen for IPC events
    window.electron.ipcRenderer.on('app-data', handleAppData)
    // window.electron.ipcRenderer.on('app-settings', handleAppSettings)
    // Clean up the IPC listener when the component unmounts
    return () => {
      window.electron.ipcRenderer.removeAllListeners('app-data')
      // window.electron.ipcRenderer.removeAllListeners('app-settings')
    }
  }, [setAppList])

  return null
}

export default AppStoreDataListener
