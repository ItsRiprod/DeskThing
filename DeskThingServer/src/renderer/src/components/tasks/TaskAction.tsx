import { FC } from 'react'
import { StepProps } from './TaskBase'
import { STEP_TYPES } from '@shared/types/tasks'
import ActionElement from '../ActionElement'

export const TaskAction: FC<StepProps> = ({ step }) => {
  if (step.type != STEP_TYPES.ACTION) return <div>Not an action</div>
  return (
    <div>
      <p>Task Action</p>
      {step?.label}
      <ActionElement action={step.action} />
    </div>
  )
}
export default TaskAction
