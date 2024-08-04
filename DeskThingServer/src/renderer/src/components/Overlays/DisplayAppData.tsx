import { AppData, App } from '@renderer/store/appStore'
import { useState, useEffect } from 'react'
import { IconX } from '../icons'

interface DisplayAppDataProps {
  appIndex: number
  setEnabled: (boolean) => void
  data?: AppData
  app?: App
}

const DisplayAppData = ({ appIndex, setEnabled, data, app }: DisplayAppDataProps): JSX.Element => {
  const [appData, setAppData] = useState(data ? data.apps[appIndex] : app)
  useEffect(() => {
    setAppData(data ? data.apps[appIndex] : app)
  }, [data, appIndex])

  const handleExit = (): void => {
    setEnabled(false)
  }
  const handlePurge = (appName: string): void => {
    window.electron.ipcRenderer.send('purge-app', appName)
    window.electron.ipcRenderer.send('get-apps')
    setEnabled(false)
  }
  return (
    <>
      {appData != null ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 animate-fade p-5 w-11/12 rounded-lg max-h-[90vh] overflow-auto drop-shadow-lg flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">
                Data From {appData.manifest ? appData.manifest.label : appData.name}
              </h2>
              <button
                onClick={handleExit}
                className="text-gray-400 border-red-600 border p-2 rounded-lg hover:text-white hover:bg-red-500 focus:outline-none"
              >
                <IconX />
              </button>
            </div>
            {appData.manifest && (
              <div className="p-5 m-1 font-geistMono rounded-lg drop-shadow-lg">
                <div className="shadow-lg m-5 border border-slate-600 flex  justify-between p-3 rounded-xl">
                  <p>Name:</p> <p>{appData.name}</p>
                </div>
                <div className="shadow-lg m-5 border border-slate-600 flex  justify-between p-3 rounded-xl">
                  <p>Enabled:</p> <p>{appData.enabled ? 'Yes' : 'No'}</p>
                </div>
                <div className="shadow-lg m-5 border border-slate-600 flex  justify-between p-3 rounded-xl">
                  <p>Pref Index:</p> <p>{appData.prefIndex}</p>
                </div>
                <div className="shadow-lg m-5 border border-slate-600 flex  justify-between p-3 rounded-xl">
                  <p>Audio Source:</p> <p>{appData.manifest.isAudioSource ? 'Yes' : 'No'}</p>
                </div>
                <div className="shadow-lg m-5 border border-slate-600 flex  justify-between p-3 rounded-xl">
                  <p>Requires:</p> <p>{appData.manifest.requires.join(', ')}</p>
                </div>
                <div className="shadow-lg m-5 border border-slate-600 flex  justify-between p-3 rounded-xl">
                  <p>Label:</p> <p>{appData.manifest.label}</p>
                </div>
                <div className="shadow-lg m-5 border border-slate-600 flex  justify-between p-3 rounded-xl">
                  <p>Version:</p> <p>{appData.manifest.version}</p>
                </div>
                <div className="shadow-lg m-5 border border-slate-600 flex  justify-between p-3 rounded-xl">
                  <p>Description:</p> <p>{appData.manifest.description}</p>
                </div>
                <div className="shadow-lg m-5 border border-slate-600 flex  justify-between p-3 rounded-xl">
                  <p>Author:</p> <p>{appData.manifest.author}</p>
                </div>
                <div className="shadow-lg m-5 border border-slate-600 flex  justify-between p-3 rounded-xl">
                  <p>Platforms:</p> <p>{appData.manifest.platforms.join(', ')}</p>
                </div>
                <div className=" shadow-lg m-5 border border-slate-600 flex  justify-between p-3 rounded-xl">
                  <p>Homepage:</p>{' '}
                  <a
                    className="hover:text-blue-500"
                    target="_blank"
                    href={appData.manifest.homepage}
                    rel="noreferrer"
                  >
                    {appData.manifest.homepage}
                  </a>
                </div>
                <div className=" shadow-lg m-5 border border-slate-600 flex  justify-between p-3 rounded-xl">
                  <p>Repository:</p>{' '}
                  <a
                    className="hover:text-blue-500"
                    target="_blank"
                    href={appData.manifest.repository}
                    rel="noreferrer"
                  >
                    {appData.manifest.repository}
                  </a>
                </div>
              </div>
            )}
            <div className="border border-slate-700 p-5 m-1 flex justify-between rounded-lg drop-shadow-lg">
              <button
                className="bg-red-700 hover:bg-red-500 transition-colors p-5 self-end rounded-lg drop-shadow-lg"
                onClick={() => handlePurge(appData.name)}
              >
                Purge App (Cannot be undone)
              </button>
              <button
                className="bg-slate-700 hover:bg-red-500 transition-colors p-5 self-end rounded-lg drop-shadow-lg"
                onClick={handleExit}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  )
}

export default DisplayAppData
