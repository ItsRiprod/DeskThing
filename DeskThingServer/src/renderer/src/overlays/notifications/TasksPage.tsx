import React, { useState } from 'react'
import useTaskStore from '@renderer/stores/taskStore'
import { Task } from '@shared/types/tasks'
import TaskBase from '@renderer/components/tasks/TaskBase'
import { IconPlay } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'

const TasksPage: React.FC = () => {
  const tasks = useTaskStore((state) => state.taskList.tasks)
  const currentTask = useTaskStore((state) => state.taskList.currentTaskId)

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
              <TaskComponent key={index} task={task} currentTaskId={currentTask} />
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
  currentTaskId?: string
}

const TaskComponent = ({ task, currentTaskId }: TaskComponentProps): React.ReactElement => {
  const resolveTask = useTaskStore((state) => state.resolveTask)
  const acceptTask = useTaskStore((state) => state.acceptTask)
  const rejectTask = useTaskStore((state) => state.rejectTask)

  const handleAccept = (): void => {
    acceptTask(task.id)
  }

  return (
    <div className="w-full bg-zinc-900 p-4 hover:bg-zinc-800 rounded-lg mb-4 flex flex-col">
      <div className="flex justify-between items-center">
        <div className="items-start flex flex-col">
          <h2 className={`${task.completed && 'line-through'} text-lg font-bold mb-2`}>
            {task.label || task.id}
          </h2>
          <p className="text-gray-300">{task.description}</p>
        </div>
        <div className="flex-shrink-0">
          {!task.started && (
            <Button
              className="group flex italic text-gray-500 hover:text-white transition-colors py-5"
              onClick={handleAccept}
            >
              <p>Start Task</p>
              <IconPlay className="group-hover:stroke-2 stroke-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TasksPage
