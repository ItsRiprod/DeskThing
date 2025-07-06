import { IconReload, IconPlay, IconLink, IconStop } from '@renderer/assets/icons'
import useTaskStore from '@renderer/stores/taskStore'
import { Step, Task } from '@deskthing/types'
import { FC, useMemo } from 'react'
import Button from '../Button'
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
      className={`w-full ${task.id == currentTask?.id ? 'border border-cyan-500' : ''} ${task.available ? (task.completed ? 'bg-zinc-950 p-4 hover:bg-zinc-900' : 'bg-zinc-900 p-4 hover:bg-zinc-800') : 'text-gray-500 hover:text-gray-300 bg-zinc-950 p-4 hover:bg-zinc-900 '} transition-colors rounded-lg mb-4 flex flex-col`}
    >
      <div className="flex justify-between items-center">
        <div className="items-start flex flex-col">
          <div className="flex gap-2 items-center">
            <h2
              className={`${task.completed && 'line-through text-gray-500'} text-lg font-bold mb-2`}
            >
              {task.label || task.id}
            </h2>
            {task.started && (
              <div>
                <p className="text-gray-400 text-sm">
                  {currentStepNumber}
                  {' / '}
                  {stepCount}
                </p>
              </div>
            )}
          </div>
          <p className={`${task.completed ? 'text-gray-500' : 'text-gray-300'}`}>
            {task.description}
          </p>
          <div className="text-gray-500 italic gap-2 flex items-center">
            <p>{task.source}</p>
            <p>{task.version}</p>
            {'-'}
            <p>
              {task.started
                ? 'Task has been started'
                : task.available
                  ? 'Task has not been started'
                  : 'Task is not available'}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 flex">
          {task.completed ? (
            <Button
              className="bg-amber-950 hover:bg-amber-900 group gap-2 flex italic text-gray-200 hover:text-white transition-colors mx-2 my-5"
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

export default TaskComponent
