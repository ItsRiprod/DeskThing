import { Step } from '@shared/types/tasks'
import { FC, memo, useMemo, useState } from 'react'
import TaskStep from './TaskStep'
import TaskAction from './TaskAction'
import TaskShortcut from './TaskShortcut'
import TaskSetting from './TaskSetting'
import TaskTask from './TaskTask'
import TaskExternal from './TaskExternal'
import { IconArrowDown } from '@renderer/assets/icons'
import Button from '../Button'

export type TaskProps = {
  step: Step
  taskId: string
}

const Steps: Record<Step['type'], FC<TaskProps>> = {
  step: TaskStep,
  action: TaskAction,
  shortcut: TaskShortcut,
  setting: TaskSetting,
  task: TaskTask,
  external: TaskExternal
}
export const TaskBase: FC<TaskProps> = memo(({ step, taskId }: TaskProps) => {
  const [expanded, setIsExpanded] = useState(false)
  const Component = useMemo(() => Steps[step.type], [step.type])

  const handleClick = (): void => {
    setIsExpanded(!expanded)
  }

  return (
    <div
      className={`${expanded ? 'overflow-y-auto max-h-96' : 'overflow-hidden max-h-16'} px-2 transition-[maxHeight] w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 flex flex-col items-between justify-center`}
    >
      <div className="flex h-16 justify-between items-center">
        <Button onClick={handleClick}>
          <IconArrowDown />
          <p>{step.label || step.id}</p>
        </Button>
        <p className="text-zinc-500 italic text-sm">{step.instructions}</p>
      </div>
      {expanded && (
        <div>
          <Component step={step} taskId={taskId} />
        </div>
      )}
    </div>
  )
})

TaskBase.displayName = 'TaskBase'

export default TaskBase
