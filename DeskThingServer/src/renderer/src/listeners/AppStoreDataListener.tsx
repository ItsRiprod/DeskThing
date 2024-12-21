import { useEffect } from 'react'
import { useAppStore } from '../stores'

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

  useEffect(() => {
    const handleAppData = async (_event, response): Promise<void> => {
      setAppList(response.apps)
    }

    const initialRequest = async (): Promise<void> => {
      const appsList = await window.electron.getApps()
      setAppList(appsList)
    }

    initialRequest()

    // Listen for IPC events
    window.electron.ipcRenderer.on('app-data', handleAppData)
    // Clean up the IPC listener when the component unmounts
    return () => {
      window.electron.ipcRenderer.removeAllListeners('app-data')
    }
  }, [setAppList])

  return null
}

export default AppStoreDataListener
