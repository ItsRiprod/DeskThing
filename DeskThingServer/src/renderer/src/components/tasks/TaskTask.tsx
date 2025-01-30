import { FC } from 'react'
import { TaskProps } from './TaskBase'

export const TaskTask: FC<TaskProps> = ({ step, taskId }) => {
  return (
    <>
      {step.label}
      {taskId}
    </>
  )
}
export default TaskTask
