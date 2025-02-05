import { Step, STEP_TYPES, Task } from '@shared/types/tasks'
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

export type TaskProps = {
  task: Task
}

export type StepProps = {
  step: Step
}

type StepComponent = FC<StepProps>
type StepComponents = Record<STEP_TYPES, StepComponent>

const Steps: StepComponents = {
  [STEP_TYPES.STEP]: lazy(() => import('./TaskStep')),
  [STEP_TYPES.ACTION]: lazy(() => import('./TaskAction')),
  [STEP_TYPES.SHORTCUT]: lazy(() => import('./TaskShortcut')),
  [STEP_TYPES.SETTING]: lazy(() => import('./TaskSetting')),
  [STEP_TYPES.TASK]: lazy(() => import('./TaskTask')),
  [STEP_TYPES.EXTERNAL]: lazy(() => import('./TaskExternal'))
}
export const TaskBase: FC<TaskProps> = memo(
  ({ task }: TaskProps) => {
    const currentStep = useMemo(() => {
      return task.currentStep ? { ...task.steps[task.currentStep], parentId: task.id } : undefined
    }, [task.currentStep, task.id])

    const currentStepIndex = useMemo(() => {
      return task.currentStep ? Object.keys(task.steps).indexOf(task.currentStep) : -1
    }, [task.currentStep, task.id])

    const [uiState, setUiState] = useState({
      showDebug: false
    })

    const nextStep = useTaskStore((state) => state.nextStep)
    const previousStep = useTaskStore((state) => state.prevStep)
    const removeCurrentTask = useTaskStore((state) => state.removeCurrentTask)
    const [searchParams, setSearchParams] = useSearchParams()

    const handlers = useMemo(
      () => ({
        handleNextStep: () => nextStep(task.id),
        handlePreviousStep: () => previousStep(task.id),
        handleToggleDebug: () => setUiState((prev) => ({ ...prev, showDebug: !prev.showDebug })),
        openTasks: (): void => {
          searchParams.set('page', 'task')
          searchParams.set('notifications', 'true')
          setSearchParams(searchParams)
          removeCurrentTask()
        }
      }),
      [task.id, nextStep, previousStep, searchParams, removeCurrentTask]
    )

    const StepComponent = useMemo(
      () => (currentStep?.type ? Steps[currentStep.type] : undefined),
      [currentStep?.type]
    )

    const DebugComponent = lazy(() => import('./TaskDebug'))

    const DebugSection = memo(
      ({ debugging }: { debugging: { [key: string]: Omit<Step, 'completed'> } }) => {
        return (
          <div className="flex flex-col gap-2 px-2">
            {Object.entries(debugging).map(([key, debug]) => (
              <Suspense key={key} fallback={<IconLoading />}>
                <DebugComponent debugStep={debug} />
              </Suspense>
            ))}
          </div>
        )
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
            {task.completed && task.currentStep === undefined ? (
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
                <Suspense fallback={<IconLoading />}>
                  {currentStep ? (
                    StepComponent && <StepComponent step={currentStep} />
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
          {task.currentStep !== undefined && (
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
      prev.task.id === next.task.id &&
      prev.task.currentStep === next.task.currentStep &&
      prev.task.completed === next.task.completed &&
      Object.keys(prev.task.steps).length === Object.keys(next.task.steps).length
    )
  }
)

TaskBase.displayName = 'TaskBase'

export default TaskBase
