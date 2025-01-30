import { FC } from 'react'
import { TaskProps } from './TaskBase'

export const TaskExternal: FC<TaskProps> = ({ step, taskId }) => {
  return (
    <>
      {step.label}
      {taskId}
    </>
  )
}
export default TaskExternal
