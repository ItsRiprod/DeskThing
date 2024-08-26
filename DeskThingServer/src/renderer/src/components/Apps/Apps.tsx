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
  const [tooltips, setTooltips] = useState<string[]>([])
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
    <div className="h-svh w-[100%] flex flex-col justify-between items-center">
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
          <div className="pt-5 w-full flex xl:flex-row xl:flex-wrap flex-col items-center gap-2">
            {(appsList.apps as App[]).map((app, appIndex) => (
              <div
                key={appIndex}
                className="border-2 border-zinc-400 p-5 w-11/12 md:w-11/12 xl:w-fit h-fit flex justify-between rounded-3xl shadow-lg px-5 items-center"
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
                {appsWithActiveRequests.includes(app.name) ? (
                  <div className="flex items-center md:flex-row flex-col">
                    {tooltips[appIndex] ? (
                      <p>{tooltips[appIndex]}</p>
                    ) : (
                      <p className="text-blue-300">Data Request</p>
                    )}
                    <button
                      className="border-2 border-blue-600 hover:bg-blue-500 m-1 p-2 rounded-lg"
                      onClick={() => handleRequestTrigger(app.name)}
                      onMouseEnter={() =>
                        setTooltips((prevTooltips) => ({
                          ...prevTooltips,
                          [appIndex]: 'Handle Request'
                        }))
                      }
                      onMouseLeave={() =>
                        setTooltips((prevTooltips) => ({
                          ...prevTooltips,
                          [appIndex]: ''
                        }))
                      }
                    >
                      <IconPulsing />
                    </button>
                    <button
                      className="border-2 border-red-600 hover:bg-red-500 p-2 rounded-lg"
                      onClick={() => handleDisableApp(app.name)}
                      onMouseEnter={() =>
                        setTooltips((prevTooltips) => ({
                          ...prevTooltips,
                          [appIndex]: 'Disable App'
                        }))
                      }
                      onMouseLeave={() =>
                        setTooltips((prevTooltips) => ({
                          ...prevTooltips,
                          [appIndex]: ''
                        }))
                      }
                    >
                      <IconX />
                    </button>
                  </div>
                ) : app.enabled ? (
                  <div className="flex items-center md:flex-row flex-col">
                    <div className="flex-col flex font-geistMono items-end pr-2">
                      {tooltips[appIndex] ? (
                        <p className="text-white">{tooltips[appIndex]}</p>
                      ) : app.running ? (
                        <p className="text-green-500">Running</p>
                      ) : (
                        <p className="text-red-600">Stopped</p>
                      )}
                    </div>
                    {app.running ? (
                      <button
                        className="border-2 border-amber-600 hover:bg-amber-500 m-1 p-2 rounded-lg"
                        onClick={() => handleStopApp(app.name)}
                        onMouseEnter={() =>
                          setTooltips((prevTooltips) => ({
                            ...prevTooltips,
                            [appIndex]: 'Pause App'
                          }))
                        }
                        onMouseLeave={() =>
                          setTooltips((prevTooltips) => ({
                            ...prevTooltips,
                            [appIndex]: ''
                          }))
                        }
                      >
                        <IconPause />
                      </button>
                    ) : (
                      <button
                        className="border-2 border-cyan-600 hover:bg-cyan-500 m-1 p-2 rounded-lg"
                        onClick={() => handleAddAndRunApp(app.name)}
                        onMouseEnter={() =>
                          setTooltips((prevTooltips) => ({
                            ...prevTooltips,
                            [appIndex]: 'Run App'
                          }))
                        }
                        onMouseLeave={() =>
                          setTooltips((prevTooltips) => ({
                            ...prevTooltips,
                            [appIndex]: ''
                          }))
                        }
                      >
                        <IconPlay />
                      </button>
                    )}
                    <button
                      className="border-2 border-red-600 hover:bg-red-500 p-2 rounded-lg"
                      onClick={() => handleDisableApp(app.name)}
                      onMouseEnter={() =>
                        setTooltips((prevTooltips) => ({
                          ...prevTooltips,
                          [appIndex]: 'Disable App'
                        }))
                      }
                      onMouseLeave={() =>
                        setTooltips((prevTooltips) => ({
                          ...prevTooltips,
                          [appIndex]: ''
                        }))
                      }
                    >
                      <IconX />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center md:flex-row flex-col">
                    {tooltips[appIndex] ? (
                      <p>{tooltips[appIndex]}</p>
                    ) : (
                      <p className="text-zinc-600">Disabled</p>
                    )}
                    <button
                      className="border-2 border-cyan-600 hover:bg-cyan-500 m-1 p-2 rounded-lg"
                      onClick={() => handleAddAndRunApp(app.name)}
                      onMouseEnter={() =>
                        setTooltips((prevTooltips) => ({
                          ...prevTooltips,
                          [appIndex]: 'Enable App'
                        }))
                      }
                      onMouseLeave={() =>
                        setTooltips((prevTooltips) => ({
                          ...prevTooltips,
                          [appIndex]: ''
                        }))
                      }
                    >
                      <IconPlay />
                    </button>
                    <button
                      onClick={() => handleDetails(appIndex)}
                      className="border-2 top-10 border-green-600 hover:bg-green-500  p-2 rounded-lg"
                      onMouseEnter={() =>
                        setTooltips((prevTooltips) => ({
                          ...prevTooltips,
                          [appIndex]: 'App Details'
                        }))
                      }
                      onMouseLeave={() =>
                        setTooltips((prevTooltips) => ({
                          ...prevTooltips,
                          [appIndex]: ''
                        }))
                      }
                    >
                      <IconDetails iconSize={24} />
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
    </div>
  )
}

export default Apps
