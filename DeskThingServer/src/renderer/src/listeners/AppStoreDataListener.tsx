import { useEffect } from 'react'
import { useAppStore } from '../stores'

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
