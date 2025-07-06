import { DebugStep, Step, STEP_TYPES } from '@deskthing/types'
import { FC, lazy, memo, Suspense, useMemo, useState } from 'react'
import Button from '../Button'
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

import TaskStepComponent from './TaskStep'
import TaskActionComponent from './TaskAction'
import TaskExternalComponent from './TaskExternal'
import TaskSettingComponent from './TaskSetting'
import TaskShortcutComponent from './TaskShortcut'
import TaskTaskComponent from './TaskTask'

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

export const TaskBase: FC<TaskProps> = memo(
  ({ task, source }: TaskProps) => {
    const currentStep: Extract<Step, { type: STEP_TYPES }> | undefined = useMemo(() => {
      return task?.currentStep ? { ...task.steps[task.currentStep], parentId: task.id } : undefined
    }, [task?.currentStep, task?.id])

    const currentType = currentStep?.type

    const currentStepIndex = useMemo(() => {
      return currentStep?.id && task ? Object.keys(task.steps).indexOf(currentStep?.id) : -1
    }, [currentStep?.id, task?.steps])

    const [uiState, setUiState] = useState({
      showDebug: false
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

    return (
      <div className={`w-full bg-zinc-800 rounded-lg shadow-lg flex flex-col`}>
        <div className="flex items-center">
          {currentStepIndex > 0 && (
            <Button
              title="Go to previous step"
              onClick={handlers.handlePreviousStep}
              className="group"
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
                  className="bg-zinc-950 hover:bg-zinc-900 gap-2 items-center"
                >
                  <p>Go back to all tasks</p>
                  <IconLink iconSize={18} />
                </Button>
              </div>
            ) : (
              <div className="flex gap-4 flex-col">
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
              className="group"
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
