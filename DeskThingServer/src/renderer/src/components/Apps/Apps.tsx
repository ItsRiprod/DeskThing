import { useEffect, useState } from 'react'
import { useAppStore, App } from '../../store/appStore'
import { IconX, IconPause, IconPlay, IconDetails, IconPulsing, IconLogoGear } from '../icons'
import DisplayAppData from '../Overlays/DisplayAppData'
import RequestStoreInstance, { Request } from '../../store/requestStore'
import AppRequestOverlay from '../Overlays/AppRequest'
import AppSettingsOverlay from '../Overlays/AppSettingsOverlay'

export type View = 'apps' | 'local' | 'web'

const Apps = (): JSX.Element => {
  const { appsList } = useAppStore()
  const [enabled, setEnabled] = useState(false)
  const [sEnabled, setSEnabled] = useState(false)
  const [appIndex, setAppIndex] = useState(-1)
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
    console.log('apps list in AppsList: ', appsList)

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
  }, [appsList])

  useEffect(() => {
    requestAppsList()
  }, [])

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
        {enabled && <DisplayAppData appIndex={appIndex} setEnabled={setEnabled} data={appsList} />}
        {sEnabled && (
          <AppSettingsOverlay appIndex={appIndex} setEnabled={setSEnabled} data={appsList} />
        )}
        {appsList?.apps?.length > 0 && Object.keys(appsList.apps).length > 0 ? (
          <div className="pt-5 w-full flex xl:flex-row xl:flex-wrap xl:gap-5 xl:px-5 flex-col items-center gap-2">
            {(appsList.apps as App[]).map((app, appIndex) => (
              <div
                key={appIndex}
                className="border-2 border-zinc-400 p-5 w-11/12 md:w-11/12 xl:w-fit xl:gap-5 h-fit flex justify-between rounded-3xl shadow-lg px-5 items-center"
              >
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
                    <p className="lg:text-nowrap">{app.manifest ? app.manifest.label : app.name}</p>
                    <p className="text-zinc-400 text-xs font-geistMono">{app.manifest?.version}</p>
                  </div>
                </div>
                <div className="flex md:items-center items-end justify-end md:flex-row flex-col xl:w-96">
                  <div className="flex-col flex font-geistMono items-end pr-2">
                    {app.running ? (
                      <p className="text-green-500">Running</p>
                    ) : app.enabled ? (
                      <p className="text-red-600">Stopped</p>
                    ) : (
                      <p className="text-zinc-600 pr-2">Disabled</p>
                    )}
                  </div>
                  {appsWithActiveRequests.includes(app.name) && (
                    <div className="flex items-center md:flex-row flex-col">
                      <button
                        className="group flex border-2 gap-3 border-blue-600 hover:bg-blue-500 m-1 p-2 rounded-lg"
                        onClick={() => handleRequestTrigger(app.name)}
                      >
                        <p className="group-hover:block hidden text-white">
                          Handle<p className="hidden lg:inline"> Request</p>
                        </p>
                        <IconPulsing />
                      </button>
                    </div>
                  )}
                  {app.enabled ? (
                    <>
                      {app.running ? (
                        <button
                          className="group flex gap-3 border-2 border-amber-600 hover:bg-amber-500 mx-1 p-2 rounded-lg"
                          onClick={() => handleStopApp(app.name)}
                        >
                          <p className="group-hover:block hidden text-white">
                            Pause<p className="hidden lg:inline"> App</p>
                          </p>
                          <IconPause />
                        </button>
                      ) : (
                        <button
                          className="gap-3 flex group border-2 border-cyan-600 hover:bg-cyan-500 mx-1 p-2 rounded-lg"
                          onClick={() => handleAddAndRunApp(app.name)}
                        >
                          <p className="group-hover:block hidden text-white">
                            Run<p className="hidden lg:inline"> App</p>
                          </p>
                          <IconPlay />
                        </button>
                      )}
                      <button
                        className="flex gap-3 group border-2 border-red-600 hover:bg-red-500 mx-1 p-2 rounded-lg"
                        onClick={() => handleDisableApp(app.name)}
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
                      onClick={() => handleAddAndRunApp(app.name)}
                    >
                      <p className="group-hover:block hidden text-white">
                        Enable<p className="hidden lg:inline"> App</p>
                      </p>
                      <IconPlay />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-zinc-200 p-5 w-[90%] h-fit flex flex-col items-center gap-5 justify-center rounded-3xl shadow-lg px-5 align-baseline">
            <button
              className="border-2 border-cyan-600 hover:bg-cyan-500 bg-cyan-600  p-2 rounded-lg"
              onClick={() => requestAppsList()}
            >
              Refresh Apps List
            </button>
            <p className="italic text-gray-500">Are any downloaded?</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Apps
