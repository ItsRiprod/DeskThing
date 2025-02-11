import { Step, STEP_TYPES } from '@DeskThing/types'
import { FC } from 'react'
import TaskAction from './TaskAction'
import { StepProps } from './TaskBase'
import TaskExternal from './TaskExternal'
import TaskSetting from './TaskSetting'
import TaskShortcut from './TaskShortcut'
import TaskStep from './TaskStep'
import TaskTask from './TaskTask'

type DebugStep = Omit<Step, 'completed'> & {
  readonly type: STEP_TYPES
}

type StepComponent = FC<StepProps>
type StepComponents = Record<STEP_TYPES, StepComponent>

const Steps: StepComponents = {
  [STEP_TYPES.STEP]: TaskStep,
  [STEP_TYPES.ACTION]: TaskAction,
  [STEP_TYPES.SHORTCUT]: TaskShortcut,
  [STEP_TYPES.SETTING]: TaskSetting,
  [STEP_TYPES.TASK]: TaskTask,
  [STEP_TYPES.EXTERNAL]: TaskExternal
}

type DebugComponentProps = {
  debugStep: DebugStep
  source: string
}

export const DebugComponent = ({ debugStep, source }: DebugComponentProps): JSX.Element => {
  const CurrentStepComponent = Steps[debugStep.type]

  return (
    <div className="">
      <CurrentStepComponent
        source={source}
        step={{ ...debugStep, debug: true, completed: false, strict: true } as Step}
      />
    </div>
  )
}

export default DebugComponent
