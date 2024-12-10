import { IconLayoutgrid } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import useMappingStore from '@renderer/stores/mappingStore'
import { ActionReference, ButtonMapping, EventMode, Key } from '@shared/types'
import { useState, useEffect, FC } from 'react'

interface AvailableKeysProps {
  KeyList: string[]
  setSelectedKey: (mode: Key) => void
  currentKey: Key | undefined
  currentMapping: ButtonMapping
  mode: EventMode
}

const AvailableKeys: React.FC<AvailableKeysProps> = ({
  currentKey,
  KeyList,
  setSelectedKey,
  currentMapping,
  mode
}: AvailableKeysProps) => {
  const keys = useMappingStore((state) => state.keys)
  const [availableKeys, setAvailableKeys] = useState<Key[]>(keys)
  const [actionsExpanded, setActionsExpanded] = useState(false)

  const handleModeClick = (key: Key): void => {
    setSelectedKey(key)
  }

  useEffect(() => {
    const availableKeys = keys.filter(
      (key) => (KeyList && KeyList.includes(key.id)) || KeyList.length == 0
    )
    setAvailableKeys(availableKeys)
  }, [KeyList, keys])

  return (
    <div className="absolute flex-shrink-0 h-full w-fit right-0 md:relative">
      <div
        className={`${actionsExpanded ? 'w-48 ' : 'w-0'} transition-[width] md:w-64 border-l border-gray-700 relative h-full`}
      >
        <div
          className={`${actionsExpanded ? 'overflow-y-auto px-2' : 'overflow-hidden'} transition-[padding] md:px-2 w-full overflow-x-hidden md:overflow-y-auto relative bg-zinc-950 h-full`}
        >
          <div className="absolute flex flex-col gap-3 px-2 w-full h-full inset-0">
            {availableKeys.map((key, index) => (
              <KeyButton
                key={index}
                handleKeyPress={handleModeClick}
                Key={key}
                currentKey={currentKey}
                action={currentMapping.mapping[key.id]?.[mode || EventMode.KeyDown] || undefined}
              />
            ))}
          </div>
        </div>
        <div className="absolute md:hidden top-0 -translate-x-12">
          <Button onClick={() => setActionsExpanded((state) => !state)} className="md:hidden">
            <IconLayoutgrid />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface KeyButtonInterface {
  Key: Key
  currentKey?: Key
  action?: ActionReference
  handleKeyPress: (key: Key) => void
}

const KeyButton: FC<KeyButtonInterface> = ({
  handleKeyPress,
  Key,
  currentKey,
  action
}: KeyButtonInterface) => {
  return (
    <Button
      onClick={() => handleKeyPress(Key)}
      className={`${Key.id == currentKey?.id && 'bg-zinc-900'} flex-col`}
    >
      <h1>{Key.id}</h1>
      {action && (
        <div className="flex flex-col justify-start items-start">
          <p className="text-gray-500 text-xs">Action: {action?.id}</p>
          {action?.value && <p className="text-gray-500 text-xs">Value: {action.value}</p>}
        </div>
      )}
    </Button>
  )
}
export default AvailableKeys
