import { useEffect } from 'react'
import FileHandler from './components/FileHandler'
import Overlays from './components/Overlays'
import AppsList from './components/AppsList'
import Status from './components/Status'
import { useAppStore, AppData } from './store/appStore'
import { IconLoading } from './components/icons'

function App(): JSX.Element {
  const { setAppList } = useAppStore()
  useEffect(() => {
    const handleAppData = (_event: any, data: AppData): void => {
      // Call your function to handle data.json here
      handleAppDataJson(data)
    }

    // Set up listener for 'app-data' event
    const removeListener = window.electron.ipcRenderer.on('app-data', handleAppData)

    return () => {
      removeListener()
    }
  }, [])
  const handleAppDataJson = (data: AppData): void => {
    setAppList(data)
  }

  return (
    <div className="bg-zinc-950 overflow-hidden">
      <div className="h-screen w-screen justify-center gap-5 flex flex-wrap sm:flex-nowrap overflow-y-scroll sm:overflow-hidden items-center text-white p-5">
        <Overlays />
        <div className="container rounded-lg flex flex-col overflow-y-scroll items-center border-2 border-zinc-800 h-full p-2">
          <div className="flex items-center">
            <h1 className="text-5xl py-5">DeskThing</h1>
            <IconLoading className="animate-spin" />
          </div>
          <Status />
        </div>
        <div className="container rounded-lg flex flex-col overflow-y-scroll items-center border-2 border-zinc-800 h-full p-2">
          <AppsList />
          <FileHandler />
        </div>
      </div>
    </div>
  )
}

export default App
