import { FC } from 'react'
import { StepProps } from './TaskBase'
import { STEP_TYPES } from '@shared/types/tasks'

export const TaskSetting: FC<StepProps> = ({ step }) => {
  if (step.type != STEP_TYPES.SETTING) return <div>Not an action</div>
  return (
    <>
      {step?.label}
    </>
  )
}
export default TaskSetting
