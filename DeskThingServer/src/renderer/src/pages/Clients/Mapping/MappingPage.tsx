import { useState } from 'react'
import AvailableModes from './components/AvailableModesComponent'
import { Key, EventMode, ButtonMapping, Action } from '@shared/types'
import AvailableKeys from './components/AvailableKeysComponent'
import { PageProps } from '.'
import AllActionsComponent from './components/AllActionsComponent'
import AddActionOverlay from './components/AddActionOverlay'

interface MappingPageProps {
  Component: React.FC<PageProps>
  KeyList: string[]
  currentMapping: ButtonMapping
  setCurrentMapping: (mapping: ButtonMapping) => void
  setActiveChanges: (data: boolean) => void
}

const MappingPage: React.FC<MappingPageProps> = ({
  currentMapping,
  KeyList,
  Component,
  setCurrentMapping,
  setActiveChanges
}: MappingPageProps) => {
  const [mode, setCurrentMode] = useState<EventMode>(EventMode.KeyDown)
  const [key, setCurrentKey] = useState<Key>()

  const [pendingAction, setPendingAction] = useState<Action | null>(null)

  const setAction = (action: Action): void => {
    setPendingAction(action)
  }

  const saveAction = (value: string): void => {
    if (!key || !mode || currentMapping.id == 'default') return
    setActiveChanges(true)
    setPendingAction(null)

    setCurrentMapping({
      ...currentMapping,
      mapping: {
        ...currentMapping.mapping,
        [key?.id || '']: {
          ...currentMapping.mapping[key?.id || ''],
          [mode]: { ...pendingAction, value }
        }
      }
    })
  }

  return (
    <div className="h-full flex flex-col w-full">
      {pendingAction && key != undefined && key && (
        <AddActionOverlay
          pendingAction={pendingAction}
          setPendingAction={setPendingAction}
          Key={key}
          saveAction={saveAction}
          mode={mode}
        />
      )}
      <AvailableModes
        currentMode={mode}
        setSelectedMode={setCurrentMode}
        modes={key?.Modes || [EventMode.KeyDown]}
      />
      <div className="h-full flex relative">
        <div className="w-full overflow-x-auto">
          <Component
            selectedKey={key}
            setSelectedKey={setCurrentKey}
            currentMapping={currentMapping}
            mode={mode}
            setCurrentMode={setCurrentMode}
          />
        </div>
        <AvailableKeys
          mode={mode}
          currentMapping={currentMapping}
          KeyList={KeyList}
          currentKey={key}
          setSelectedKey={setCurrentKey}
        />
      </div>
      <AllActionsComponent
        currentMapping={currentMapping}
        mode={mode}
        selectedKey={key}
        setAction={setAction}
      />
    </div>
  )
}

export default MappingPage
