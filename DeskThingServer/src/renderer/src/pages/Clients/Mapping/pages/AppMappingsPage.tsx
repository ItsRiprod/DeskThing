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
  const [selectedApp, setSelectedApp] = useState<App | { name: string } | undefined>({
    name: 'server'
  })
  const apps = useAppStore((state) => state.appsList)

  useEffect(() => {
    if (selectedApp) {
      const Keys: Key[] = keys.filter((key) => key.source == selectedApp.name)
      setAvailableKeys(Keys)
    }
  }, [keys, selectedApp])

  const handleAppClick = (app: App | { name: string }): void => {
    setSelectedApp(app)
  }

  return (
    <div className="h-full items-center relative flex flex-col w-full">
      <div className="w-full overflow-y-auto border-b border-gray-700 p-3 flex-shrink-0 items-center justify-between flex gap-3">
        <div className="items-center flex gap-3">
          <p>Apps:</p>
          <Button
            onClick={() => handleAppClick({ name: 'server' })}
            className={`${selectedApp && selectedApp.name == 'server' && 'bg-zinc-900'}`}
          >
            <p className="text-nowrap">{'Server Apps'}</p>
          </Button>
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
      <div className="w-full h-full flex overflow-auto flex-col items-center justify-center relative">
        <div className="absolute inset-0 hmd:py-10 md:px-10 w-full h-full">
          <div className="w-full h-full flex gap-2 overflow-x-auto overflow-y-hidden items-center justify-center border rounded-xl flex-col flex-wrap">
            {availableKeys.length > 0 &&
              availableKeys.map((key, index) => (
                <div key={key?.id || index}>
                  <Button
                    className={`relative flex hover:bg-zinc-700 h-full w-full items-center justify-center rounded-lg p-3 ${selectedKey?.id == key.id ? 'bg-zinc-800' : 'bg-zinc-900'}`}
                    onClick={() => setSelectedKey(key)}
                  >
                    <div
                      className={`text-xs w-full md:text-xl h-full flex items-center justify-center`}
                    >
                      {key.id}
                    </div>
                    <ActionIcon
                      className="w-full h-full"
                      action={currentMapping.mapping[key.id][mode]}
                    />
                  </Button>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppMappingsPage
