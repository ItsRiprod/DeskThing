import React, { useState } from 'react'
import { App as AppType } from '@shared/types/app'
import { IconPause, IconPlay, IconWrench } from '@renderer/assets/icons'
import Button from './Button'
import { useAppStore } from '@renderer/stores'
import AppSettingsOverlay from '@renderer/overlays/AppSettingsOverlay'

interface AppProps {
  app: AppType
}

interface RunningProps {
  stopApp: () => void
}

const Running: React.FC<RunningProps> = ({ stopApp }) => {
  return (
    <Button className="group border-amber-500 border-2 hover:bg-amber-500" onClick={stopApp}>
      <p className="group-hover:block hidden">Pause</p>
      <IconPause />
    </Button>
  )
}

interface StoppedProps {
  runApp: () => void
}
const Stopped: React.FC<StoppedProps> = ({ runApp }) => {
  return (
    <Button className="group border-cyan-500 border-2 hover:bg-cyan-500" onClick={runApp}>
      <p className="group-hover:block hidden">Run</p>
      <IconPlay />
    </Button>
  )
}

const App: React.FC<AppProps> = ({ app }) => {
  const stopApp = useAppStore((appStore) => appStore.stopApp)
  const runApp = useAppStore((appStore) => appStore.runApp)
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="flex items-center border-gray-500 p-1 justify-between border rounded-xl text-white">
      {showDetails && <AppSettingsOverlay app={app} onClose={() => setShowDetails(false)} />}
      <div className="flex items-center">
        <Button
          onClick={() => setShowDetails(true)}
          className="border-gray-500 border-2 hover:bg-gray-500"
        >
          <IconWrench />
        </Button>
        <div className="px-2">
          <div className="flex items-center gap-2">
            <h2 className="font-geist font-semibold">{app.manifest?.label || app.name}</h2>
            {app.manifest?.version && (
              <p className="text-xs text-gray-500 font-geistMono italic">{app.manifest.version}</p>
            )}
          </div>
          <div className="font-geistMono text-xs flex w-full text-gray-300 justify-between">
            {app.manifest?.isAudioSource && <p>audiosource</p>}
            {app.manifest?.isScreenSaver && <p>screensaver</p>}
          </div>
          <p className="font-geistMono italic text-xs text-gray-500">
            Made by {app.manifest?.author || app.manifest?.author}
          </p>
        </div>
      </div>
      {app.running ? (
        <Running stopApp={() => stopApp(app.name)} />
      ) : (
        <Stopped runApp={() => runApp(app.name)} />
      )}
    </div>
  )
}

export default App
