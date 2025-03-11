import { FC, useState } from 'react'
import useTaskStore from '@renderer/stores/taskStore'
import Button from '../Button'
import { IconCheck, IconLink, IconX } from '@renderer/assets/icons'
import { STEP_TYPES } from '@DeskThing/types'
import { StepPropsMap } from '@shared/types'

export const TaskExternalComponent: FC<StepPropsMap[STEP_TYPES.EXTERNAL]> = ({ step, source }) => {
  const [stepCompleted, setStepCompleted] = useState(step.url ? false : true)
  const completeStep = useTaskStore((state) => state.resolveStep)

  const handleComplete = (): void => {
    if (!step.parentId) {
      console.error('Step does not have a parent task id! It cannot resolve')
      return
    }
    completeStep(step.parentId, step.id, source)
  }

  const handleLinkPress = (): void => {
    if (step.url) {
      window.open(step.url, '_blank')
    }
    setStepCompleted(true)
  }

  return (
    <div className="flex flex-col justify-between gap-5">
      <div>
        <h2 className="text-2xl">{step?.label}</h2>
        <p>{step?.instructions}</p>
      </div>
      <div className="flex justify-between gap-5">
        {step.url && (
          <Button className="w-full bg-cyan-700 hover:bg-cyan-600 gap-2" onClick={handleLinkPress}>
            <p className="text-nowrap">Go to {step.url}</p>
            <IconLink />
          </Button>
        )}
        {step.debug != true && (
          <Button
            className={`w-full justify-center group ${stepCompleted ? 'bg-green-700 hover:bg-green-600' : 'bg-zinc-950 text-gray-500'}`}
            disabled={step.strict && !stepCompleted}
            title={`${stepCompleted ? 'Confirm Completion' : step.strict ? 'Complete task first' : 'Continue Anyway'}`}
            onClick={handleComplete}
          >
            {stepCompleted || !step.url ? <p>Mark as Completed</p> : <p>Open Link First</p>}
            {stepCompleted || !step.url ? <IconCheck /> : <IconX />}
          </Button>
        )}
      </div>
    </div>
  )
}
export default TaskExternalComponent
