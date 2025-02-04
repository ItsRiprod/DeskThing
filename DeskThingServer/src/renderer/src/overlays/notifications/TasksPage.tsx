import React, { useEffect, useState } from 'react'
import useTaskStore from '@renderer/stores/taskStore'
import { Task, TaskReference } from '@shared/types/tasks'
import { IconLink, IconPlay, IconReload, IconStop } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import { useSearchParams } from 'react-router-dom'

const sortTasks = (tasks: { [key: string]: Task | TaskReference }): (Task | TaskReference)[] => {
  return Object.values(tasks).sort((a, b) => {
    // Active tasks first
    // Incomplete tasks before completed ones
    if (!a.completed && b.completed) return -1
    if (a.completed && !b.completed) return 1

    if (a.started && !b.started) return -1
    if (!a.started && b.started) return 1

    // Available but not started tasks second
    if (a.available && !b.available) return -1
    if (!a.available && b.available) return 1

    // Alphabetical by label as final tiebreaker
    return (a.label || '').localeCompare(b.label || '')
  })
}

const TasksPage: React.FC = () => {
  const tasks = useTaskStore((state) => state.taskList.tasks)
  const [sortedTasks, setSortedTasks] = useState<(TaskReference | Task)[]>([])
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    const sorted = sortTasks(tasks)
    setSortedTasks(sorted)
  }, [tasks])

  const onClose = (): void => {
    searchParams.delete('notifications')
    setSearchParams(searchParams)
  }

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>
      <div className="bg-red-950 px-4 py-1 rounded-lg shadow-lg my-2">
        <p className="text-xs italic text-gray-300">Tasks are still under development</p>
      </div>
      {sortedTasks.length > 0 ? (
        <div className="w-full h-full relative overflow-y-auto">
          <div className="absolute inset-0 w-full h-full">
            {sortedTasks.map((task, index) => (
              <TaskComponent key={index} task={task} onClose={onClose} />
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
  task: Task | TaskReference
  onClose: () => void
}

const TaskComponent = ({ task, onClose }: TaskComponentProps): React.ReactElement => {
  const acceptTask = useTaskStore((state) => state.acceptTask)
  const rejectTask = useTaskStore((state) => state.rejectTask)
  const restartTask = useTaskStore((state) => state.restartTask)
  const currentTask = useTaskStore((state) => state.taskList.currentTaskId)

  useEffect(() => {
    console.log(currentTask)
  }, [currentTask])

  const handleRestart = (): void => {
    restartTask(task.id)
  }

  const handleReject = (): void => {
    rejectTask(task.id)
  }

  const handleAccept = (): void => {
    acceptTask(task.id)
    onClose()
  }

  return (
    <div
      className={`w-full ${task.id == currentTask ? 'border border-cyan-500' : ''} ${task.available ? 'bg-zinc-900 p-4 hover:bg-zinc-800' : 'text-gray-500 hover:text-gray-300 bg-zinc-950 p-4 hover:bg-zinc-900 '} transition-colors rounded-lg mb-4 flex flex-col`}
    >
      <div className="flex justify-between items-center">
        <div className="items-start flex flex-col">
          <h2 className={`${task.completed && 'line-through'} text-lg font-bold mb-2`}>
            {task.label || task.id}
          </h2>
          <p className="text-gray-300">{task.description}</p>
          <p className="text-gray-500 italic">
            {task.started
              ? 'Task has been started'
              : task.available
                ? 'Task has not been started'
                : 'Task is not available'}
          </p>
        </div>
        <div className="flex-shrink-0 flex">
          {task.completed ? (
            <Button
              className="bg-amber-500 group gap-2 flex italic text-gray-200 hover:text-white transition-colors mx-2 my-5"
              onClick={handleRestart}
            >
              <p>Restart Task</p>
              <IconReload className="group-hover:stroke-2 stroke-1" />
            </Button>
          ) : !task.started ? (
            !task.available ? (
              <Button
                className="bg-gray-700 group gap-2 flex italic text-gray-400 hover:text-white transition-colors mx-2 my-5"
                onClick={handleAccept}
              >
                <p>Force Start Task</p>
                <IconReload className="group-hover:stroke-2 stroke-1" />
              </Button>
            ) : (
              <Button
                className="bg-green-500 group gap-2 flex italic text-gray-200 hover:text-white transition-colors mx-2 my-5"
                onClick={handleAccept}
              >
                <p>Start Task</p>
                <IconPlay className="group-hover:stroke-2 stroke-1" />
              </Button>
            )
          ) : (
            <>
              <Button
                className="bg-green-500 group gap-2 flex italic text-gray-200 hover:text-white transition-colors mx-2 my-5"
                onClick={handleAccept}
              >
                {task.currentStep ? (
                  <p>Continue From Step {task.currentStep}</p>
                ) : (
                  <p>Continue Task</p>
                )}
                <IconLink className="group-hover:stroke-2 stroke-1" />
              </Button>
              <Button
                className="bg-red-500 group gap-2 flex italic text-gray-200 hover:text-white transition-colors mx-2 my-5"
                onClick={handleReject}
              >
                <p>Stop Task</p>
                <IconStop className="group-hover:stroke-2 stroke-1" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default TasksPage
