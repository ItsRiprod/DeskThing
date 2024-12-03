import Button from '@renderer/components/Button'
import Overlay from '@renderer/overlays/Overlay'
import { Action, EventMode, Key } from '@shared/types'
import { useState } from 'react'
import { ActionIcon } from './ActionIcon'
import { IconArrowRight } from '@renderer/assets/icons'

interface AddActionOverlayProps {
  pendingAction: Action
  setPendingAction: (action: Action | null) => void
  Key: Key
  mode: EventMode
  saveAction: (val: string) => void
}

const AddActionOverlay = ({
  pendingAction,
  setPendingAction,
  Key,
  saveAction,
  mode
}: AddActionOverlayProps): JSX.Element => {
  const [value, setValue] = useState<string>(pendingAction?.value || '')

  const handleValueChange = (val: string): void => {
    setValue(val)
  }

  return (
    <Overlay
      onClose={() => setPendingAction(null)}
      className="border border-gray-500 p-4 bg-zinc-900 w-5/6 h-fit flex flex-col overflow-hidden"
    >
      <div className="flex h-full flex-col gap-4 p-4">
        <h2 className="text-xl font-bold">
          Set {pendingAction?.name || pendingAction?.id} to {Key.id} {EventMode[mode]}
        </h2>
        <div className="grid grid-cols-2 gap-2 h-full">
          <div className="flex flex-col">
            <div className="flex">
              <ActionIcon action={pendingAction} />
              <div className="flex flex-col h-full justify-center">
                {pendingAction?.description && <p className="">{pendingAction.description}</p>}
                {pendingAction?.source && (
                  <p className="text-gray-500">Origin: {pendingAction.source}</p>
                )}
                {pendingAction?.tag && <p className="text-gray-500">Tag: {pendingAction.tag}</p>}
                {pendingAction?.version && (
                  <p className="text-gray-500">Version: {pendingAction.version}</p>
                )}
                {pendingAction?.version_code && (
                  <p className="text-gray-500">Version: {pendingAction.version_code}</p>
                )}
                {pendingAction?.icon && <p className="text-gray-500">Icon: {pendingAction.icon}</p>}
              </div>
            </div>
            <div></div>
          </div>
          <div className="flex gap-3 items-center justify-center flex-col border-l">
            {pendingAction?.value_instructions && (
              <p className="text-sm">{pendingAction.value_instructions}</p>
            )}
            {pendingAction?.value_options ? (
              <select
                className="p-2 border rounded text-black"
                onChange={(e) => handleValueChange(e.target.value)}
                defaultValue={pendingAction.value}
              >
                <option value="" disabled>
                  Select a value
                </option>
                {pendingAction.value_options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="p-2 border rounded text-black"
                placeholder="Enter value"
                value={value}
                onChange={(e) => handleValueChange(e.target.value)}
              />
            )}
            <Button className="bg-cyan-700 hover:bg-cyan-500" onClick={() => saveAction(value)}>
              <p>Set Map</p>
              <IconArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </Overlay>
  )
}

export default AddActionOverlay
