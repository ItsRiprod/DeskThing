import { useEffect } from 'react'
import FileHandler from './components/FileHandler'
import Overlays from './components/Overlays'
import AppsList from './components/AppsList'
import { useAppStore, AppData } from './store/appStore'

function App(): JSX.Element {
  const { setAppList, appsList } = useAppStore()
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
    <>
      <div className="bg-zinc-950 h-screen w-screen justify-center flex items-center text-white p-5">
        <Overlays />
        <div className="container flex flex-col items-center border-2 border-zinc-800 h-full">
          <h1 className="text-5xl py-5">DeskThing</h1>
          <FileHandler />
        </div>
        <div className="container flex flex-col items-center border-2 border-zinc-800 h-full">
          <AppsList />
        </div>
      </div>
    </>
  )
}

export default App
