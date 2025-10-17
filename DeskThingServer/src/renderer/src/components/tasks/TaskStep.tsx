import { FC, useState } from 'react'
import useTaskStore from '@renderer/stores/taskStore'
import Button from '../buttons/Button'
import { IconCheck, IconLoading } from '@renderer/assets/icons'
import { STEP_TYPES } from '@deskthing/types'
import { StepPropsMap } from '@shared/types'

export const TaskStepComponent: FC<StepPropsMap[STEP_TYPES.STEP]> = ({ step, source }) => {
  const [loading, setLoading] = useState(true)
  const completeStep = useTaskStore((state) => state.resolveStep)

  setTimeout(() => {
    setLoading(false)
  }, 2000)

  const handleComplete = (): void => {
    if (!step.parentId) {
      console.error('Step does not have a parent task id! It cannot resolve')
      return
    }
    completeStep(step.parentId, step.id, source)
  }

  return (
    <div>
      {step ? (
        <>
          <h2 className="text-2xl">{step?.label}</h2>
          <p>{step.instructions}</p>
          <p>Task Step</p>
          <div className="w-full items-center flex justify-end">
            {!step.debug && (
              <Button
                title={step.strict && !step.completed ? 'Complete task first' : 'Continue Anyway'}
                disabled={step.completed ? false : loading || (step.strict && !step.completed)}
                className="group bg-green-700 hover:bg-green-600 disabled:bg-zinc-950 disabled:text-gray-500"
                onClick={handleComplete}
              >
                {step.completed
                  ? 'Mark as Completed'
                  : loading || step.strict
                    ? 'Waiting for Completion'
                    : 'Mark as Completed'}
                {step.completed ? (
                  <IconCheck />
                ) : loading || step.strict ? (
                  <IconLoading />
                ) : (
                  <IconCheck />
                )}
              </Button>
            )}
          </div>
        </>
      ) : (
        <p>No step found</p>
      )}
    </div>
  )
}
export default TaskStepComponent
