import { ActionIcon } from '@renderer/pages/Clients/Mapping/components/ActionIcon'
import useMappingStore from '@renderer/stores/mappingStore'
import { Action, ActionReference, SettingOption } from '@DeskThing/types'
import { useState } from 'react'
import { SingleValue } from 'react-select'
import Button from './Button'
import Select from './Select'

const ActionElement = ({
  action: actionOrRef,
  onTrigger
}: {
  action: Action | ActionReference
  onTrigger?: (val?: string) => void
}): JSX.Element => {
  const getAction = useMappingStore((state) => state.getActionFromReference)
  const runAction = useMappingStore((state) => state.executeAction)

  const action = 'version' in actionOrRef ? actionOrRef : getAction(actionOrRef)

  if (!action) return <div>Action not found</div>

  const [value, setValue] = useState<string | undefined>(action.value)

  const handleValueChange = (value: string): void => {
    setValue(value)
    action.value = value
  }
  const handleRunAction = (): void => {
    runAction(action)
    if (onTrigger) onTrigger(action.value)
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

export default ActionElement
