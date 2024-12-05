import { useState } from 'react'
import AvailableModes from './components/AvailableModesComponent'
import { Key, EventMode, ButtonMapping, Action } from '@shared/types'
import AvailableKeys from './components/AvailableKeysComponent'
import { PageProps } from '.'
import AllActionsComponent from './components/AllActionsComponent'
import AddActionOverlay from './components/AddActionPopup'

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
    if (!mode || !key) return
    setPendingAction(action)
    saveAction(action.value || '', action)
  }

  const saveAction = (value: string, action?: Action): void => {
    console.log('Saving Action ', value)
    if (!key || !mode || currentMapping.id == 'default' || (!pendingAction && !action)) return
    setActiveChanges(true)

    const newAction = action || pendingAction

    setCurrentMapping({
      ...currentMapping,
      mapping: {
        ...currentMapping.mapping,
        [key?.id || '']: {
          ...currentMapping.mapping[key?.id || ''],
          [mode]: { ...newAction, value }
        }
      }
    })
  }

  const updateAction = (value: string): void => {
    if (!pendingAction) return
    saveAction(value)
    setPendingAction(null)
  }

  return (
    <div className="h-full flex flex-col w-full">
      <AvailableModes
        currentMode={mode}
        setSelectedMode={setCurrentMode}
        modes={key?.modes || [EventMode.KeyDown]}
      />
      <div className="h-full max-h-full flex relative">
        <div className="w-full max-h-full relative overflow-auto">
          <div className="absolute inset-0 w-full h-full">
            <Component
              selectedKey={key}
              setSelectedKey={setCurrentKey}
              currentMapping={currentMapping}
              mode={mode}
              setCurrentMode={setCurrentMode}
            />
          </div>
        </div>
        <AvailableKeys
          mode={mode}
          currentMapping={currentMapping}
          KeyList={KeyList}
          currentKey={key}
          setSelectedKey={setCurrentKey}
        />
      </div>
      <div className="flex flex-col">
        <AllActionsComponent
          currentMapping={currentMapping}
          mode={mode}
          selectedKey={key}
          setAction={setAction}
        />
        {pendingAction && key != undefined && key && (
          <AddActionOverlay
            pendingAction={pendingAction}
            Key={key}
            updateAction={updateAction}
            mode={mode}
          />
        )}
      </div>
    </div>
  )
}

export default MappingPage
