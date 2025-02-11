import { FC, useEffect, useState } from 'react'
import { StepProps } from './TaskBase'
import ActionElement from '../ActionElement'
import useMappingStore from '@renderer/stores/mappingStore'
import Button from '../Button'
import { IconCheck, IconX } from '@renderer/assets/icons'
import useTaskStore from '@renderer/stores/taskStore'
import { STEP_TYPES } from '@DeskThing/types'

export const TaskAction: FC<StepProps> = ({ step, source }) => {
  if (step.type != STEP_TYPES.ACTION) return <div>Not an action</div>
  const getAction = useMappingStore((state) => state.getActionFromReference)
  const resolveStep = useTaskStore((state) => state.resolveStep)
  const [action, setAction] = useState(typeof step.action == 'string' ? undefined : step.action)
  const [stepCompleted, setIsComplete] = useState(step.completed)

  useEffect(() => {
    const fetchAction = async (actionId: string): Promise<void> => {
      const action = getAction({ id: actionId, source: source })
      if (action) {
        setAction(action)
      } else {
        console.log('Unable to find action')
      }
    }
    if (typeof step.action == 'string') {
      fetchAction(step.action)
    }
  }, [step])

  const handleComplete = async (): Promise<void> => {
    if (!step.parentId) {
      console.error('Step does not have a parent task id! It cannot resolve')
      return
    }
    resolveStep(step.parentId, step.id)
  }

  const handleSubmit = (): void => {
    setIsComplete(true)
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <h2 className="text-xl">{step?.label}</h2>
        <p className="text-italic">{step?.instructions}</p>
      </div>
      {action && <ActionElement onTrigger={handleSubmit} action={{ ...action, source: source }} />}
      {step.debug != true && (
        <Button
          className={`w-full justify-center group ${stepCompleted ? 'bg-green-700 hover:bg-green-600' : 'bg-zinc-950 text-gray-500'}`}
          disabled={step.strict && !stepCompleted}
          title={`${stepCompleted ? 'Confirm Completion' : step.strict ? 'Run Action First' : 'Continue Anyway'}`}
          onClick={handleComplete}
        >
          {stepCompleted || !step.strict ? <p>Mark as Completed</p> : <p>Run Action</p>}
          {stepCompleted || !step.strict ? <IconCheck /> : <IconX />}
        </Button>
      )}
    </div>
  )
}
export default TaskAction
