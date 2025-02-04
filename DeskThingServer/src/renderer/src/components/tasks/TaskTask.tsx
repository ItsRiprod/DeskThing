import { FC, useEffect } from 'react'
import { StepProps } from './TaskBase'
import useTaskStore from '@renderer/stores/taskStore'
import Button from '../Button'
import { useSearchParams } from 'react-router-dom'
import { STEP_TYPES } from '@shared/types/tasks'

export const TaskTask: FC<StepProps> = ({ step }) => {
  if (step.type != STEP_TYPES.TASK) return <div>Not an action</div>

  const completeStep = useTaskStore((state) => state.resolveStep)
  const tasks = useTaskStore((state) => state.taskList.tasks)
  const [searchParams, setSearchParams] = useSearchParams()
  const handleComplete = (): void => {
    if (!step.parentId) {
      console.error('Step does not have a parent task id! It cannot resolve')
      return
    }
    completeStep(step.parentId, step.id)
  }

  const openTasks = (): void => {
    searchParams.set('page', 'task')
    searchParams.set('notifications', 'true')
    setSearchParams(searchParams)
  }

  useEffect(() => {
    const task = Object.values(tasks).find((task) => task.id === step.taskId)
  }, [tasks])

  return (
    <div>
      <h2 className="text-2xl">{step.label}</h2>
      <p>{step.instructions}</p>
      <Button onClick={openTasks}>

      </Button>
      <Button onClick={handleComplete}>
        <p>Mark as Completed</p>
      </Button>
    </div>
  )
}
export default TaskTask
