import { FC } from 'react'
import { StepProps } from './TaskBase'
import useTaskStore from '@renderer/stores/taskStore'
import Button from '../Button'
import { IconCheck } from '@renderer/assets/icons'
import { STEP_TYPES } from '@shared/types/tasks'

export const TaskExternal: FC<StepProps> = ({ step }) => {
  if (step.type != STEP_TYPES.EXTERNAL) return <div>Not an external</div>
  const completeStep = useTaskStore((state) => state.resolveStep)

  const handleComplete = (): void => {
    if (!step.parentId) {
      console.error('Step does not have a parent task id! It cannot resolve')
      return
    }
    completeStep(step.parentId, step.id)
  }

  return (
    <div className="flex flex-col justify-between">
      <div>
        <h2 className="text-2xl">{step?.label}</h2>
        <p>{step?.instructions}</p>
      </div>
      {step.url && (
        <Button href={step.url} target="_blank">
          <p>Go to {step.url}</p>
        </Button>
      )}
      <Button
        className="bg-green-700 hover:bg-green-500 gap-2 items-center"
        onClick={handleComplete}
      >
        <p>Mark as Completed</p>
        <IconCheck />
      </Button>
    </div>
  )
}
export default TaskExternal
