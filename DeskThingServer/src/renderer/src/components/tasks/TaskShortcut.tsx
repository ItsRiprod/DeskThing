import { FC, useMemo } from 'react'
import { IconCheck, IconLink } from '@renderer/assets/icons'
import Button from '../buttons/Button'
import { usePageStore } from '@renderer/stores'
import { useSearchParams } from 'react-router-dom'
import useTaskStore from '@renderer/stores/taskStore'
import { STEP_TYPES } from '@deskthing/types'
import { StepPropsMap } from '@shared/types'

export const TaskShortcutComponent: FC<StepPropsMap[STEP_TYPES.SHORTCUT]> = ({ step, source }) => {
  const setPage = usePageStore((state) => state.setPage)
  const [_searchParams, setSearchParams] = useSearchParams()
  const completeStep = useTaskStore((state) => state.resolveStep)
  const currentPage = usePageStore((state) => state.currentPage)

  const isComplete = useMemo(() => {
    const [path, query] = step.destination.split('?')
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
      return true
    } else {
      console.log('Step is not complete', normalizedCurrentPage, normalizedPath, paramsMatch)
      return false
    }
  }, [currentPage, step.destination])

  const handleComplete = (): void => {
    if (!step.parentId) {
      console.error('Step does not have a parent task id! It cannot resolve')
      return
    }
    completeStep(step.parentId, step.id, source)
  }

  const handleServerRouting = async (): Promise<void> => {
    const [path, query] = step.destination.split('?')
    setPage(path)

    if (query) {
      const newParams = new URLSearchParams(query)
      setSearchParams(newParams)
    }
  }

  return (
    <div className="flex flex-col justify-between gap-3">
      <div className="flex justify-between">
        <div>
          <h2 className="text-2xl">{step.label}</h2>
          <p>{step.instructions}</p>
        </div>
      </div>
      {isComplete && !step.debug ? (
        <div className="w-full flex flex-col">
          <Button
            disabled={!isComplete}
            className="bg-green-800 hover:bg-green-500"
            onClick={handleComplete}
          >
            <p>Mark as Completed</p>
            <IconCheck />
          </Button>
          <p className="text-xs italic text-gray-300">Page Visited</p>
        </div>
      ) : (
        <Button className="bg-zinc-900 hover:bg-zinc-700" onClick={handleServerRouting}>
          <p>Go to {step.destination}</p>
          <IconLink />
        </Button>
      )}
    </div>
  )
}
export default TaskShortcutComponent
