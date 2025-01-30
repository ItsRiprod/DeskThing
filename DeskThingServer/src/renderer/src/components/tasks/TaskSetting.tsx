import { FC } from 'react'
import { TaskProps } from './TaskBase'

export const TaskSetting: FC<TaskProps> = ({ step, taskId }) => {
  return (
    <>
      {step.label}
      {taskId}
    </>
  )
}
export default TaskSetting
