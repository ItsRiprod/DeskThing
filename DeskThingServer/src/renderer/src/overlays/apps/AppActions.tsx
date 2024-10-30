import React from 'react'
import { AppSettingProps } from './AppsOverlay'
import Button from '@renderer/components/Button'
import { IconPlay, IconStop, IconTrash, IconX } from '@renderer/assets/icons'
import { useAppStore } from '@renderer/stores'

const AppActions: React.FC<AppSettingProps> = ({ app }: AppSettingProps) => {
  const stopApp = useAppStore((state) => state.stopApp)
  const runApp = useAppStore((state) => state.runApp)
  const disableApp = useAppStore((state) => state.disableApp)
  const enableApp = useAppStore((state) => state.enableApp)

  const handlePurge = (): void => {
    window.electron.purgeApp(app.name)
  }

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <div className="flex w-full gap-5">
        <Button
          onClick={handlePurge}
          className="justify-center gap-2 hover:bg-red-500 border-red-500 border w-full"
        >
          <IconTrash className="stroke-2" />
          <p>Purge</p>
        </Button>

        {app.enabled ? (
          <Button
            onClick={() => disableApp(app.name)}
            className="justify-center gap-2 hover:bg-red-500 border-red-500 border w-full"
          >
            <IconStop className="stroke-2" />
            <p>Disable</p>
          </Button>
        ) : (
          <Button
            onClick={() => enableApp(app.name)}
            className="justify-center gap-2 border hover:bg-green-500 border-green-500 w-full"
          >
            <IconPlay className="stroke-2" />
            <p>Enable</p>
          </Button>
        )}
        {app.running ? (
          <Button
            onClick={() => stopApp(app.name)}
            className="justify-center gap-2 hover:bg-red-500 border-red-500 border w-full"
          >
            <IconX className="stroke-2" />
            <p>Stop</p>
          </Button>
        ) : (
          <Button
            onClick={() => runApp(app.name)}
            className={`justify-center gap-2 border ${app.enabled ? 'hover:bg-cyan-500 border-cyan-500' : 'hover:bg-cyan-950 border-cyan-900'} w-full`}
            disabled={!app.enabled}
          >
            <IconPlay className="stroke-2" />
            <p>Run</p>
          </Button>
        )}
      </div>
      <div className="text-xs text-gray-500 font-geistMono mt-4">
        <h1>
          {app.manifest?.label || app.name} is {app.running ? 'running' : 'not running'}
        </h1>
        <h1>App will {app.enabled ? 'Start Automatically' : 'Not Start Automatically'}</h1>
      </div>
    </div>
  )
}

export default AppActions
