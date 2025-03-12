import { Step, STEP_TYPES, Task } from '@deskthing/types'

export type TaskReference = {
  id: string
  source: string
  version: string
  available?: boolean
  completed: boolean
  label: string
  started: false
  description?: string
}

export type FullTaskList = Record<string, Record<string, Task>>

export type TaskProps = {
  task?: Task
  source: string
}

export interface BaseStepProps {
  debug?: boolean
  source: string
}

export type StepComponentProps<S extends Step> = BaseStepProps & {
  step: S
}

export type StepPropsMap = {
  [T in STEP_TYPES]: StepComponentProps<Extract<Step, { type: T }>>
}
