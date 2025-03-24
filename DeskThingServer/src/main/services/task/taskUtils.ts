import { isValidAction } from '../mappings/mapsValidation'
import { Step, STEP_TYPES, Task } from '@DeskThing/types'
import { TaskReference, FullTaskList } from '@shared/types'

export function isValidTaskList(taskList: unknown): asserts taskList is FullTaskList {
  if (!taskList || typeof taskList !== 'object') throw new Error('TaskList must be an object')
  const t = taskList as Partial<FullTaskList>
  if (!t.version) {
    throw new Error('[ValidateTaskList] TaskList must have a version')
  }
  if (!t.tasks || typeof t.tasks !== 'object' || Object.values(t.tasks).length === 0) {
    throw new Error('[ValidateTaskList] TaskList must have at least one task')
  } else {
    Object.values(t.tasks).forEach((task) => {
      if (task.started == false) {
        // Task is a reference or assumed to be a reference
        isValidTaskReference(task)
      } else {
        // Task is a task
        isValidTask(task)
      }
    })
  }
}

export function isValidTask(task: unknown): asserts task is Task {
  if (!task || typeof task !== 'object') throw new Error('Task must be an object')
  const t = task as Partial<Task>

  if (!t.id) {
    throw new Error('[ValidateTask] Tasks must have an ID')
  }
  if (!t.source) {
    throw new Error(`[ValidateTask] Task ${t.id} does not have a source`)
  }
  if (!t.version) {
    throw new Error(`[ValidateTask] Task ${t.id} from ${t.source} must have a specified version`)
  }
  if (!t.steps || typeof t.steps !== 'object' || Object.values(t.steps).length === 0) {
    throw new Error(
      `[ValidateTask] Task ${t.id} from ${t.source} must have at least one specified step`
    )
  } else {
    Object.values(t.steps).forEach((step) => {
      isValidStep(step)
    })
  }
}

export function isValidTaskReference(task: unknown): asserts task is TaskReference {
  if (!task || typeof task !== 'object') throw new Error('Task must be an object')
  const t = task as Partial<TaskReference>

  if (!t.id) {
    throw new Error('[ValidateTaskReference] Tasks must have an ID')
  }
  if (!t.source) {
    throw new Error(`[ValidateTaskReference] Task ${t.id} does not have a source`)
  }
  if (!t.version) {
    throw new Error(
      `[ValidateTaskReference] Task ${t.id} from ${t.source} must have a specified version`
    )
  }
  if (t.started !== false) {
    throw new Error(
      `[ValidateTaskReference] Task reference ${t.id} from ${t.source} must have started set to false`
    )
  }
  if (typeof t.completed !== 'boolean') {
    throw new Error(
      `[ValidateTaskReference] Task reference ${t.id} from ${t.source} must have completed status`
    )
  }
  if (!t.label) {
    throw new Error(
      `[ValidateTaskReference] Task reference ${t.id} from ${t.source} must have a label`
    )
  }
}
export function isValidStep(step: unknown): asserts step is Step {
  if (!step || typeof step !== 'object') throw new Error('Step must be an object')
  const s = step as Partial<Step>

  if (!s.id) {
    throw new Error('[ValidateStep] Step must have an ID')
  }
  if (!s.type) {
    throw new Error(`[ValidateStep] Step ${s.id} does not have a type`)
  }

  switch (s.type) {
    case STEP_TYPES.ACTION:
      isValidTaskAction(s)
      break
    case STEP_TYPES.SHORTCUT:
      isValidTaskShortcut(s)
      break
    case STEP_TYPES.SETTING:
      isValidTaskSetting(s)
      break
    case STEP_TYPES.TASK:
      isValidTaskTask(s)
      break
    case STEP_TYPES.EXTERNAL:
      isValidTaskExternal(s)
      break
    case STEP_TYPES.STEP:
      isValidTaskStep(s)
      break
    default:
      throw new Error(`[ValidateStep] Step ${s.id} has invalid type ${s.type}`)
  }
}

export const sanitizeTaskList = (taskList: Partial<FullTaskList>): FullTaskList => {
  const updatedTaskList = {
    version: taskList.version || '1.0.0',
    tasks: taskList.tasks
      ? Object.fromEntries(
          Object.values(taskList.tasks).map((task) => [task.id, sanitizeTask(task)])
        )
      : {},
    currentTaskId: taskList.currentTaskId || ''
  }
  return updatedTaskList as FullTaskList
}

/**
 * Do not use this - its depreciated and should never be implemented
 * @param taskList
 * @returns
 * @deprecated - The task list is never saved as a global file
 */
export const sanitizeTaskListFile = (taskList: Partial<FullTaskList>): FullTaskList => {
  const updatedTaskList = {
    version: taskList.version || '1.0.0',
    tasks: taskList.tasks
      ? Object.fromEntries(
          Object.values(taskList.tasks).map((task) => [
            `${task.source}.${task.id}`,
            task.source === 'server' ? sanitizeTask(task) : sanitizeTaskReference(task)
          ])
        )
      : {},
    currentTaskId: ''
  }
  return updatedTaskList as unknown as FullTaskList
}

export const sanitizeTaskReference = (task: Partial<TaskReference | Task>): TaskReference => {
  const updatedTask = {
    id: task.id || '',
    source: task.source || '',
    version: task.version || '1.0.0',
    available: task.available ?? false,
    completed: task.completed ?? false,
    label: task.label || task.id || '',
    started: false,
    description: task.description || ''
  }
  return updatedTask as TaskReference
}

export const sanitizeTask = (task: Partial<Task>, source?: string): Task => {
  const updatedTask = {
    id: task.id || '',
    source: task.source || source || '',
    version: task.version || '1.0.0',
    available: task.available ?? false,
    completed: task.completed ?? false,
    label: task.label || task.id || '',
    started: task.started ?? false,
    currentStep: task.currentStep || '',
    description: task.description || '',
    steps: task.steps
      ? Object.fromEntries(
          Object.entries(task.steps).map(([key, step]) => [
            step.id || key,
            sanitizeStep(step, task.source || source || '', task.id || step.id || key)
          ])
        )
      : {}
  }
  return updatedTask as Task
}
export const sanitizeStep = (step: Partial<Step>, source?: string, parentId?: string): Step => {
  if (!step.type) {
    throw new Error('Step must have a type')
  }
  const newStep: Omit<Step, 'type'> = {
    id: step.id || '',
    parentId: step.parentId || parentId,
    completed: step.completed ?? false,
    debug: step.debug,
    strict: step.strict,
    source: source || '',
    label: step.label,
    instructions: step.instructions,
    debugging: step.debugging
  }
  switch (step.type) {
    case STEP_TYPES.ACTION:
      return {
        ...newStep,
        type: STEP_TYPES.ACTION,
        // Should be fixed with a sanitized action but that does not exist yet
        action: step.action ? step.action : { id: 'unknown', source: 'server' }
      }
    case STEP_TYPES.SHORTCUT:
      return {
        ...newStep,
        type: STEP_TYPES.SHORTCUT,
        destination: step.destination || ''
      }
    case STEP_TYPES.SETTING:
      return {
        ...newStep,
        type: STEP_TYPES.SETTING,
        // Should be fixed with a sanitized setting but that does not exist yet
        setting: step.setting ? step.setting : { id: 'unknown' }
      }
    case STEP_TYPES.TASK:
      return {
        ...newStep,
        type: STEP_TYPES.TASK,
        taskReference: step.taskReference
      }
    case STEP_TYPES.EXTERNAL:
      return {
        ...newStep,
        type: STEP_TYPES.EXTERNAL,
        url: step.url || ''
      }
    case STEP_TYPES.STEP:
      return {
        ...newStep,
        type: STEP_TYPES.STEP
      }
    default:
      throw new Error(`Invalid step type: ${step.type}`)
  }
}
function validateStepBase(
  step: unknown,
  expectedType: (typeof STEP_TYPES)[keyof typeof STEP_TYPES]
): asserts step is Step {
  if (!step || typeof step !== 'object') throw new Error('Step must be an object')
  const s = step as Partial<Step>

  if (!s.type) {
    throw new Error('[ValidateStep] Step must have a type')
  }
  if (s.type !== expectedType) {
    throw new Error(`[ValidateStep] Step ${s.id} is not a ${expectedType}`)
  }
}

export function isValidTaskAction(
  step: unknown
): asserts step is Extract<Step, { type: STEP_TYPES.ACTION }> {
  validateStepBase(step, STEP_TYPES.ACTION)
  const s = step as Partial<Extract<Step, { type: STEP_TYPES.ACTION }>>

  if (!s.action) {
    throw new Error(`[ValidateTaskAction] Step ${s.id} does not have an action`)
  }

  if (typeof s.action === 'string') {
    return // early break for string keys
  }

  const action = s.action
  isValidAction({ ...action, source: 'test' })
}

export function isValidTaskShortcut(
  step: unknown
): asserts step is Extract<Step, { type: STEP_TYPES.SHORTCUT }> {
  validateStepBase(step, STEP_TYPES.SHORTCUT)
  const s = step as Partial<Extract<Step, { type: STEP_TYPES.SHORTCUT }>>

  if (!s.destination) {
    throw new Error(`[ValidateTaskShortcut] Step ${s.id} does not have a destination`)
  }
}

export function isValidTaskSetting(
  step: unknown
): asserts step is Extract<Step, { type: STEP_TYPES.SETTING }> {
  validateStepBase(step, STEP_TYPES.SETTING)
  const s = step as Partial<Extract<Step, { type: STEP_TYPES.SETTING }>>

  if (!s.setting) {
    throw new Error(`[ValidateTaskSetting] Step ${s.id} does not have a setting`)
  }
  const validTypes = [
    'boolean',
    'list',
    'multiselect',
    'number',
    'range',
    'ranked',
    'select',
    'string',
    'color'
  ] as const

  if (!('type' in s.setting)) {
    if (!s.setting.id) throw new Error(`[ValidateTaskSetting] Step ${s.id} does not have an id`)
    return // early break for string types
  }

  if (!s.setting.type || !validTypes.includes(s.setting.type)) {
    throw new Error(`[ValidateTaskSetting] Step ${s.id} has invalid setting type`)
  }
  if (!s.setting.label) {
    throw new Error(`[ValidateTaskSetting] Step ${s.id} setting does not have a label`)
  }
}

export function isValidTaskTask(
  step: unknown
): asserts step is Extract<Step, { type: STEP_TYPES.TASK }> {
  validateStepBase(step, STEP_TYPES.TASK)
  const s = step as Partial<Extract<Step, { type: STEP_TYPES.TASK }>>

  if (!s.taskReference || !s.taskReference.source || !s.taskReference.id) {
    throw new Error(`[ValidateTaskTask] Step ${s.id} does not have a taskId`)
  }
}

export function isValidTaskExternal(
  step: unknown
): asserts step is Extract<Step, { type: STEP_TYPES.EXTERNAL }> {
  validateStepBase(step, STEP_TYPES.EXTERNAL)
  const s = step as Partial<Extract<Step, { type: STEP_TYPES.EXTERNAL }>>

  if (s.url) {
    if (typeof s.url !== 'string') {
      throw new Error(`[ValidateTaskExternal] Step ${s.id} url must be a string`)
    }
  }
}

export function isValidTaskStep(
  step: unknown
): asserts step is Extract<Step, { type: STEP_TYPES.STEP }> {
  validateStepBase(step, STEP_TYPES.STEP)
}
