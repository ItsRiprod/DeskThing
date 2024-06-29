import { useEffect } from 'react'
import { useAppStore, App } from '../store/appStore'
import { IconRefresh, IconX, IconPause, IconPlay } from '../components/icons'

const AppsList = (): JSX.Element => {
  const { appsList } = useAppStore()

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
  const requestAppsList = (): void => window.electron.ipcRenderer.send('get-apps')

  useEffect(() => {
    console.log('apps list in AppsList: ', appsList)
  }, [appsList])

  return (
    <div className="pt-5 w-[100%] h-svh flex justify-center">
      {Object.keys(appsList).length > 0 ? (
        Object.entries(appsList).map(([appName, apps], index) => (
          <div
            key={index}
            className="pt-5 w-[100%] flex 2xl:flex-row 2xl:flex-wrap flex-col items-center gap-2"
          >
            <div className="p-5 w-[90%] h-fit flex justify-end rounded-3xl shadow-lg px-5 align-baseline">
              <button
                className="border-2 absolute top-10 border-cyan-600 hover:bg-cyan-500  p-2 rounded-lg"
                onClick={() => requestAppsList()}
              >
                <IconRefresh iconSize={24} />
              </button>
            </div>
            {(apps as App[]).map((app, appIndex) => (
              <div
                key={appIndex}
                className="border-2 border-zinc-200 p-5 w-52 md:w-11/12 2xl:w-96 h-fit flex justify-between rounded-3xl shadow-lg px-5 items-baseline"
              >
                <p className={appName}>{app.name}</p>
                {app.enabled ? (
                  <div className="flex items-baseline md:flex-row flex-col">
                    <p className="text-green-500">Preference {app.prefIndex}</p>
                    <button
                      className="border-2 border-amber-600 hover:bg-amber-500 m-1 p-2 rounded-lg"
                      onClick={() => handleDisableApp(app.name)}
                    >
                      <IconPause />
                    </button>
                    <button
                      className="border-2 border-red-600 hover:bg-red-500 p-2 rounded-lg"
                      onClick={() => handleStopApp(app.name)}
                    >
                      <IconX />
                    </button>
                  </div>
                ) : (
                  <button
                    className="border-2 border-cyan-600 hover:bg-cyan-500 p-2 rounded-lg"
                    onClick={() => handleAddAndRunApp(app.name)}
                  >
                    <IconPlay />
                  </button>
                )}
              </div>
            ))}
          </div>
        ))
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
  )
}

export default AppsList
