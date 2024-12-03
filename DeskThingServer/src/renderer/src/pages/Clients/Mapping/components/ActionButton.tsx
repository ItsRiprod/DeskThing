import Button from '@renderer/components/Button'
import { ButtonMapping, Action, EventMode, Key } from '@shared/types'
import { FC, memo } from 'react'
import { ActionIcon } from './ActionIcon'

interface ActionButtonProps {
  selectedKey: Key | undefined
  currentMapping: ButtonMapping
  action: Action
  setAction: (action: Action) => void
  mode: EventMode
}

const ActionButton: FC<ActionButtonProps> = memo(
  ({ selectedKey, currentMapping, action, setAction, mode }: ActionButtonProps) => {
    const isSelected = selectedKey && currentMapping.mapping[selectedKey.id][mode]?.id === action.id

    return (
      <Button
        key={action.id}
        className={`border gap-2 text-nowrap border-gray-700 h-fit ${isSelected ? 'bg-zinc-900' : ''}`}
        onClick={() => setAction(action)}
      >
        <ActionIcon action={action} />
        <p>{action.name}</p>
      </Button>
    )
  }
)

ActionButton.displayName = 'ActionButton'

export default ActionButton
