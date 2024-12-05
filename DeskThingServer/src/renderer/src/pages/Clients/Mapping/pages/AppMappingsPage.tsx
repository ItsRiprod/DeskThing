import { useEffect, useState } from 'react'
import { PageProps } from '..'
import useMappingStore from '@renderer/stores/mappingStore'
import { App, Key } from '@shared/types'
import { ActionIcon } from '../components/ActionIcon'
import Button from '@renderer/components/Button'
import { useAppStore } from '@renderer/stores'

const AppMappingsPage: React.FC<PageProps> = ({
  selectedKey,
  setSelectedKey,
  currentMapping,
  mode
}: PageProps) => {
  const keys = useMappingStore((state) => state.keys)
  const [availableKeys, setAvailableKeys] = useState<Key[]>([])
  const [selectedApp, setSelectedApp] = useState<App | undefined>()
  const apps = useAppStore((state) => state.appsList)

  useEffect(() => {
    if (selectedApp) {
      const Keys: Key[] = keys.filter((key) => key.source == selectedApp.name)
      setAvailableKeys(Keys)
    }
  }, [keys])

  const handleAppClick = (app: App): void => {
    setSelectedApp(app)
  }

  return (
    <div className="h-full items-center flex flex-col w-full">
      <div className="w-full overflow-y-auto border-b border-gray-700 p-3 flex-shrink-0 items-center justify-between flex gap-3">
        <div className="items-center flex gap-3">
          <p>Apps:</p>
          {apps.map((app, index) => (
            <Button
              onClick={() => handleAppClick(app)}
              key={index}
              className={`${selectedApp && selectedApp.name == app.name && 'bg-zinc-900'}`}
            >
              <p className="text-nowrap">{app.manifest?.label || app.name}</p>
            </Button>
          ))}
        </div>
      </div>
      <div className="w-full h-full flex flex-col items-center justify-center relative">
        <div className="absolute inset-0 w-full h-full p-4 grid">
          {availableKeys.length > 0 &&
            availableKeys.map((key, index) => (
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
                <ActionIcon
                  className="w-full h-full"
                  action={currentMapping.mapping[key.id][mode]}
                />
              </Button>
            ))}
        </div>
      </div>
    </div>
  )
}

export default AppMappingsPage
