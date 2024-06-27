import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'

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
          <div key={index} className="pt-5 w-[100%] flex flex-wrap justify-center">
            {apps.map((app, appIndex) => (
              <div
                key={appIndex}
                className="bg-zinc-600 p-5 w-[90%] h-fit flex justify-between rounded-3xl shadow-lg px-5 items-baseline"
              >
                <p className="">{app.name}</p>
                {app.enabled ? (
                  <div className="flex items-baseline">
                    <p className="text-green-500">Running on pref {app.prefIndex}</p>
                      <button
                        className="bg-amber-600 m-1 p-2 rounded-lg"
                        onClick={() => handleDisableApp(app.name)}
                      >
                        Disable
                      </button>
                      <button
                        className="bg-red-600 p-2 rounded-lg"
                        onClick={() => handleStopApp(app.name)}
                      >
                        X
                      </button>
                  </div>
                ) : (
                  <button
                    className="bg-cyan-600 p-2 rounded-lg"
                    onClick={() => handleAddAndRunApp(app.name)}
                  >
                    Run
                  </button>
                )}
              </div>
            ))}
          </div>
        ))
      ) : (
        <div className="bg-zinc-600 p-5 w-[90%] h-fit flex justify-center rounded-3xl shadow-lg px-5 align-baseline">
          <button className="bg-cyan-600 p-2 rounded-lg" onClick={() => requestAppsList()}>
            Request Apps
          </button>
        </div>
      )}
    </div>
  )
}

export default AppsList
