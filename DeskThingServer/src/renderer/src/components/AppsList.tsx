import { useEffect, useState } from 'react'
import { useAppStore, App } from '../store/appStore'
import {
  IconRefresh,
  IconX,
  IconPause,
  IconPlay,
  IconDetails,
  IconPulsing
} from '../components/icons'
import DisplayAppData from './Overlays/DisplayAppData'
import FileHandler from './FileHandler'
import { RequestStoreInstance, Request } from '../store'

const AppsList = (): JSX.Element => {
  const { appsList } = useAppStore()
  const [enabled, setEnabled] = useState(false)
  const [appIndex, setAppIndex] = useState(-1)
  const [appsWithActiveRequests, setAppsWithActiveRequests] = useState<string[]>([])

  const handleAddAndRunApp = (appName: string): void => {
    window.electron.ipcRenderer.send('add-app', appName)
    requestAppsList()
  }
  const handleStopApp = (appName: string): void => {
    window.electron.ipcRenderer.send('stop-app', appName)
    requestAppsList()
  }
  const handleDisableApp = (appName: string): void => {
    window.electron.ipcRenderer.send('disable-app', appName)
    requestAppsList()
  }
  const handleDetails = (appIndex: number): void => {
    setAppIndex(appIndex)
    setEnabled(true)
  }
  const requestAppsList = (): void => window.electron.ipcRenderer.send('get-apps')

  useEffect(() => {
    console.log('apps list in AppsList: ', appsList)

    // Subscribe to changes in request status
    const onRequestUpdate = (requests: Request[]): void => {
      const appsWithActiveRequests: string[] = requests.map((request) => request.appName)
      setAppsWithActiveRequests(appsWithActiveRequests)
    }

    RequestStoreInstance.on('request', onRequestUpdate)

    return () => {
      // Clean up the subscription on unmount
      RequestStoreInstance.off('request', onRequestUpdate)
    }
  }, [appsList])
  const handleRequestTrigger = (appName: string): void => {
    RequestStoreInstance.triggerRequestDisplay(appName)
  }

  return (
    <div className="h-svh w-[100%] flex flex-col justify-between items-center">
      <div className="pt-5 w-full flex justify-center">
        {enabled && <DisplayAppData appIndex={appIndex} setEnabled={setEnabled} data={appsList} />}
        {Object.keys(appsList.apps).length > 0 ? (
          <div className="pt-5 w-full flex 2xl:flex-row 2xl:flex-wrap flex-col items-center gap-2">
            <div className="p-5 w-[90%] h-fit flex justify-end rounded-3xl shadow-lg px-5 align-baseline">
              <button
                className="border-2 top-10 border-cyan-600 hover:bg-cyan-500  p-2 rounded-lg"
                onClick={() => requestAppsList()}
              >
                <IconRefresh iconSize={24} />
              </button>
            </div>
            {(appsList.apps as App[]).map((app, appIndex) => (
              <div
                key={appIndex}
                className="border-2 border-zinc-200 p-5 w-11/12 md:w-11/12 2xl:w-96 h-fit flex justify-between rounded-3xl shadow-lg px-5 items-center"
              >
                <div className="flex gap-2">
                  <button onClick={() => handleDetails(appIndex)} className="hover:text-slate-600">
                    <IconDetails />
                  </button>
                  <p>{app.manifest ? app.manifest.label : app.name}</p>
                  <p className="text-zinc-400 text-xs">{app.manifest?.version}</p>
                </div>
                {appsWithActiveRequests.includes(app.name) ? (
                  <div className="flex items-center md:flex-row flex-col">
                    <p className="text-blue-300">Data Request</p>
                    <button
                      className="border-2 border-blue-600 hover:bg-blue-500 m-1 p-2 rounded-lg"
                      onClick={() => handleRequestTrigger(app.name)}
                    >
                      <IconPulsing />
                    </button>
                  </div>
                ) : app.enabled ? (
                  <div className="flex items-center md:flex-row flex-col">
                    <div className="flex-col flex items-end">
                      {app.running ? (
                        <p className="text-green-500">Running</p>
                      ) : (
                        <p className="text-red-600">Stopped</p>
                      )}
                    </div>

                    {app.running ? (
                      <button
                        className="border-2 border-amber-600 hover:bg-amber-500 m-1 p-2 rounded-lg"
                        onClick={() => handleStopApp(app.name)}
                      >
                        <IconPause />
                      </button>
                    ) : (
                      <button
                        className="border-2 border-cyan-600 hover:bg-cyan-500 m-1 p-2 rounded-lg"
                        onClick={() => handleAddAndRunApp(app.name)}
                      >
                        <IconPlay />
                      </button>
                    )}
                    <button
                      className="border-2 border-red-600 hover:bg-red-500 p-2 rounded-lg"
                      onClick={() => handleDisableApp(app.name)}
                    >
                      <IconX />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center md:flex-row flex-col">
                    <p className="text-zinc-600">Disabled</p>
                    <button
                      className="border-2 border-cyan-600 hover:bg-cyan-500 m-1 p-2 rounded-lg"
                      onClick={() => handleAddAndRunApp(app.name)}
                    >
                      <IconPlay />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-zinc-200 p-5 w-[90%] h-fit flex justify-center rounded-3xl shadow-lg px-5 align-baseline">
            <button
              className="border-2 border-cyan-600 hover:bg-cyan-500 bg-cyan-600  p-2 rounded-lg"
              onClick={() => requestAppsList()}
            >
              Request Apps
            </button>
          </div>
        )}
      </div>
      <FileHandler />
    </div>
  )
}

export default AppsList
