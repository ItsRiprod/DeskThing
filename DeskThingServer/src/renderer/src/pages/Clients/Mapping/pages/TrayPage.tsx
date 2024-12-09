import { useEffect, useState } from 'react'
import { PageProps } from '..'
import useMappingStore from '@renderer/stores/mappingStore'
import { Key } from '@shared/types'
import { ActionIcon } from '../components/ActionIcon'
import Button from '@renderer/components/Button'

const keyList: string[] = ['Tray1', 'Tray2', 'Tray3', 'Tray4', 'Tray5', 'Tray6']

const TrayPage: React.FC<PageProps> = ({
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
      <div className="flex w-full min-w-fit lg:gap-8 gap-1 p-2 items-center justify-between border rounded-lg">
        {miniplayerKeys.length > 0 &&
          miniplayerKeys.map((key, index) => (
            <Button
              key={key?.id || index}
              className={`relative flex hover:bg-zinc-700 h-full w-full items-center justify-center rounded-lg p-3 ${selectedKey?.id == key.id ? 'bg-zinc-800' : 'bg-zinc-900'}`}
              onClick={() => setSelectedKey(key)}
            >
              <div
                className={`text-xs w-full md:text-xl h-full flex items-center justify-center inset-0 absolute ${index % 2 == 0 ? '-translate-y-full' : 'translate-y-full'}`}
              >
                {key.id}
              </div>
              <ActionIcon className="w-full h-full" action={currentMapping.mapping[key.id][mode]} />
            </Button>
          ))}
      </div>
    </div>
  )
}

export default TrayPage
