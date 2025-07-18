import React, { useMemo, useState, useRef, useEffect } from 'react'
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
  // Sort apps by number of incomplete tasks (descending)
  const appEntries = Object.entries(tasks).map(([appId, appTasks]) => {
    const sortedTasks = Object.values(appTasks).sort((a, b) => {
      if (!a.completed && b.completed) return -1
      if (a.completed && !b.completed) return 1
      if (a.started && !b.started) return -1
      if (!a.started && b.started) return 1
      if (a.available && !b.available) return -1
      if (!a.available && b.available) return 1
      return (a.label || '').localeCompare(b.label || '')
    })
    return { appId, sortedTasks }
  })

  appEntries.sort((a, b) => {
    const aIncomplete = a.sortedTasks.filter((t) => !t.completed).length
    const bIncomplete = b.sortedTasks.filter((t) => !t.completed).length
    return bIncomplete - aIncomplete
  })

  return Object.fromEntries(
    appEntries
      .filter((entry) => entry.sortedTasks.length > 0) // only include apps that have tasks
      .map(({ appId, sortedTasks }) => [appId, sortedTasks]) // map them to correctly make the hashmap
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

  // --- Scroll & Highlight Logic ---
  const appIds = Object.keys(sortedTasks)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [activeAppId, setActiveAppId] = useState(appIds[0] || '')

  // Set up refs for each app section
  useEffect(() => {
    appIds.forEach((id) => {
      if (!sectionRefs.current[id]) {
        sectionRefs.current[id] = null
      }
    })
  }, [appIds])

  // IntersectionObserver to track which app section is in view
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const observer = new window.IntersectionObserver(
      (entries) => {
        const visible: { appId: string; ratio: number }[] = []
        entries.forEach((entry) => {
          const appId = (entry.target as HTMLDivElement).dataset.appid
          if (appId && entry.isIntersecting) {
            visible.push({ appId, ratio: entry.intersectionRatio })
          }
        })
        if (visible.length > 0) {
          // Pick the most visible section
          visible.sort((a, b) => b.ratio - a.ratio)
          setActiveAppId(visible[0].appId)
        }
      },
      {
        root: container,
        threshold: [0.3, 0.6, 0.9]
      }
    )

    appIds.forEach((appId) => {
      const ref = sectionRefs.current[appId]
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [appIds])

  // Scroll to section when icon clicked
  const handleAppIconClick = (appId: string): void => {
    const ref = sectionRefs.current[appId]
    if (ref && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      // Scroll so that the section's top aligns with the scroll container's top
      const top = ref.offsetTop - container.offsetTop + 120
      container.scrollTo({
        top,
        behavior: 'smooth'
      })

      setActiveAppId(appId)
    }
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
      <div className="flex-grow flex">
        <div
          className="h-full flex flex-col items-center justify-center px-4 gap-3"
          style={{
            transition: 'transform 0.3s',
            transform: `translateY(${
              appIds.length > 0
                ? (appIds.indexOf(activeAppId) - Math.floor(appIds.length / 2)) * -14
                : 0
            }px)`
          }}
        >
          {appIds.map((appId) => (
            <button
              key={appId}
              className={`transition-all duration-200 ${
                activeAppId === appId ? 'scale-125' : 'scale-100 opacity-50 hover:opacity-100'
              }`}
              onClick={() => handleAppIconClick(appId)}
              aria-label={findAppName(appId)}
            >
              <AppIcon
                appId={appId}
                className={`!w-6 !h-6 text-white fill-white ${
                  activeAppId === appId ? 'opacity-100' : 'opacity-5'
                }`}
              />
            </button>
          ))}
        </div>
        <div className="flex-grow relative overflow-y-auto" ref={scrollContainerRef}>
          <div className="absolute inset-0 w-full h-full">
            {Object.entries(sortedTasks).map(
              ([appId, tasks]) =>
                tasks?.length > 0 && (
                  <div
                    key={appId}
                    ref={(el) => (sectionRefs.current[appId] = el)}
                    data-appid={appId}
                  >
                    <div className="flex gap-3 w-full py-4">
                      <AppIcon appId={appId} className="!w-6 !h-6 text-white fill-white" />
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
    </div>
  )
}

export default TasksPage
