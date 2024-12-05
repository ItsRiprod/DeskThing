import Button from '@renderer/components/Button'
import { Action, EventMode, Key, SettingOption } from '@shared/types'
import { useEffect, useState } from 'react'
import { ActionIcon } from './ActionIcon'
import { IconArrowRight, IconArrowUp } from '@renderer/assets/icons'
import Select from '@renderer/components/Select'
import { SingleValue } from 'react-select'

interface AddActionPopupProps {
  pendingAction: Action
  Key: Key
  mode: EventMode
  updateAction: (val: string) => void
}

const AddActionPopup = ({ pendingAction, updateAction }: AddActionPopupProps): JSX.Element => {
  const [value, setValue] = useState<string>(pendingAction?.value || '')
  const [expanded, setIsExpanded] = useState(false)
  const [visible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleUpdateAction = (): void => {
    setIsVisible(false)
    setTimeout(() => {
      updateAction(value)
    }, 500)
  }

  const handleValueChange = (val: string): void => {
    setValue(val)
  }

  return (
    <div
      className={`${visible ? 'max-h-48 py-1' : 'max-h-0 overflow-hidden'} transition-[max-height,padding] h-fit w-full border border-gray-500 px-2 bg-zinc-900 flex flex-col`}
    >
      <div className="min-w-96 flex h-full flex-col">
        <div className="items-center flex justify-between">
          <div className="flex w-full gap-2 justify-start items-center">
            <div>
              <ActionIcon action={pendingAction} />
            </div>
            <h2 className="text-md sm:block hidden text-nowrap font-bold">
              {pendingAction?.name || pendingAction?.id}
            </h2>
            <h2 className="text-md sm:hidden text-nowrap font-bold">{pendingAction?.id}</h2>
          </div>
          <div className="flex w-full items-center justify-end gap-2 mx-2">
            <Button onClick={() => setIsExpanded(!expanded)}>
              <IconArrowUp className={`${expanded ? 'rotate-180' : ''}`} />
            </Button>
            {pendingAction?.value_options ? (
              <Select
                options={pendingAction.value_options.map((option) => ({
                  label: option,
                  value: option
                }))}
                menuPlacement="auto"
                placeholder={pendingAction.value ?? ''}
                value={value || pendingAction.value || ''}
                onChange={(selected) => {
                  const selectedValue = selected as SingleValue<SettingOption>
                  handleValueChange(selectedValue?.value || '')
                }}
              />
            ) : (
              pendingAction?.value_instructions && (
                <input
                  type="text"
                  className="p-2 border rounded text-black"
                  placeholder="Enter value"
                  value={value}
                  onChange={(e) => handleValueChange(e.target.value)}
                />
              )
            )}
            {(pendingAction?.value_instructions || pendingAction?.value_options) && (
              <Button
                style={{ padding: '6px 5px' }}
                className="bg-zinc-700 hover:bg-zinc-500"
                onClick={handleUpdateAction}
              >
                <p className="text-nowrap hidden md:block">Set Value</p>
                <IconArrowRight />
              </Button>
            )}
          </div>
        </div>
        <div className={`${expanded ? 'h-12' : 'h-0'} transition-[height] overflow-hidden`}>
          <div className="flex h-full">
            <div className="h-full w-full justify-center">
              {pendingAction?.description && <p className="">{pendingAction.description}</p>}
              <div className="flex w-full justify-start gap-5">
                {pendingAction?.source && (
                  <p className="text-gray-500">Origin: {pendingAction.source}</p>
                )}
                {pendingAction?.version && (
                  <p className="text-gray-500">Version: {pendingAction.version}</p>
                )}
                {pendingAction?.icon && <p className="text-gray-500">Icon: {pendingAction.icon}</p>}
              </div>
            </div>
            {pendingAction?.value_instructions && (
              <p className="text-sm w-full h-full flex items-center justify-center text-wrap px-2">
                {pendingAction.value_instructions}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddActionPopup
