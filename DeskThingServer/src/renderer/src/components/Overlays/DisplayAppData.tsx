import { AppData } from '@renderer/store'
import { useState, useEffect } from 'react'

interface DisplayAppDataProps {
  appIndex: number
  setEnabled: (boolean) => void
  data: AppData
}

const DisplayAppData = ({ appIndex, setEnabled, data }: DisplayAppDataProps): JSX.Element => {
  const [appData, setAppData] = useState(data.apps[appIndex])
  useEffect(() => {
    setAppData(data.apps[appIndex])
  }, [data, appIndex])

  const handleExit = (): void => {
    setEnabled(false)
  }
  return (
    <>
      {appData != null ? (
        <div className="pointer-events-auto fixed w-screen flex justify-around left-0 z-10">
          <div className="bg-slate-600 animate-fade p-5 w-11/12 rounded-lg max-h-[90vh] overflow-auto drop-shadow-lg flex flex-col">
            <h1 className="shadow-lg m-5 bg-slate-700 p-3 rounded-xl">
              Data From {appData.manifest ? appData.manifest.label : appData.name}
            </h1>
            {appData.manifest && (
              <div className="bg-slate-500 p-5 m-1 rounded-lg drop-shadow-lg">
                <div className="shadow-lg m-5 bg-slate-600 p-3 rounded-xl">
                  <p>Enabled:</p> {appData.enabled ? 'Yes' : 'No'}
                </div>
                <div className="shadow-lg m-5 bg-slate-600 p-3 rounded-xl">
                  <p>Pref Index:</p> {appData.prefIndex}
                </div>
                <div className="shadow-lg m-5 bg-slate-600 p-3 rounded-xl">
                  <p>Audio Source:</p> {appData.manifest.isAudioSource ? 'Yes' : 'No'}
                </div>
                <div className="shadow-lg m-5 bg-slate-600 p-3 rounded-xl">
                  <p>Requires:</p> {appData.manifest.requires.join(', ')}
                </div>
                <div className="shadow-lg m-5 bg-slate-600 p-3 rounded-xl">
                  <p>Label:</p> {appData.manifest.label}
                </div>
                <div className="shadow-lg m-5 bg-slate-600 p-3 rounded-xl">
                  <p>Version:</p> {appData.manifest.version}
                </div>
                <div className="shadow-lg m-5 bg-slate-600 p-3 rounded-xl">
                  <p>Description:</p> {appData.manifest.description}
                </div>
                <div className="shadow-lg m-5 bg-slate-600 p-3 rounded-xl">
                  <p>Author:</p> {appData.manifest.author}
                </div>
                <div className="shadow-lg m-5 bg-slate-600 p-3 rounded-xl">
                  <p>Platforms:</p> {appData.manifest.platforms.join(', ')}
                </div>
                <div className="shadow-lg m-5 bg-slate-600 p-3 rounded-xl">
                  <p>Homepage:</p> {appData.manifest.homepage}
                </div>
                <div className="shadow-lg m-5 bg-slate-600 p-3 rounded-xl">
                  <p>Repository:</p> {appData.manifest.repository}
                </div>
              </div>
            )}
            <div className="bg-slate-700 p-5 m-1 rounded-lg drop-shadow-lg"></div>

            <button
              className="bg-slate-700 hover:bg-red-500 transition-colors p-5 self-end rounded-lg drop-shadow-lg"
              onClick={handleExit}
            >
              Exit
            </button>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  )
}

export default DisplayAppData
