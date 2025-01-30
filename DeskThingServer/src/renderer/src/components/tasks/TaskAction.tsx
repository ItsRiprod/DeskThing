import { FC } from 'react'
import { TaskProps } from './TaskBase'

export const TaskAction: FC<TaskProps> = ({ step, taskId }) => {
  return (
    <>
      {step.label}
      {taskId}
    </>
  )
}
export default TaskAction
