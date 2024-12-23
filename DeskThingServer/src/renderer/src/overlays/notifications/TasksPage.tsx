import React, { useState } from 'react'
import { useNotificationStore } from '@renderer/stores'
import Button from '@renderer/components/Button'
import { IconCheck, IconX } from '@renderer/assets/icons'
import useTaskStore from '@renderer/stores/taskStore'
import { Task } from '@shared/types/tasks'
import TaskBase from '@renderer/components/tasks/TaskBase'

const TasksPage: React.FC = () => {
  const tasks = useTaskStore((state) => state.taskList.tasks)

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>
      <div className="bg-red-950 px-4 py-1 rounded-lg shadow-lg my-2">
        <p className="text-xs italic text-gray-300">Tasks are still under development</p>
      </div>
      {Object.values(tasks).length > 0 ? (
        <div className="w-full h-full relative overflow-y-auto">
          <div className="absolute inset-0 w-full h-full">
            {Object.values(tasks).map((task, index) => (
              <TaskComponent key={index} task={task} />
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray-500">No tasks found.</p>
        </div>
      )}
    </div>
  )
}

interface TaskComponentProps {
  task: Task
}

const TaskComponent = ({ task }: TaskComponentProps): React.ReactElement => {
  const [isExpanded, setIsExpanded] = useState(true)
  const resolveTask = useTaskStore((state) => state.resolveTask)
  const updateStep = useTaskStore((state) => state.resolveStep)
  const acceptTask = useTaskStore((state) => state.acceptTask)
  const rejectTask = useTaskStore((state) => state.rejectTask)

  const toggleStepCompletion = (stepId: string): void => {
    updateStep(task.id, stepId)
  }

  const finishTask = (): void => {
    resolveTask(task.id)
    setIsExpanded(false)
  }

  return (
    <div className="w-full bg-zinc-900 p-4 rounded-lg mb-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`${task.completed && 'line-through'} text-lg font-bold mb-2`}>
            {task.label || task.id}
          </h2>
          <p className="text-gray-300">{task.description}</p>
        </div>
      </div>
      {isExpanded && (
        <div className="gap-2 flex flex-col">
          {task.steps &&
            Object.values(task.steps).map((step, index) => (
              <TaskBase key={index} step={step} taskId={task.id} />
            ))}
        </div>
      )}
    </div>
  )
}

export default TasksPage
