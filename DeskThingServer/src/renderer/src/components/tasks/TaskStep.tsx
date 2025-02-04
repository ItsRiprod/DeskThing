import { FC } from 'react'
import { StepProps } from './TaskBase'
import useTaskStore from '@renderer/stores/taskStore'
import Button from '../Button'
import { IconCheck } from '@renderer/assets/icons'

export const TaskStep: FC<StepProps> = ({ step }) => {
  console.log('Task Step', step)
  const completeStep = useTaskStore((state) => state.resolveStep)

  const handleComplete = (): void => {
    if (!step.parentId) {
      console.error('Step does not have a parent task id! It cannot resolve')
      return
    }
    completeStep(step.parentId, step.id)
  }

  return (
    <div>
      <h2 className="text-2xl">{step?.label}</h2>
      <p>{step.instructions}</p>
      <p>Task Step</p>
      <div className="w-full flex justify-end">
        <Button className="bg-green-700 hover:bg-green-600" onClick={handleComplete}>
          <p>Mark as Completed</p>
          <IconCheck />
        </Button>
      </div>
    </div>
  )
}
export default TaskStep
