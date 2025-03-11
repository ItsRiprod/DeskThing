import { Action, DebugStep } from '@DeskThing/types'
import { FC, useEffect, useState } from 'react'
import Button from '../Button'
import { IconLink } from '@renderer/assets/icons'
import { usePageStore } from '@renderer/stores'
import { useSearchParams } from 'react-router-dom'
import useMappingStore from '@renderer/stores/mappingStore'
import ActionElement from '../ActionElement'

export const DebugComponent: FC<{ step: DebugStep }> = ({ step }): JSX.Element => {
  const setPage = usePageStore((state) => state.setPage)
  const [_searchParams, setSearchParams] = useSearchParams()
  const currentPage = usePageStore((state) => state.currentPage)
  const [isShortcutComplete, setIsShortcutComplete] = useState(false)
  const getAction = useMappingStore((state) => state.getActionFromReference)
  const triggerAction = useMappingStore((state) => state.executeAction)
  const [action, setAction] = useState<Action | undefined>(undefined)

  useEffect(() => {
    if (step.shortcutLoc) {
      const [path, query] = step.shortcutLoc.split('?')
      const stepParams = query ? new URLSearchParams(query) : null
      const currentParams = new URLSearchParams(window.location.search)

      const normalizedCurrentPage = currentPage.toLowerCase().replaceAll('/', '')
      const normalizedPath = path.toLowerCase().replaceAll('/', '')

      const paramsMatch =
        !stepParams ||
        Array.from(stepParams.entries()).every(
          ([key, value]) => currentParams.get(key)?.toLowerCase() === value.toLowerCase()
        )

      if (normalizedCurrentPage === normalizedPath && paramsMatch) {
        setIsShortcutComplete(true)
      }
    }
  }, [currentPage, step.shortcutLoc])

  useEffect(() => {
    const fetchAction = async (actionId: string): Promise<void> => {
      const action = getAction({ id: actionId, source: 'local' })
      if (action) {
        setAction(action)
      }
    }
    if (step.actionId) {
      fetchAction(step.actionId)
    }
  }, [step.actionId, getAction])

  const handleServerRouting = async (): Promise<void> => {
    if (step.shortcutLoc) {
      const [path, query] = step.shortcutLoc.split('?')
      setPage(path)

      if (query) {
        const newParams = new URLSearchParams(query)
        setSearchParams(newParams)
      }
    }
  }

  const handleActionSubmit = (): void => {
    if (action) {
      triggerAction(action)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <h2 className="text-2xl">{step.label}</h2>
        {step.instructions && <p>{step.instructions}</p>}
      </div>
      {step.actionId && action && (
        <div className="flex flex-col gap-2">
          <ActionElement onTrigger={handleActionSubmit} action={{ ...action, source: 'local' }} />
        </div>
      )}
      {step.shortcutLoc && (
        <div className="flex flex-col gap-2">
          {isShortcutComplete ? (
            <p className="text-xs italic text-gray-300">Page Visited</p>
          ) : (
            <Button className="bg-zinc-900 hover:bg-zinc-700" onClick={handleServerRouting}>
              <p>Go to {step.shortcutLoc}</p>
              <IconLink />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default DebugComponent
