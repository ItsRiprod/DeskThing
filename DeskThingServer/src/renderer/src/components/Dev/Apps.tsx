import { useEffect, useState } from 'react'
import { useAppStore, App } from '../../store/appStore'
import { IconX, IconPause, IconPlay, IconDetails, IconPulsing } from '../icons'
import DisplayAppData from '../Overlays/DisplayAppData'
import RequestStoreInstance, { Request } from '../../store/requestStore'

export type View = 'apps' | 'local' | 'web'

const Apps = (): JSX.Element => {
  const { appsList } = useAppStore()
  const [app, setApp] = useState<App>()
  const [tooltips, setTooltips] = useState<string[]>([])
  const [enabled, setEnabled] = useState(false)
  const [appIndex, setAppIndex] = useState(-1)
  const [appsWithActiveRequests, setAppsWithActiveRequests] = useState<string[]>([])
  const [path, setPath] = useState('')

  const handleAddAndRunApp = (appName: string): void => {
    window.electron.ipcRenderer.send('add-app', appName)
    requestAppsList()
  }
  const handleAddDevApp = (appPath: string): void => {
    window.electron.ipcRenderer.send('dev-add-app', appPath)
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
    if (appsList?.apps?.length > 0) {
      const developerApp = appsList.apps.find((app) => app.name === 'developer-app')
      setApp(developerApp)
    }
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
    RequestStoreInstance.triggerRequestDisplay(appName)
  }

  return (
    <div className="h-svh w-[100%] flex flex-col justify-between items-center">
      <div className="pt-5 w-full flex justify-center">
        {enabled && <DisplayAppData appIndex={appIndex} setEnabled={setEnabled} app={app} />}
        <div className="pt-5 w-full flex 2xl:flex-row 2xl:flex-wrap flex-col items-center gap-2">
          <p className="italic text-red-700 font-geistMono">
            Do not use unless you know what you&apos;re doing
          </p>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Enter Absolute File Path"
              value={path || ''}
              onChange={(e) => setPath(e.target.value)}
              className="border-2 border-gray-300 p-2 rounded-lg text-black"
            />
            <button
              className="border-2 border-cyan-600 hover:bg-cyan-500 m-1 p-2 rounded-lg"
              onClick={() => handleAddDevApp(path)}
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
          </div>
          <div className="border-2 border-zinc-400 p-5 w-11/12 md:w-11/12 2xl:w-96 h-fit flex justify-between rounded-3xl shadow-lg px-5 items-center">
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <button onClick={() => handleDetails(appIndex)} className="hover:text-slate-600">
                <IconDetails />
              </button>
              <p>{app ? (app.manifest ? app.manifest.label : app.name) : 'Unknown'}</p>
              <p className="text-zinc-400 text-xs">{app ? app.manifest?.version : 'unknown'}</p>
            </div>
            {app && appsWithActiveRequests.includes(app.name) ? (
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
              </div>
            ) : app && app.enabled ? (
              <div className="flex items-center md:flex-row flex-col">
                <div className="flex-col flex items-end">
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
                  className={` border-2 border-cyan-600 ${app ? 'hover:bg-cyan-500' : 'hover:bg-cyan-950'} m-1 p-2 rounded-lg`}
                  onClick={() => app && handleAddAndRunApp(app.name)}
                  disabled={app ? false : true}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Apps
