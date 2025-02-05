import { FC, useEffect, useState } from 'react'
import { StepProps } from './TaskBase'
import useTaskStore from '@renderer/stores/taskStore'
import Button from '../Button'
import { useSearchParams } from 'react-router-dom'
import { STEP_TYPES } from '@shared/types/tasks'
import { IconCheck, IconLink, IconX } from '@renderer/assets/icons'

export const TaskTask: FC<StepProps> = ({ step }) => {
  if (step.type != STEP_TYPES.TASK) return <div>Not an action</div>

  const completeStep = useTaskStore((state) => state.resolveStep)
  const tasks = useTaskStore((state) => state.taskList.tasks)
  const [searchParams, setSearchParams] = useSearchParams()
  const [stepCompleted, setStepCompleted] = useState(false)

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
    setStepCompleted(task?.completed || false)
    console.log('Task Step', task)
  }, [tasks])

  return (
    <div className="gap-2 flex flex-col">
      <h2 className="text-2xl">{step.label}</h2>
      <p>{step.instructions}</p>
      <div className="w-full flex justify-between gap-5">
        <Button
          title="Open Tasks notification"
          className="gap-2 bg-cyan-700 hover:bg-cyan-600"
          onClick={openTasks}
        >
          <p>Open {step.taskId} task</p>
          <IconLink />
        </Button>
        <Button
          className={`group ${stepCompleted ? 'bg-green-700 hover:bg-green-600' : 'bg-zinc-950 text-gray-500'}`}
          disabled={step.strict && !stepCompleted}
          title={`${step.strict ? 'Complete task first' : 'Continue Anyway'}`}
          onClick={handleComplete}
        >
          {stepCompleted ? <p>Mark as Completed</p> : <p>Complete task {step.taskId} first</p>}
          {stepCompleted ? <IconCheck /> : <IconX />}
        </Button>
      </div>
    </div>
  )
}
export default TaskTask
