import { IconReload, IconPlay, IconLink, IconStop } from '@renderer/assets/icons'
import useTaskStore from '@renderer/stores/taskStore'
import { Step, Task } from '@deskthing/types'
import { FC, useMemo } from 'react'
import Button from '../buttons/Button'

interface TaskComponentProps {
  task: Task
  onClose: () => void
}

const getCurrentStepNumber = (
  steps: Record<string, Step>,
  currentStep: string | undefined
): number => Object.values(steps).findIndex((step) => step.id === currentStep) + 1

const TaskComponent: FC<TaskComponentProps> = ({ task, onClose }) => {
  const acceptTask = useTaskStore((state) => state.acceptTask)
  const rejectTask = useTaskStore((state) => state.rejectTask)
  const restartTask = useTaskStore((state) => state.restartTask)
  const currentTask = useTaskStore((state) => state.currentTask)

  const stepCount = useMemo(() => Object.values(task.steps)?.length, [task.steps])
  const currentStepNumber = useMemo(
    () => getCurrentStepNumber(task.steps, task.currentStep),
    [task.steps, task.currentStep]
  )

  const handleRestart = (): void => {
    restartTask(task.id, task.source)
  }

  const handleReject = (): void => {
    rejectTask(task.id, task.source)
  }

  const handleAccept = (): void => {
    acceptTask(task.id, task.source)
    onClose()
  }

  return (
    <div
      className={`
        w-full
        rounded-lg
        border
        ${task.id == currentTask?.id ? 'border-cyan-500' : 'border-neutral-800'}
        ${
          task.available
            ? task.completed
              ? 'bg-zinc-950 hover:bg-zinc-900'
              : 'bg-zinc-900 hover:bg-zinc-800'
            : 'bg-zinc-950 text-gray-500 hover:text-gray-300 hover:bg-zinc-900'
        }
        transition-colors
        mb-2
        px-4 py-3
        flex flex-col
        gap-2
      `}
    >
      <div className="flex justify-between items-center gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2
              className={`
                text-base font-semibold truncate
                ${task.completed ? 'line-through text-gray-500' : 'text-white'}
              `}
              title={task.label || task.id}
            >
              {task.label || task.id}
            </h2>
            {task.started && (
              <span className="text-xs text-gray-400">
                {currentStepNumber} / {stepCount}
              </span>
            )}
          </div>
          <p className={`text-xs truncate ${task.completed ? 'text-gray-500' : 'text-gray-300'}`}>
            {task.description}
          </p>
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span>{task.source}</span>
            <span>{task.version}</span>
            <span>-</span>
            <span>{task.started ? 'Started' : task.available ? 'Not started' : 'Unavailable'}</span>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {task.completed ? (
            <Button
              className="bg-transparent border border-amber-900 hover:bg-amber-950 text-amber-300 px-2 py-1 rounded transition-colors text-xs"
              onClick={handleRestart}
              title="Restart Task"
            >
              <IconReload className="w-4 h-4" />
            </Button>
          ) : !task.started ? (
            !task.available ? (
              <Button
                className="bg-transparent border border-gray-700 text-gray-400 hover:bg-gray-800 px-2 py-1 rounded transition-colors text-xs"
                onClick={handleAccept}
                title="Force Start Task"
              >
                <IconReload className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors text-xs"
                onClick={handleAccept}
                title="Start Task"
              >
                <IconPlay className="w-4 h-4" />
              </Button>
            )
          ) : (
            <>
              <Button
                className="bg-cyan-700 hover:bg-cyan-800 text-white px-2 py-1 rounded transition-colors text-xs"
                onClick={handleAccept}
                title="Continue Task"
              >
                <IconLink className="w-4 h-4" />
              </Button>
              <Button
                className="bg-transparent border border-red-900 text-red-400 hover:bg-red-950 px-2 py-1 rounded transition-colors text-xs"
                onClick={handleReject}
                title="Stop Task"
              >
                <IconStop className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskComponent
