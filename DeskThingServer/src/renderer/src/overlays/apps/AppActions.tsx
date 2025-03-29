import React, { useEffect, useState } from 'react'
import { AppSettingProps } from './AppsOverlay'
import Button from '@renderer/components/Button'
import { IconPlay, IconStop, IconTrash, IconX } from '@renderer/assets/icons'
import useMappingStore from '@renderer/stores/mappingStore'
import { Action } from '@DeskThing/types'
import ActionElement from '@renderer/components/ActionElement'
import { useAppStore } from '@renderer/stores'

const AppActions: React.FC<AppSettingProps> = ({ app }: AppSettingProps) => {
  const actions = useMappingStore((state) => state.actions)
  const fetchActions = useMappingStore((state) => state.getActions)
  const { purgeApp, enableApp, disableApp, runApp, stopApp } = useAppStore((state) => state)

  const [availableActions, setAvailableActions] = useState<Action[]>([])

  useEffect(() => {
    setAvailableActions(actions.filter((action) => action.source === app.name))
  }, [actions])

  useEffect(() => {
    fetchActions()
  }, [])

  const handlePurge = async (): Promise<void> => {
    await purgeApp(app.name)
  }

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <div className="flex w-full gap-5">
        <Button
          onClick={handlePurge}
          className="justify-center gap-2 hover:bg-red-500 border-red-500 border w-full"
        >
          <IconTrash className="stroke-2" />
          <p>Uninstall</p>
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
      <div className="flex flex-wrap gap-2 mt-4 justify-start">
        {availableActions.map((action) => (
          <ActionElement key={action.id} action={action} />
        ))}
      </div>
    </div>
  )
}

export default AppActions
