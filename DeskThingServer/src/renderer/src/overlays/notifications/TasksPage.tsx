import React, { useState } from 'react'
import { useNotificationStore } from '@renderer/stores'
import { Task } from '@renderer/stores/notificationStore'
import Button from '@renderer/components/Button'
import { IconCheck, IconX } from '@renderer/assets/icons'

const TasksPage: React.FC = () => {
  const tasks = useNotificationStore((state) => state.tasks)

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>
      <div className="bg-red-950 px-4 py-1 rounded-lg shadow-lg my-2">
        <p className="text-xs italic text-gray-300">Tasks are still under development</p>
      </div>
      {tasks.length > 0 ? (
        <div className="w-full h-full relative overflow-y-auto">
          <div className="absolute inset-0 w-full h-full">
            {tasks.map((task, index) => (
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
  const [isExpanded, setIsExpanded] = useState(false)
  const updateTask = useNotificationStore((state) => state.updateTask)
  const updateStep = useNotificationStore((state) => state.updateStep)

  const acceptTask = (): void => {
    updateTask(task.id, { status: 'in_progress' })
    setIsExpanded(true)
  }

  const rejectTask = (): void => {
    updateTask(task.id, { status: 'rejected' })
    setIsExpanded(true)
  }

  const toggleStepCompletion = (stepId: string): void => {
    if (!task.steps) return

    updateStep(task.id, stepId, {
      status: !task.steps.find((step) => step.stepId === stepId)?.status
    })
  }

  const finishTask = (): void => {
    updateTask(task.id, { status: 'complete' })
    setIsExpanded(false)
  }

  return (
    <div className="w-full bg-zinc-900 p-4 rounded-lg mb-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`${task.status == 'complete' && 'line-through'} text-lg font-bold mb-2`}>
            {task.title}
          </h2>
          <p className="text-gray-300">{task.description}</p>
        </div>
        <div className="flex gap-3 w-full justify-end">
          {task.status === 'pending' ? (
            <>
              <Button
                className="group flex gap-2 border border-green-500 hover:bg-green-500"
                onClick={acceptTask}
              >
                <IconCheck />
                <p className="group-hover:block hidden">Accept</p>
              </Button>
              <Button
                className="group flex gap-2 border border-red-500 hover:bg-red-500"
                onClick={rejectTask}
              >
                <IconX />
                <p className="group-hover:block hidden">Delete</p>
              </Button>
            </>
          ) : task.status != 'complete' ? (
            <>
              <Button
                className="group flex gap-2 border border-green-500 hover:bg-green-500"
                onClick={finishTask}
              >
                <IconCheck />
                <p className="group-hover:block hidden">Finish Task</p>
              </Button>
            </>
          ) : (
            <div>
              <p className="italic text-gray-500">{task.status}</p>
            </div>
          )}
        </div>
      </div>
      {isExpanded && (
        <div className="border-l pl-2">
          {task.steps &&
            task.steps.map((step, index) => (
              <button
                key={index}
                className={`${step.status ? 'line-through' : ''} flex items-center gap-2`}
                onClick={() => toggleStepCompletion(step.stepId)}
              >
                <p className="">{step.task}</p>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

export default TasksPage
