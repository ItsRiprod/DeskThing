import React, { useEffect, useState } from 'react'
import { AppSettingProps } from './AppsOverlay'
import Button from '@renderer/components/Button'
import { IconPlay, IconStop, IconTrash, IconX } from '@renderer/assets/icons'
import { useAppStore } from '@renderer/stores'
import useMappingStore from '@renderer/stores/mappingStore'
import { Action, SettingOption } from '@shared/types'
import { ActionIcon } from '@renderer/pages/Clients/Mapping/components/ActionIcon'
import Select from '@renderer/components/Select'
import { SingleValue } from 'react-select'

const AppActions: React.FC<AppSettingProps> = ({ app }: AppSettingProps) => {
  const stopApp = useAppStore((state) => state.stopApp)
  const runApp = useAppStore((state) => state.runApp)
  const disableApp = useAppStore((state) => state.disableApp)
  const enableApp = useAppStore((state) => state.enableApp)
  const actions = useMappingStore((state) => state.actions)
  const fetchActions = useMappingStore((state) => state.getActions)

  const [availableActions, setAvailableActions] = useState<Action[]>([])

  useEffect(() => {
    setAvailableActions(actions.filter((action) => action.source === app.name))
  }, [actions])

  useEffect(() => {
    fetchActions()
  }, [])

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

const ActionElement = ({ action }: { action: Action }): JSX.Element => {
  const runAction = useMappingStore((state) => state.executeAction)
  const [value, setValue] = useState<string | undefined>(action.value)

  const handleValueChange = (value: string): void => {
    setValue(value)
    action.value = value
  }
  const handleRunAction = (): void => {
    runAction(action)
  }

  return (
    <div className="flex gap-2 border-cyan-500 border rounded-md">
      <Button
        disabled={!action.enabled}
        onClick={handleRunAction}
        className="justify-center items-center hover:bg-cyan-500"
      >
        <ActionIcon action={action} className="stroke-2" />
        <p>{action.name || action.id}</p>
      </Button>
      {action?.value_options && action.value_options.length > 0 ? (
        <Select
          options={action.value_options.map((option) => ({
            label: option,
            value: option
          }))}
          menuPlacement="auto"
          placeholder={action.value ?? ''}
          value={value || action.value || ''}
          onChange={(selected) => {
            const selectedValue = selected as SingleValue<SettingOption>
            handleValueChange(selectedValue?.value || '')
          }}
        />
      ) : action?.value_instructions ? (
        <input
          type="text"
          className="p-2 border rounded text-black"
          placeholder="Enter value"
          value={value}
          onChange={(e) => handleValueChange(e.target.value)}
        />
      ) : null}
    </div>
  )
}

export default AppActions
