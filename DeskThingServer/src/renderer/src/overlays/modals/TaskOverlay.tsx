import {
  IconArrowDown,
  IconExpand,
  IconGrip,
  IconLink,
  IconMinimize,
  IconReload,
  IconStop,
  IconX
} from '@renderer/assets/icons'
import Button from '@renderer/components/buttons/Button'
import ErrorBoundary from '@renderer/components/ErrorBoundary'
import TaskBase from '@renderer/components/tasks/TaskBase'
import useTaskStore from '@renderer/stores/taskStore'
import { Task } from '@deskthing/types'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const TaskOverlay: React.FC = () => {
  const tasks = useTaskStore((state) => state.taskList)
  const currentTaskId = useTaskStore((state) => state.currentTask)
  const rejectTask = useTaskStore((state) => state.rejectTask)
  const restartTask = useTaskStore((state) => state.restartTask)
  const clearTask = useTaskStore((state) => state.removeCurrentTask)

  const [searchParams, setSearchParams] = useSearchParams()

  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const currentTask = useMemo(() => {
    if (
      currentTaskId &&
      tasks[currentTaskId.source][currentTaskId.id] &&
      tasks[currentTaskId.source][currentTaskId.id].started
    ) {
      return tasks[currentTaskId.source][currentTaskId.id]
    }
    return undefined
  }, [tasks, currentTaskId]) as Task | undefined

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [expanded, setExpanded] = useState(true)
  const [position, setPosition] = useState({
    x: 0,
    y: 0
  })

  const taskRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!taskRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      if (taskRef.current) {
        const maxX = window.innerWidth - taskRef.current.offsetWidth
        const maxY = window.innerHeight - taskRef.current.offsetHeight

        setPosition((prev) => ({
          x: prev.x > maxX ? maxX : prev.x,
          y: prev.y > maxY ? maxY : prev.y
        }))
      }
    })

    resizeObserver.observe(taskRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (!currentTask || !currentTask.currentStep) {
      setCurrentStepIndex(-1)
    } else {
      const index = Object.values(currentTask.steps).findIndex(
        (step) => step.id == currentTask.currentStep
      )

      setCurrentStepIndex(index)
    }
  }, [currentTask?.currentStep])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    const handleResize = (): void => {
      if (taskRef.current) {
        setPosition({
          x: Math.min(window.innerWidth - taskRef.current.offsetWidth, position.x),
          y: Math.min(window.innerHeight - taskRef.current.offsetHeight, position.y)
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('resize', handleResize)
    }
  }, [isDragging, dragOffset, position])

  const toggleFullscreen = (): void => {
    setIsFullscreen(!isFullscreen)
    setExpanded(!isFullscreen || expanded)
  }

  const handleMouseDown = (e: React.MouseEvent): void => {
    if (isFullscreen) return
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = (e: MouseEvent): void => {
    if (!isDragging || isFullscreen) return
    const newX = Math.min(
      Math.max(0, e.clientX - dragOffset.x),
      window.innerWidth - (taskRef.current?.offsetWidth || 0)
    )
    const newY = Math.min(
      Math.max(0, e.clientY - dragOffset.y),

      window.innerHeight - (taskRef.current?.offsetHeight || 0)
    )
    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = (): void => {
    setIsDragging(false)
  }

  const openTasks = (): void => {
    searchParams.set('page', 'task')
    searchParams.set('notifications', 'true')
    setSearchParams(searchParams)
  }

  const handleRestart = (): void => {
    if (!currentTaskId) return
    openTasks()
    restartTask(currentTaskId.id, currentTaskId.source)
  }

  const handleReject = (): void => {
    if (!currentTaskId) return
    rejectTask(currentTaskId.source, currentTaskId.id)
  }

  const handleExpand = (): void => {
    if (!currentTaskId) return
    setExpanded(!expanded)
  }

  const memoizedTaskBase = useMemo(
    () =>
      currentTask && currentTaskId ? (
        <TaskBase task={currentTask} source={currentTaskId.source} />
      ) : (
        <div>Unable to load task</div>
      ),
    [currentTask, currentTaskId?.source]
  )

  return (
    <div
      ref={taskRef}
      style={
        isFullscreen
          ? {}
          : {
              transform: `translate(${position.x}px, ${position.y}px)`
            }
      }
      className={`fixed rounded-lg overflow-hidden bg-zinc-950/70 border-neutral-800 backdrop-blur-md border top-0 left-0 select-none flex ${isFullscreen ? 'min-w-full min-h-full transition-[min-height,min-width,transform,backdrop]' : ''} min-w-0 min-h-0 items-center flex-col justify-center z-50 shadow-2xl`}
    >
      <div className={`flex flex-col justify-center w-full`}>
        <div className="flex justify-between">
          <div className="flex">
            {!isFullscreen && (
              <div
                style={{
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                className="text-white hover:text-gray-300 py-3 px-1 flex items-center justify-center"
                onMouseDown={handleMouseDown}
              >
                <IconGrip iconSize={32} />
              </div>
            )}
            <Button
              title={isFullscreen ? 'Minimize' : 'Expand'}
              className="text-white items-center transition-colors hover:text-gray-300"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <IconMinimize /> : <IconExpand />}
            </Button>
          </div>
          <div className="flex items-center">
            <Button
              title={expanded ? 'Collapse' : 'Expand'}
              onClick={handleExpand}
              className={`gap-2 items-center ${expanded ? 'text-gray-300 hover:text-white' : ''}`}
            >
              <p>{currentTask?.label || currentTask?.id}</p>
              <p>
                {currentTask &&
                  currentStepIndex != -1 &&
                  `${currentStepIndex + 1}/${Object.values(currentTask.steps).length}`}
              </p>
              <IconArrowDown
                className={`${!expanded ? 'rotate-180' : 'rotate-0'} transition-transform`}
              />
            </Button>
            <Button title="Close Task" onClick={clearTask} className="group hover:bg-zinc-950">
              <IconX className="group-hover:stroke-red-500" />
            </Button>
          </div>
        </div>
        <div
          className={`${expanded ? 'max-h-screen' : 'max-h-0'} transition-[max-height] overflow-hidden`}
        >
          <ErrorBoundary fallback={(reset) => <div onClick={reset}>Error - Click to refresh</div>}>
            <div>{memoizedTaskBase}</div>
          </ErrorBoundary>
          <div className="flex p-2 gap-3 text-sm justify-between w-full">
            <Button
              title="View All Tasks"
              onClick={openTasks}
              className="gap-1 text-gray-400 hover:text-white items-center transition-colors hover:bg-zinc-900"
            >
              <p>All Tasks</p>
              <IconLink iconSize={12} />
            </Button>
            <Button
              title="Restart Current Task"
              onClick={handleRestart}
              className="gap-1 text-gray-400 hover:text-white items-center transition-colors hover:bg-zinc-900"
            >
              <p>Restart Task</p>
              <IconReload iconSize={12} />
            </Button>
            {!currentTask?.completed && (
              <Button
                title="Cancel the current task"
                onClick={handleReject}
                className="gap-1 text-gray-400 hover:text-white items-center transition-colors hover:bg-red-600"
              >
                <p>Cancel Task</p>
                <IconStop iconSize={12} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskOverlay
