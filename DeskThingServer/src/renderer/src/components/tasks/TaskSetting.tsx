import { FC } from 'react'
import { StepProps } from './TaskBase'
import { STEP_TYPES } from '@shared/types/tasks'
import SettingComponent from '../settings/SettingComponent'

export const TaskSetting: FC<StepProps> = ({ step }) => {
  if (step.type != STEP_TYPES.SETTING) return <div>Not a Setting</div>
  return (
    <div>
      {step?.label}
      <SettingComponent setting={step.setting} />
    </div>
  )
}
export default TaskSetting
