/**
 * A task is a unit of work that should be executed and followed by the user to complete
 * a task list is a list of the tasks that the user must complete. There should only be one task list
 * A TaskStep is a stage in the task that progresses the user towards finishing the task
 * A TaskAction is a phase in a task that requires the user to make a choice / run an action to complete the task
 * A TaskShortcut is a button that will navigate the user to another part of the application
 * A TaskSetting is a phase in the task that requires a user to input data of some kind
 *
 * Once a step is completed, the step object will be passed with TaskStep object with the parentId set to the id of the task
 */

import { SettingsType } from './app'
import { Action, ActionReference } from './maps'

/**
 * The way tasks are stored in the database
 */
export interface TaskList {
  version: string
  tasks: { [key: string]: Task }
}

/**
 * A task is a unit of work that should be executed and followed by the user to complete.
 */
export type Task = {
  id: string
  source: string
  version: string
  completed: boolean
  label: string
  started: boolean
  description?: string
  steps: { [key: string]: Step }
}

export type Step = TaskStep | TaskAction | TaskShortcut | TaskSetting | TaskTask | TaskExternal

/**
 * A step in a task that is required to be completed before the task can be resolved.
 */
export interface TaskStep {
  parentId?: string
  id: string
  type: 'step'
  label?: string
  instructions?: string
  completed: boolean
  // Debugging steps if it does not work. These will all be resolved immediately once step is resolved
  debugging?: { [key: string]: Omit<Step, 'completed'> }
}

/**
 * A step in a task that requires the user to run an action to complete the task.
 * @params action - The action to run to complete the task
 */
export interface TaskAction extends Omit<TaskStep, 'type'> {
  type: 'action'
  action: Action | ActionReference
}

/**
 * A task that the user can complete themselves
 */
export interface TaskExternal extends Omit<TaskStep, 'type'> {
  type: 'external'
  url?: string
}

/**
 * A task for completing another task. Clicking this one will accept the other task if it exists and will not resolve until you complete the other task
 * @params taskId - The id of the task to complete
 */
export interface TaskTask extends Omit<TaskStep, 'type'> {
  type: 'task'
  taskId: string
}

/**
 * A step in a task that requires the user to navigate to another part of the application.
 * @params destination - The destination to navigate to
 */
export interface TaskShortcut extends Omit<TaskStep, 'type'> {
  type: 'shortcut'
  destination: string
}

/**
 * A step in a task that requires the user to input data of some kind.
 * All settings here will be added to the app's settings automatically
 * @params setting - The setting to set
 */
export interface TaskSetting extends Omit<TaskStep, 'type'> {
  type: 'setting'
  setting: SettingsType
}

export const STEP_TYPES = {
  ACTION: 'action',
  SHORTCUT: 'shortcut',
  SETTING: 'setting',
  TASK: 'task',
  EXTERNAL: 'external',
  STEP: 'step'
} as const
