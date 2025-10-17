import { DebugStep, Step, STEP_TYPES } from '@deskthing/types'
import { FC, lazy, memo, Suspense, useMemo, useState } from 'react'
import Button from '../buttons/Button'
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconLink,
  IconLoading
} from '@renderer/assets/icons'
import useTaskStore from '@renderer/stores/taskStore'
import { useSearchParams } from 'react-router-dom'
import { TaskProps } from '@shared/types'
import { useReward } from 'react-rewards' // <-- Add this import

import TaskStepComponent from './TaskStep'
import TaskActionComponent from './TaskAction'
import TaskExternalComponent from './TaskExternal'
import TaskSettingComponent from './TaskSetting'
import TaskShortcutComponent from './TaskShortcut'
import TaskTaskComponent from './TaskTask'
import { StepImage } from './StepImage'

function renderStepWithCorrectType(step: Step, source: string): JSX.Element | undefined {
  switch (step.type) {
    case STEP_TYPES.STEP:
      return <TaskStepComponent step={step} source={source} />
    case STEP_TYPES.ACTION:
      return <TaskActionComponent step={step} source={source} />
    case STEP_TYPES.SHORTCUT:
      return <TaskShortcutComponent step={step} source={source} />
    case STEP_TYPES.SETTING:
      return <TaskSettingComponent step={step} source={source} />
    case STEP_TYPES.TASK:
      return <TaskTaskComponent step={step} source={source} />
    case STEP_TYPES.EXTERNAL:
      return <TaskExternalComponent step={step} source={source} />
    default:
      return
  }
}

type ConfettiConfig = {
  lifetime?: number
  angle?: number
  decay?: number
  spread?: number
  startVelocity?: number
  elementCount?: number
  elementSize?: number
  zIndex?: number
  position?: string
  colors?: string[]
  onAnimationComplete?: () => void
}

export const TaskBase: FC<TaskProps> = memo(
  ({ task, source }: TaskProps) => {
    const confettiConfig: ConfettiConfig = {
      startVelocity: 6,
      elementCount: 20,
      decay: 0.99
    }
    const { reward } = useReward('taskCompleteConfetti', 'confetti', confettiConfig)

    const currentStep: Extract<Step, { type: STEP_TYPES }> | undefined = useMemo(() => {
      return task?.currentStep ? { ...task.steps[task.currentStep], parentId: task.id } : undefined
    }, [task?.currentStep, task?.id])

    const currentType = currentStep?.type

    const currentStepIndex = useMemo(() => {
      return currentStep?.id && task ? Object.keys(task.steps).indexOf(currentStep?.id) : -1
    }, [currentStep?.id, task?.steps])

    const [uiState, setUiState] = useState({
      showDebug: false,
      showImage: true,
      confettiFired: false
    })

    const nextStep = useTaskStore((state) => state.nextStep)
    const previousStep = useTaskStore((state) => state.prevStep)
    const removeCurrentTask = useTaskStore((state) => state.removeCurrentTask)
    const [searchParams, setSearchParams] = useSearchParams()

    const handlers = useMemo(
      () => ({
        handleNextStep: () => task && nextStep(task.id, source),
        handlePreviousStep: () => task && previousStep(task.id, source),
        handleToggleDebug: () => setUiState((prev) => ({ ...prev, showDebug: !prev.showDebug })),
        openTasks: (): void => {
          searchParams.set('page', 'task')
          searchParams.set('notifications', 'true')
          setSearchParams(searchParams)
          removeCurrentTask()
        }
      }),
      [task?.id, nextStep, previousStep, searchParams, removeCurrentTask]
    )

    const StepComponentSection = useMemo(() => {
      if (!currentStep || !currentType) return null
      return renderStepWithCorrectType(currentStep, source)
    }, [currentStep, currentType, task?.id, source])

    const DebugComponent = lazy(() => import('./TaskDebug'))

    const DebugSection = memo(
      ({ debugging }: { debugging: Record<string, DebugStep> }) => {
        return (
          <div className="flex flex-col gap-2 px-2">
            {task &&
              Object.entries(debugging).map(([key, debug]) => (
                <Suspense key={key} fallback={<IconLoading />}>
                  <DebugComponent step={debug} />
                </Suspense>
              ))}
          </div>
        )
      },
      (prev, next) => {
        return Object.keys(prev.debugging)?.length === Object.keys(next.debugging)?.length
      }
    )
    DebugSection.displayName = 'DebugSection'

    // Confetti trigger on task completion
    // Only trigger once per completion
    if (task?.completed && task.currentStep === undefined && !uiState.confettiFired) {
      setUiState((state) => ({ ...state, confettiFired: true }))
      setTimeout(() => reward(), 100) // slight delay for DOM
    }
    if (!task?.completed || task.currentStep !== undefined) {
      if (uiState.confettiFired) setUiState((state) => ({ ...state, confettiFired: false }))
    }

    return (
      <div className={`w-full bg-zinc-900/75 rounded-lg shadow-lg flex flex-col`}>
        <div className="flex items-center">
          {currentStepIndex > 0 && (
            <Button
              title="Go to previous step"
              onClick={handlers.handlePreviousStep}
              className="group hover:bg-zinc-900/50 transition-colors"
            >
              <IconArrowLeft className="stroke-1 group-hover:stroke-2" />
            </Button>
          )}
          <div className="p-4 w-full">
            {task?.completed && task.currentStep === undefined ? (
              <div className="w-full flex-col flex-grow h-full flex items-center justify-center">
                <p className="text-xl">Task Completed</p>
                <Button
                  onClick={handlers.openTasks}
                  className="bg-zinc-950 justify-center hover:bg-zinc-900 gap-2 items-center"
                  id="taskCompleteConfetti"
                >
                  <p>Go back to all tasks</p>
                  <IconLink iconSize={18} />
                </Button>
              </div>
            ) : (
              <div className="flex gap-4 flex-col">
                {currentStep?.imageId && (
                  <Button
                    className={`relative overflow-hidden w-full flex items-center justify-center group border-neutral-500 border hover:bg-zinc-800/75 transition-all !p-0 self-end ${uiState.showImage ? 'h-64' : 'h-8'}`}
                    onClick={() =>
                      setUiState((prev) => ({
                        ...prev,
                        showImage: !prev.showImage
                      }))
                    }
                  >
                    {uiState.showImage ? (
                      <div className="group-hover:opacity-100  transition-opacity bg-zinc-900/75 opacity-0 w-full h-full flex items-center justify-center absolute z-10">
                        <p>Hide Image</p>
                      </div>
                    ) : (
                      'Show Image'
                    )}
                    {uiState.showImage && (
                      <div className="relative w-full h-64 flex items-center justify-center">
                        <StepImage
                          imageId={currentStep.imageId}
                          source={source}
                          className="absolute object-contain"
                        />
                      </div>
                    )}
                  </Button>
                )}
                <Suspense key={currentStepIndex} fallback={<IconLoading />}>
                  {currentStep && task ? (
                    StepComponentSection
                  ) : (
                    <>
                      <p>No step selected</p>
                      <Button
                        className="items-center gap-2 bg-zinc-700 hover:bg-zinc-600"
                        onClick={handlers.handleNextStep}
                      >
                        <p>Go to first step</p>
                        <IconLink />
                      </Button>
                    </>
                  )}
                </Suspense>
              </div>
            )}
          </div>
          {task?.currentStep !== undefined && (
            <Button
              disabled={!currentStep?.completed}
              title={currentStep?.completed ? 'Go to next step' : 'Disabled - Step Not Completed'}
              onClick={handlers.handleNextStep}
              className="group hover:bg-zinc-900/50 transition-colors"
            >
              <IconArrowRight
                className={`stroke-1 ${currentStep?.completed ? 'group-hover:stroke-2' : 'text-gray-500'}`}
              />
            </Button>
          )}
        </div>
        {currentStep?.debugging && (
          <div className="bg-zinc-950 overflow-auto max-h-[50vh]">
            <Button onClick={handlers.handleToggleDebug}>
              {uiState.showDebug ? 'Hide Debugging Steps' : 'Show Debugging Steps'}
              {uiState.showDebug ? <IconArrowUp /> : <IconArrowDown />}
            </Button>
            <div className="flex flex-col gap-2 px-2">
              {uiState.showDebug && <DebugSection debugging={currentStep.debugging} />}
            </div>
          </div>
        )}
      </div>
    )
  },
  (prev, next) => {
    return (
      prev.task?.id === next.task?.id &&
      prev.task?.currentStep === next.task?.currentStep &&
      prev.task?.completed === next.task?.completed &&
      Object.keys(prev.task?.steps ?? {}).length === Object.keys(next.task?.steps ?? {}).length
    )
  }
)

TaskBase.displayName = 'TaskBase'
export default TaskBase
