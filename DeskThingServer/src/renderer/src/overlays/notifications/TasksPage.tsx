import React, { useMemo, useState } from 'react'
import useTaskStore from '@renderer/stores/taskStore'
import { Task } from '@deskthing/types'
import { FullTaskList } from '@shared/types'
import { useSearchParams } from 'react-router-dom'
import TaskComponent from '@renderer/components/tasks/TaskComponent'
import Button from '@renderer/components/Button'
import { IconRefresh } from '@renderer/assets/icons'
import { useAppStore } from '@renderer/stores'
import { AppIcon } from '@renderer/components/AppIcon'

const sortTasks = (tasks: FullTaskList): Record<string, Task[]> => {
  return Object.fromEntries(
    Object.entries(tasks).map(([appId, tasks]) => {
      const sortedTasks = Object.values(tasks).sort((a, b) => {
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
      if (sortedTasks.length == 0) {
        return ['', []]
      }
      return [appId, sortedTasks]
    })
  )
}

const TasksPage: React.FC = () => {
  const tasks = useTaskStore((state) => state.taskList)
  const requestTasks = useTaskStore((state) => state.requestTasks)
  const [searchParams, setSearchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const apps = useAppStore((state) => state.appsList)

  const sortedTasks = useMemo(() => sortTasks(tasks), [tasks])

  const onClose = (): void => {
    searchParams.delete('notifications')
    setSearchParams(searchParams)
  }

  const handleRefreshTasks = async (): Promise<void> => {
    setIsLoading(true)
    await requestTasks()
    setTimeout(
      () => {
        setIsLoading(false)
      },
      Math.random() * 1000 + 500
    )
  }

  const findAppName = (appId: string): string => {
    return apps.find((app) => app.name === appId)?.manifest?.label || appId
  }

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold mb-4">Tasks</h1>
        <Button
          onClick={handleRefreshTasks}
          className="hover:bg-neutral-900 rounded-xl"
          title="Refresh Tasks"
        >
          <IconRefresh className={`${isLoading ? 'animate-spin-smooth text-gray-500' : ''}`} />
        </Button>
      </div>
      <div className="bg-red-950 px-4 py-1 rounded-lg shadow-lg mb-2">
        <p className="text-xs italic text-gray-300">Tasks are still under development</p>
      </div>
      <div className="w-full h-full relative overflow-y-auto">
        <div className="absolute inset-0 w-full h-full">
          {Object.entries(sortedTasks).map(
            ([appId, tasks]) =>
              tasks.length > 0 && (
                <div key={appId}>
                  <div className="flex gap-3 w-full py-4 border-t border-zinc-800">
                    <AppIcon appId={appId} className="!w-6 !h-6" />
                    <p>{findAppName(appId)}</p>
                  </div>
                  <div>
                    {tasks.map((task) => (
                      <TaskComponent key={task.id} task={task} onClose={onClose} />
                    ))}
                  </div>
                </div>
              )
          )}
        </div>
      </div>
    </div>
  )
}

export default TasksPage
