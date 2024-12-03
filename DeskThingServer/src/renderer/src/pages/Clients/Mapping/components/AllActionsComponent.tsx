import { FC, useState } from 'react'
import Button from '@renderer/components/Button'
import useMappingStore from '@renderer/stores/mappingStore'
import { Action, ButtonMapping, EventMode, Key } from '@shared/types'
import ActionButton from './ActionButton'

interface AllActionsComponentProps {
  selectedKey: Key | undefined
  mode: EventMode
  currentMapping: ButtonMapping
  setAction: (action: Action) => void
}

const AllActionsComponent: FC<AllActionsComponentProps> = ({
  currentMapping,
  mode,
  selectedKey,
  setAction
}) => {
  const actions = useMappingStore((state) => state.actions)
  const [filter, setFilter] = useState<'nav' | 'media' | 'basic' | 'apps' | 'all'>('all')

  return (
    <div className="max-h-60 border-t flex-shrink-0 border-gray-500 flex">
      <div className="h-full gap-2 flex-shrink-0 overflow-y-auto flex flex-col p-2 w-24 bg-zinc-900 border-r border-gray-700">
        <Button
          className={`${filter === 'all' && 'bg-zinc-800'} hover:bg-zinc-800`}
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          className={`${filter === 'nav' && 'bg-zinc-800'} hover:bg-zinc-800`}
          onClick={() => setFilter('nav')}
        >
          Nav
        </Button>
        <Button
          className={`${filter === 'media' && 'bg-zinc-800'} hover:bg-zinc-800`}
          onClick={() => setFilter('media')}
        >
          Media
        </Button>
        <Button
          className={`${filter === 'apps' && 'bg-zinc-800'} hover:bg-zinc-800`}
          onClick={() => setFilter('apps')}
        >
          Apps
        </Button>
      </div>
      <div className="h-full content-start overflow-y-auto flex flex-wrap gap-2 p-2">
        {filter === 'apps'
          ? actions
              .filter((action) => action.source !== 'server')
              .map((action) => (
                <ActionButton
                  key={action.id}
                  selectedKey={selectedKey}
                  currentMapping={currentMapping}
                  action={action}
                  setAction={setAction}
                  mode={mode}
                />
              ))
          : actions
              .filter((action) => action.tag === filter || filter === 'all')
              .map((action) => (
                <ActionButton
                  key={action.id}
                  selectedKey={selectedKey}
                  currentMapping={currentMapping}
                  action={action}
                  setAction={setAction}
                  mode={mode}
                />
              ))}
      </div>
    </div>
  )
}

export default AllActionsComponent
