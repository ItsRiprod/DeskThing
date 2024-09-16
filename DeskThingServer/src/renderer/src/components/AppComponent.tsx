import { useEffect, useState } from 'react'
import { App as AppType } from '../store/appStore'
import { IconX, IconPause, IconPlay, IconDetails, IconPulsing, IconLogoGear } from '../assets/icons'
import RequestStoreInstance, { Request } from '../store/requestStore'
import AppRequestOverlay from '../overlays/AppRequest'

export type View = 'apps' | 'local' | 'web'

interface AppProps {
  app: AppType
  appIndex: number
  setEnabled: (boolean) => void
  setSEnabled: (boolean) => void
  setAppIndex: (number) => void
}

const AppComponent = ({
  appIndex,
  app,
  setEnabled,
  setSEnabled,
  setAppIndex
}: AppProps): JSX.Element => {
  const [App, setApp] = useState<AppType>(app)
  const [appsWithActiveRequests, setAppsWithActiveRequests] = useState<string[]>([])
  const [currentRequest, setCurrentRequest] = useState<[string, Request | null]>(['', null])
  const [displayRequest, setDisplayRequest] = useState(false)

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
  const handleSettings = (appIndex: number): void => {
    setAppIndex(appIndex)
    setSEnabled(true)
  }
  const requestAppsList = (): void => window.electron.ipcRenderer.send('get-apps')

  useEffect(() => {
    // Subscribe to changes in request status
    const onRequestUpdate = (requests: Request[]): void => {
      const appsWithActiveRequests: string[] = requests.map((request) => request.appName)
      setAppsWithActiveRequests(appsWithActiveRequests)
    }

    onRequestUpdate(RequestStoreInstance.getQueue()) // Get initial queue of requests

    RequestStoreInstance.on('request', onRequestUpdate)

    return () => {
      // Clean up the subscription on unmount
      RequestStoreInstance.off('request', onRequestUpdate)
    }
  }, [App])

  useEffect(() => {
    setApp(app)
  }, [app])

  const handleRequestTrigger = (appName: string): void => {
    const request = RequestStoreInstance.getRequestByAppName(appName)
    if (request) {
      setCurrentRequest([appName, request])
      setDisplayRequest(true)
    }
  }

  return (
    <div className="h-vh w-[100%] flex flex-col justify-between items-center">
      <div className="pt-5 w-full flex justify-center">
        {displayRequest && currentRequest[1] && currentRequest[0] && (
          <AppRequestOverlay
            requestName={currentRequest[0]}
            request={currentRequest[1]}
            onClose={() => setDisplayRequest(false)}
          />
        )}
        <div className="border-2 border-zinc-400 p-5 w-11/12 md:w-11/12 xl:w-fit xl:gap-5 h-fit flex justify-between rounded-3xl shadow-lg px-5 items-center">
          <div className="flex flex-wrap sm:flex-nowrap gap-2 xl:mr-2">
            <button
              className="group h-fit flex gap-2 border-2 border-gray-500 hover:bg-gray-500 text-gray-400 hover:text-gray-200 p-2 rounded-lg"
              onClick={() => handleSettings(appIndex)}
            >
              <IconLogoGear />
              <p className="group-hover:block hidden text-white">Settings</p>
            </button>
            <button
              onClick={() => handleDetails(appIndex)}
              className="group h-fit flex gap-2 border-2 top-10 border-green-600 hover:bg-green-500  p-2 rounded-lg"
            >
              <IconDetails iconSize={24} />
              <p className="group-hover:block hidden">Details</p>
            </button>
            <div>
              <p className="lg:text-nowrap">{App.manifest ? App.manifest.label : App.name}</p>
              <p className="text-zinc-400 text-xs font-geistMono">{App.manifest?.version}</p>
            </div>
          </div>
          <div className="flex md:items-center items-end justify-end md:flex-row flex-col xl:w-96">
            <div className="flex-col flex font-geistMono items-end pr-2">
              {App.running ? (
                <p className="text-green-500">Running</p>
              ) : App.enabled ? (
                <p className="text-red-600">Stopped</p>
              ) : (
                <p className="text-zinc-600 pr-2">Disabled</p>
              )}
            </div>
            {appsWithActiveRequests.includes(App.name) && (
              <div className="flex items-center md:flex-row flex-col">
                <button
                  className="group flex border-2 gap-3 border-blue-600 hover:bg-blue-500 m-1 p-2 rounded-lg"
                  onClick={() => handleRequestTrigger(App.name)}
                >
                  <p className="group-hover:block hidden text-white">
                    Handle<p className="hidden lg:inline"> Request</p>
                  </p>
                  <IconPulsing />
                </button>
              </div>
            )}
            {App.enabled ? (
              <>
                {App.running ? (
                  <button
                    className="group flex gap-3 border-2 border-amber-600 hover:bg-amber-500 mx-1 p-2 rounded-lg"
                    onClick={() => handleStopApp(App.name)}
                  >
                    <p className="group-hover:block hidden text-white">
                      Pause<p className="hidden lg:inline"> App</p>
                    </p>
                    <IconPause />
                  </button>
                ) : (
                  <button
                    className="gap-3 flex group border-2 border-cyan-600 hover:bg-cyan-500 mx-1 p-2 rounded-lg"
                    onClick={() => handleAddAndRunApp(App.name)}
                  >
                    <p className="group-hover:block hidden text-white">
                      Run<p className="hidden lg:inline"> App</p>
                    </p>
                    <IconPlay />
                  </button>
                )}
                <button
                  className="flex gap-3 group border-2 border-red-600 hover:bg-red-500 mx-1 p-2 rounded-lg"
                  onClick={() => handleDisableApp(App.name)}
                >
                  <p className="group-hover:block hidden text-white">
                    Disable<p className="hidden lg:inline"> App</p>
                  </p>
                  <IconX />
                </button>
              </>
            ) : (
              <button
                className="group gap-3 flex border-2 border-cyan-600 hover:bg-cyan-500 mx-1 p-2 rounded-lg"
                onClick={() => handleAddAndRunApp(App.name)}
              >
                <p className="group-hover:block hidden text-white">
                  Enable<p className="hidden lg:inline"> App</p>
                </p>
                <IconPlay />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppComponent
