import { Step, STEP_TYPES, Task } from '@shared/types/tasks'
import { FC, memo, useEffect, useState } from 'react'
import TaskStep from './TaskStep'
import TaskAction from './TaskAction'
import TaskShortcut from './TaskShortcut'
import TaskSetting from './TaskSetting'
import TaskTask from './TaskTask'
import TaskExternal from './TaskExternal'
import Button from '../Button'
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconLink
} from '@renderer/assets/icons'
import useTaskStore from '@renderer/stores/taskStore'
import { useSearchParams } from 'react-router-dom'

export type TaskProps = {
  task: Task
}

export type StepProps = {
  step: Step
}

const Steps: Record<STEP_TYPES, FC<StepProps>> = {
  [STEP_TYPES.STEP]: TaskStep,
  [STEP_TYPES.ACTION]: TaskAction,
  [STEP_TYPES.SHORTCUT]: TaskShortcut,
  [STEP_TYPES.SETTING]: TaskSetting,
  [STEP_TYPES.TASK]: TaskTask,
  [STEP_TYPES.EXTERNAL]: TaskExternal
}
export const TaskBase: FC<TaskProps> = memo(({ task }: TaskProps) => {
  const [currentStep, setCurrentStep] = useState<Step | undefined>(
    (task.currentStep && { ...task.steps[task.currentStep], parentId: task.id }) || undefined
  )
  const [showDebug, setShowDebug] = useState(false)
  const nextStep = useTaskStore((state) => state.nextStep)
  const previousStep = useTaskStore((state) => state.prevStep)
  const [searchParams, setSearchParams] = useSearchParams()
  const removeCurrentTask = useTaskStore((state) => state.removeCurrentTask)

  useEffect(() => {
    task.currentStep && setCurrentStep({ ...task.steps[task.currentStep], parentId: task.id })
  }, [task.currentStep])

  if (!currentStep) {
    return null
  }

  const handleNextStep = (): void => {
    nextStep(task.id)
  }
  const handlePreviousStep = (): void => {
    previousStep(task.id)
  }

  const CurrentStepComponent = Steps[currentStep.type]

  const handleToggleDebug = (): void => {
    setShowDebug(!showDebug)
  }

  const openTasks = (): void => {
    searchParams.set('page', 'task')
    searchParams.set('notifications', 'true')
    setSearchParams(searchParams)
    removeCurrentTask()
  }

  return (
    <div className={`w-full bg-zinc-800 rounded-lg shadow-lg flex flex-col`}>
      <div className="flex items-center">
        <Button onClick={handlePreviousStep} className="group">
          <IconArrowLeft className="stroke-1 group-hover:stroke-2" />
        </Button>
        <div className="p-4 w-full">
          {task.completed && task.currentStep === undefined ? (
            <div className="w-full flex-col flex-grow h-full flex items-center justify-center">
              <p className="text-xl">Task Completed</p>
              <Button
                onClick={openTasks}
                className="bg-zinc-950 hover:bg-zinc-900 gap-2 items-center"
              >
                <p>Go back to all tasks</p>
                <IconLink iconSize={18} />
              </Button>
            </div>
          ) : (
            <div className="flex gap-4 flex-col">
              <CurrentStepComponent step={currentStep} />
            </div>
          )}
        </div>
        <Button onClick={handleNextStep} className="group">
          <IconArrowRight className="stroke-1 group-hover:stroke-2" />
        </Button>
      </div>
      {currentStep.debugging && (
        <div className="bg-zinc-950 overflow-auto max-h-[50vh]">
          <Button onClick={handleToggleDebug}>
            {showDebug ? 'Hide Debugging Steps' : 'Show Debugging Steps'}
            {showDebug ? <IconArrowUp /> : <IconArrowDown />}
          </Button>
          <div className="flex flex-col gap-2 px-2">
            {showDebug &&
              Object.values(currentStep.debugging).map((debug, index) => (
                <div key={index}>
                  <DebugComponent debugStep={{ ...debug, completed: false } as Step} />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
})

type DebugComponentProps = {
  debugStep: Step
}

const DebugComponent = ({ debugStep }: DebugComponentProps): JSX.Element => {
  const CurrentStepComponent = Steps[debugStep.type]

  return (
    <div className="">
      <CurrentStepComponent step={debugStep} />
    </div>
  )
}
TaskBase.displayName = 'TaskBase'

export default TaskBase
