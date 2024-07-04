import { useEffect, useState } from 'react'
import Overlays from './components/Overlays'
import { useAppStore, AppData } from './store/appStore'
import logInstance from './store/logStore'

import Sidebar from './components/Sidebar'
import ContentArea from './components/ContentArea'

type View = 'appsList' | 'status' | 'logDisplay'

function App(): JSX.Element {
  const { setAppList } = useAppStore()
  const [currentView, setCurrentView] = useState<View>('appsList')

  useEffect(() => {
    const handleAppData = (_event: Electron.IpcRendererEvent, data: AppData): void => {
      // Call your function to handle data.json here
      handleAppDataJson(data)
    }
    const handleLog = async (errorData, type): Promise<void> => {
      logInstance.addLog(type, errorData)
    }

    // Set up listener for 'app-data' event
    const removeListener = window.electron.ipcRenderer.on('app-data', handleAppData)
    const removeErrorListener = window.electron.ipcRenderer.on('error', (_event, errorData) =>
      handleLog(errorData, 'error')
    )
    const removeLogListener = window.electron.ipcRenderer.on('log', (_event, errorData) =>
      handleLog(errorData, 'log')
    )
    const removeMessageListener = window.electron.ipcRenderer.on('message', (_event, errorData) =>
      handleLog(errorData, 'message')
    )

    return () => {
      removeListener()
      removeErrorListener()
      removeLogListener()
      removeMessageListener()
    }
  }, [])
  const handleAppDataJson = (data: AppData): void => {
    setAppList(data)
  }

  return (
    <div className="bg-zinc-950 overflow-hidden">
      <div className="h-screen w-screen justify-center gap-5 flex flex-wrap sm:flex-nowrap overflow-y-scroll sm:overflow-hidden items-center text-white p-5">
        <Overlays />
        <Sidebar setCurrentView={setCurrentView} currentView={currentView} />

        <ContentArea currentView={currentView} />
      </div>
    </div>
  )
}

export default App
