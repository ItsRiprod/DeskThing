import React from 'react'
import { App as AppType } from '@shared/types/app'
import { IconPause, IconPlay, IconWrench } from '@renderer/assets/icons'
import Button from './Button'
import { useAppStore } from '@renderer/stores'
import { useSearchParams } from 'react-router-dom'

interface AppProps {
  app: AppType
  activeRequest?: boolean
}

interface RunningProps {
  stopApp: () => void
}

const Running: React.FC<RunningProps> = ({ stopApp }) => {
  return (
    <Button className="group hover:bg-amber-500 gap-2 bg-amber-800" onClick={stopApp}>
      <p className="group-hover:block hidden">Pause</p>
      <IconPause className="stroke-2" />
    </Button>
  )
}

interface StoppedProps {
  runApp: () => void
}
const Stopped: React.FC<StoppedProps> = ({ runApp }) => {
  return (
    <Button className="group hover:bg-cyan-600 bg-cyan-800 gap-2" onClick={runApp}>
      <p className="group-hover:block hidden">Run</p>
      <IconPlay className="stroke-2" />
    </Button>
  )
}

const App: React.FC<AppProps> = ({ app, activeRequest }) => {
  const stopApp = useAppStore((appStore) => appStore.stopApp)
  const runApp = useAppStore((appStore) => appStore.runApp)
  const [searchParams, setSearchParams] = useSearchParams()

  const showAppDetails = (): void => {
    searchParams.set('app', 'true')
    searchParams.set('appId', app.name)
    setSearchParams(searchParams)
  }

  const showAppRequests = (): void => {
    searchParams.set('notifications', 'true')
    searchParams.set('page', 'request')
    setSearchParams(searchParams)
  }

  return (
    <div className="flex items-center bg-zinc-900 p-4 justify-between rounded-xl text-white">
      <div className="flex items-center">
        <div className="px-2">
          <div className="flex items-center gap-2">
            <h2 className="font-geist font-semibold">{app.manifest?.label || app.name}</h2>
            {app.manifest?.version && (
              <p className="text-xs text-gray-500 font-geistMono italic">{app.manifest.version}</p>
            )}
          </div>
          {activeRequest ? (
            <button
              className="bg-cyan-500 hover:bg-cyan-600 w-fit px-2 py-1 rounded-full text-xs"
              onClick={showAppRequests}
            >
              <p>Requesting Data</p>
            </button>
          ) : (
            <>
              <div className="font-geistMono text-xs flex w-full text-gray-300 justify-between">
                {app.manifest?.isAudioSource && <p>audiosource</p>}
                {app.manifest?.isScreenSaver && <p>screensaver</p>}
              </div>
              <p className="font-geistMono italic text-xs text-gray-500">
                Made by {app.manifest?.author || app.manifest?.author}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={showAppDetails} className="group bg-slate-950 hover:bg-slate-900 gap-2">
          <IconWrench />
          <p className="group-hover:block hidden">Settings</p>
        </Button>
        {app.running ? (
          <Running stopApp={() => stopApp(app.name)} />
        ) : (
          <Stopped runApp={() => runApp(app.name)} />
        )}
      </div>
    </div>
  )
}

export default App
