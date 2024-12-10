import { PageProps } from '..'
import { IconCarThing } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import useMappingStore from '@renderer/stores/mappingStore'
import { useState, useEffect } from 'react'
import { ActionIcon } from '../components/ActionIcon'
import { EventMode, Key } from '@shared/types'

const keyList: string[] = ['Swipe', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Escape']

const CarThingPage: React.FC<PageProps> = ({
  selectedKey,
  setSelectedKey,
  currentMapping,
  mode,
  setCurrentMode
}: PageProps) => {
  const keys = useMappingStore((state) => state.keys)
  const [miniplayerKeys, setMiniplayerKeys] = useState<Key[]>([])

  useEffect(() => {
    const Keys: Key[] = keys.filter((key) => keyList && keyList.includes(key.id))
    setMiniplayerKeys(Keys)
  }, [keys])

  const onPress = (key: string, mode?: EventMode): void => {
    const Key = miniplayerKeys.find((k) => k.id == key)
    if (Key) {
      setSelectedKey(Key)
      mode ? setCurrentMode(mode) : setCurrentMode(EventMode.PressShort)
    }
  }

  return (
    <div className="relative h-full min-h-96 min-w-96 flex flex-col w-full items-center justify-center">
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        <IconCarThing
          onPress={onPress}
          highlighted={keyList.filter((key) => key == selectedKey?.id)}
          highlightColor="aqua"
          className="w-fit h-full"
        />
      </div>
      <div className="flex -translate-x-12 flex-col h-1/3 items-center justify-center aspect-square">
        <div className="flex w-full h-full items-center justify-center">
          <Button
            className={`flex hover:bg-zinc-700 items-center justify-center rounded-lg p-3 ${mode == EventMode.SwipeDown ? 'bg-zinc-800' : 'bg-zinc-900'}`}
            onClick={() => onPress('Swipe', EventMode.SwipeDown)}
          >
            <ActionIcon
              className="w-fit h-fit"
              action={
                currentMapping && miniplayerKeys.length > 0
                  ? currentMapping.mapping['Swipe'][EventMode.SwipeDown]
                  : undefined
              }
            />
          </Button>
        </div>
        <div className="flex w-full h-full items-center justify-between">
          <Button
            className={`flex hover:bg-zinc-700 items-center justify-center rounded-lg p-3 ${mode == EventMode.SwipeLeft ? 'bg-zinc-800' : 'bg-zinc-900'}`}
            onClick={() => onPress('Swipe', EventMode.SwipeLeft)}
          >
            <ActionIcon
              className="w-fit h-fit"
              action={
                currentMapping && miniplayerKeys.length > 0
                  ? currentMapping.mapping['Swipe'][EventMode.SwipeLeft]
                  : undefined
              }
            />
          </Button>
          <Button
            className={`flex hover:bg-zinc-700 items-center justify-center rounded-lg p-3 ${mode == EventMode.SwipeRight ? 'bg-zinc-800' : 'bg-zinc-900'}`}
            onClick={() => onPress('Swipe', EventMode.SwipeRight)}
          >
            <ActionIcon
              className="w-fit h-fit"
              action={
                currentMapping && miniplayerKeys.length > 0
                  ? currentMapping.mapping['Swipe'][EventMode.SwipeRight]
                  : undefined
              }
            />
          </Button>
        </div>
        <div className="flex w-full h-full items-center justify-center">
          <Button
            className={`flex hover:bg-zinc-700 items-center justify-center rounded-lg p-3 ${mode == EventMode.SwipeUp ? 'bg-zinc-800' : 'bg-zinc-900'}`}
            onClick={() => onPress('Swipe', EventMode.SwipeUp)}
          >
            <ActionIcon
              className="w-fit h-fit"
              action={
                currentMapping && miniplayerKeys.length > 0
                  ? currentMapping.mapping['Swipe'][EventMode.SwipeUp]
                  : undefined
              }
            />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CarThingPage
