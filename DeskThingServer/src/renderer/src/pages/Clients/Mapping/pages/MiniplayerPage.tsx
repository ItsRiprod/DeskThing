import { useEffect, useState } from 'react'
import { PageProps } from '..'
import useMappingStore from '@renderer/stores/mappingStore'
import { Key } from '@shared/types'
import { ActionIcon } from '../components/ActionIcon'
import Button from '@renderer/components/Button'
import { IconArrowDown, IconLink, IconMusic } from '@renderer/assets/icons'

const keyList: string[] = [
  'DynamicAction1',
  'DynamicAction2',
  'DynamicAction3',
  'DynamicAction4',
  'Action5',
  'Action6',
  'Action7'
]

const MiniplayerPage: React.FC<PageProps> = ({
  selectedKey,
  setSelectedKey,
  currentMapping,
  mode
}: PageProps) => {
  const keys = useMappingStore((state) => state.keys)
  const [miniplayerKeys, setMiniplayerKeys] = useState<Key[]>([])

  useEffect(() => {
    const Keys: Key[] = keys.filter((key) => keyList && keyList.includes(key.id))
    setMiniplayerKeys(Keys)
  }, [keys])

  return (
    <div className="h-full justify-center items-center flex flex-col w-full p-5">
      <div className="flex w-full min-w-fit p-2 items-center justify-between border rounded-lg">
        <Button
          disabled={true}
          className="bg-zinc-900 text-gray-500 flex items-center justify-center rounded-lg p-3"
        >
          <IconMusic className="w-fit h-fit" />
        </Button>
        <Button
          disabled={true}
          className="bg-zinc-900 text-gray-500 flex items-center justify-center rounded-lg p-3"
        >
          <IconArrowDown className="w-fit h-fit" />
        </Button>
        {miniplayerKeys.length > 0 &&
          miniplayerKeys.map((key, index) => (
            <Button
              key={key?.id || index}
              className={`flex hover:bg-zinc-700 items-center justify-center rounded-lg p-3 ${selectedKey?.id == key.id ? 'bg-zinc-800' : 'bg-zinc-900'}`}
              onClick={() => setSelectedKey(key)}
            >
              <div
                className={`text-xs absolute ${index % 2 == 0 ? '-translate-y-12' : 'translate-y-12'}`}
              >
                {key.id}
              </div>
              <ActionIcon className="w-fit h-fit" action={currentMapping.mapping[key.id][mode]} />
            </Button>
          ))}
        <Button
          disabled={true}
          className="bg-zinc-900 text-gray-500 flex items-center justify-center rounded-lg p-3"
        >
          <IconLink className="w-fit h-fit" />
        </Button>
      </div>
    </div>
  )
}

export default MiniplayerPage
