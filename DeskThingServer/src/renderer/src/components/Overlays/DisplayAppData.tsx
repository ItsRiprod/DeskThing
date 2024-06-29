import { App, AppData } from '@renderer/store'
import { useState, useEffect } from 'react'

interface params {
  appName: number
  enabled: boolean
  data: AppData
}

const DisplayAppData: React.FC<params> = ({ appIndex = 0, enabled = false, data }): JSX.Element => {
  const [appData, setAppData] = useState(data.apps[appIndex])
  const [display, setDisplay] = useState(enabled)
  useEffect(() => {
    setAppData(data.apps[appIndex])
    setDisplay(enabled)
  }, [data, enabled])
  useEffect(() => {
    console.log(display)
    console.log(appData)
    console.log(data)
  }, [display, appData])

  const handleExit = (): void => {
    setDisplay(false)
  }
  return (
    <>
      {display && appData != null ? (
        <div className="pointer-events-auto absolute w-full left-0">
          <div className="bg-slate-600 animate-fade p-5 rounded-lg max-h-[95vh] overflow-auto drop-shadow-lg flex flex-col">
            <h1 className="shadow-lg m-5 bg-slate-700 p-3 rounded-xl">
              Data From {appData.manifest ? appData.manifest.label : appName}
            </h1>
            {appData.enabled}
            {appData.prefIndex}
            {appData.manifest.isAudioSource}
            {appData.manifest.requires}
            {appData.manifest.label}
            {appData.manifest.version}
            {appData.manifest.description}
            {appData.manifest.author}
            {appData.manifest.platforms}
            {appData.manifest.homepage}
            {appData.manifest.repository}
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
