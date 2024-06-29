import { App, AppData } from '@renderer/store'
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
          <div className="bg-slate-600 animate-fade p-5 w-11/12 rounded-lg max-h-[95vh] overflow-auto drop-shadow-lg flex flex-col">
            <h1 className="shadow-lg m-5 bg-slate-700 p-3 rounded-xl">
              Data From {appData.manifest ? appData.manifest.label : appName}
            </h1>
            <div>Enabled: {appData.enabled ? 'Yes' : 'No'}</div>
            <div>Pref Index: {appData.prefIndex}</div>
            <div>Audio Source: {appData.manifest.isAudioSource ? 'Yes' : 'No'}</div>
            <div>Requires: {appData.manifest.requires.join(', ')}</div>
            <div>Label: {appData.manifest.label}</div>
            <div>Version: {appData.manifest.version}</div>
            <div>Description: {appData.manifest.description}</div>
            <div>Author: {appData.manifest.author}</div>
            <div>Platforms: {appData.manifest.platforms.join(', ')}</div>
            <div>Homepage: {appData.manifest.homepage}</div>
            <div>Repository: {appData.manifest.repository}</div>
            <div className="bg-slate-700 p-5 m-1 rounded-lg drop-shadow-lg"></div>

            <button
              className="bg-slate-700 hover:bg-slate-500 transition-colors p-5 self-end rounded-lg drop-shadow-lg"
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
