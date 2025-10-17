import { FC, useMemo } from 'react'
import useTaskStore from '@renderer/stores/taskStore'
import Button from '../buttons/Button'
import { useSearchParams } from 'react-router-dom'
import { IconCheck, IconLink, IconX } from '@renderer/assets/icons'
import { STEP_TYPES } from '@deskthing/types'
import { StepPropsMap } from '@shared/types'

export const TaskTaskComponent: FC<StepPropsMap[STEP_TYPES.TASK]> = ({ step, source }) => {
  const completeStep = useTaskStore((state) => state.resolveStep)
  const appTasks = useTaskStore((state) => state.taskList)
  const startTask = useTaskStore((state) => state.acceptTask)
  const [searchParams, setSearchParams] = useSearchParams()

  const taskSource = step.taskReference?.source || source

  const stepCompleted = useMemo(() => {
    const tasks = appTasks[taskSource]
    const task = Object.values(tasks).find((task) => task.id === step.taskReference?.id)
    return task?.completed ?? true
  }, [appTasks, step.taskReference?.id, step.taskReference?.source, source])

  const handleComplete = (): void => {
    if (!step.parentId) {
      console.error('Step does not have a parent task id! It cannot resolve')
      return
    }
    completeStep(step.parentId, step.id, source)
  }

  const openTasks = (): void => {
    const tasks = appTasks[taskSource]
    const task = Object.values(tasks).find((task) => task.id === step.taskReference?.id)
    if (task) {
      startTask(task.id, task.source)
    } else {
      searchParams.set('page', 'task')
      searchParams.set('notifications', 'true')
      setSearchParams(searchParams)
    }
  }

  return (
    <div className="gap-2 flex flex-col">
      <h2 className="text-2xl">{step.label}</h2>
      <p>{step.instructions}</p>
      <div className="w-full flex items-end justify-between gap-5">
        <div className="flex flex-col">
          {stepCompleted && <p className="italic text-xs text-gray-400">Task is Completed</p>}
          <Button
            title="Open Tasks notification"
            className="gap-2 bg-cyan-700 hover:bg-cyan-600"
            onClick={openTasks}
          >
            <p>Open {step.taskReference?.id} task</p>
            <IconLink />
          </Button>
        </div>
        {!step.debug && (
          <Button
            className={`group ${stepCompleted ? 'bg-green-700 hover:bg-green-600' : 'bg-zinc-950 text-gray-500'}`}
            disabled={step.strict && !stepCompleted}
            title={`${step.strict ? 'Complete task first' : 'Continue Anyway'}`}
            onClick={handleComplete}
          >
            {stepCompleted ? (
              <p>Confirm Completion</p>
            ) : (
              <p>Complete task {step.taskReference?.id} first</p>
            )}
            {stepCompleted ? <IconCheck /> : <IconX />}
          </Button>
        )}
      </div>
    </div>
  )
}
export default TaskTaskComponent
