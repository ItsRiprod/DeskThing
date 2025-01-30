import {
  Step,
  STEP_TYPES,
  Task,
  TaskAction,
  TaskList,
  TaskReference,
  TaskSetting,
  TaskShortcut,
  TaskTask
} from '@shared/types/tasks'
import { isValidActionReference } from '../mappings/utilsMaps'
import { SettingsBase } from '@shared/types'

interface ValidationResult {
  isValid: boolean
  error: string
}

export function isValidTaskList(taskList: Partial<TaskList>): ValidationResult {
  if (!taskList || typeof taskList !== 'object')
    return { isValid: false, error: 'TaskList must be an object' }

  if (!taskList.version) {
    return { isValid: false, error: '[ValidateTaskList] TaskList does not have an ID' }
  }
  if (!taskList.tasks || typeof taskList.tasks !== 'object') {
    return { isValid: false, error: '[ValidateTaskList] TaskList does not have any tasks' }
  }

  if (taskList.currentTaskId && !taskList.tasks[taskList.currentTaskId]) {
    return {
      isValid: false,
      error: '[ValidateTaskList] CurrentTaskId references non-existent task'
    }
  }

  for (const taskId of Object.keys(taskList.tasks)) {
    const taskValidation = taskList.tasks[taskId].started
      ? isValidTask(taskList.tasks[taskId]) // task is started thus has steps
      : isValidTaskReference(taskList.tasks[taskId])
    if (!taskValidation.isValid) {
      return taskValidation
    }
  }
  return { isValid: true, error: '' }
}

export function sanitizeTaskList(taskList: TaskList): TaskList {
  const sanitized = { ...taskList }

  if (sanitized.currentTaskId) {
    if (!sanitized.tasks[sanitized.currentTaskId]) {
      sanitized.currentTaskId = undefined
    } else {
      sanitized.tasks[sanitized.currentTaskId].started = true
    }
  }

  return sanitized
}

export function isValidTaskReference(task: unknown): ValidationResult {
  if (!task || typeof task !== 'object') return { isValid: false, error: 'Task must be an object' }
  const t = task as Partial<TaskReference>

  if (!t.id) {
    return { isValid: false, error: '[ValidateTask] Tasks must have an ID' }
  }
  if (!t.source) {
    return { isValid: false, error: `[ValidateTask] Task ${t.id} does not have a source` }
  }
  if (!t.version) {
    return {
      isValid: false,
      error: `[ValidateTask] Task ${t.id} from ${t.source} must have a specified version`
    }
  }

  return { isValid: true, error: '' }
}

export function isValidTask(task: unknown): ValidationResult {
  if (!task || typeof task !== 'object') return { isValid: false, error: 'Task must be an object' }
  const t = task as Partial<Task>

  if (!t.id) {
    return { isValid: false, error: '[ValidateTask] Tasks must have an ID' }
  }
  if (!t.source) {
    return { isValid: false, error: `[ValidateTask] Task ${t.id} does not have a source` }
  }
  if (!t.version) {
    return {
      isValid: false,
      error: `[ValidateTask] Task ${t.id} from ${t.source} must have a specified version`
    }
  }
  if (!t.steps || typeof t.steps !== 'object' || Object.values(t.steps).length === 0) {
    return {
      isValid: false,
      error: `[ValidateTask] Task ${t.id} from ${t.source} must have at least one specified step`
    }
  }

  for (const step of Object.values(t.steps)) {
    const stepValidation = isValidStep(step)
    if (!stepValidation.isValid) {
      return stepValidation
    }
  }
  return { isValid: true, error: '' }
}

export function isValidStep(step: unknown): ValidationResult {
  if (!step || typeof step !== 'object') return { isValid: false, error: 'Step must be an object' }
  const s = step as Partial<Step>

  if (!s.id) {
    return { isValid: false, error: '[ValidateStep] Step must have an ID' }
  }
  if (!s.type) {
    return { isValid: false, error: `[ValidateStep] Step ${s.id} does not have a type` }
  }

  switch (s.type) {
    case STEP_TYPES.ACTION:
      return isValidTaskAction(s)
    case STEP_TYPES.SHORTCUT:
      return isValidTaskShortcut(s)
    case STEP_TYPES.SETTING:
      return isValidTaskSetting(s)
    case STEP_TYPES.TASK:
      return isValidTaskTask(s)
    case STEP_TYPES.EXTERNAL:
      return isValidTaskExternal(s)
    case STEP_TYPES.STEP:
      return isValidTaskStep(s)
    default:
      return { isValid: false, error: `[ValidateStep] Step ${s.id} has invalid type ${s.type}` }
  }
}

function validateStepBase(
  step: unknown,
  expectedType: (typeof STEP_TYPES)[keyof typeof STEP_TYPES]
): ValidationResult {
  if (!step || typeof step !== 'object') return { isValid: false, error: 'Step must be an object' }
  const s = step as Partial<Step>

  if (!s.type) {
    return { isValid: false, error: '[ValidateStep] Step must have a type' }
  }
  if (s.type !== expectedType) {
    return { isValid: false, error: `[ValidateStep] Step ${s.id} is not a ${expectedType}` }
  }
  return { isValid: true, error: '' }
}

export function isValidTaskAction(step: unknown): ValidationResult {
  const baseValidation = validateStepBase(step, STEP_TYPES.ACTION)
  if (!baseValidation.isValid) return baseValidation
  const s = step as Partial<TaskAction>

  if (!s.action || !isValidActionReference(s.action)) {
    return { isValid: false, error: `[ValidateTaskAction] Step ${s.id} is not a valid action` }
  }
  return { isValid: true, error: '' }
}

export function isValidTaskShortcut(step: unknown): ValidationResult {
  const baseValidation = validateStepBase(step, STEP_TYPES.SHORTCUT)
  if (!baseValidation.isValid) return baseValidation
  const s = step as Partial<TaskShortcut>

  if (!s.destination) {
    return {
      isValid: false,
      error: `[ValidateTaskShortcut] Step ${s.id} does not have a destination`
    }
  }
  return { isValid: true, error: '' }
}

export function isValidTaskSetting(step: unknown): ValidationResult {
  const baseValidation = validateStepBase(step, STEP_TYPES.SETTING)
  if (!baseValidation.isValid) return baseValidation
  const s = step as Partial<TaskSetting>

  if (!s.setting) {
    return { isValid: false, error: `[ValidateTaskSetting] Step ${s.id} does not have a setting` }
  }
  const validTypes: SettingsBase['type'][] = [
    'boolean',
    'list',
    'multiselect',
    'number',
    'range',
    'ranked',
    'select',
    'string',
    'color'
  ]
  if (!s.setting.type || !validTypes.includes(s.setting.type)) {
    return { isValid: false, error: `[ValidateTaskSetting] Step ${s.id} has invalid setting type` }
  }
  if (!s.setting.label) {
    return {
      isValid: false,
      error: `[ValidateTaskSetting] Step ${s.id} setting does not have a label`
    }
  }
  return { isValid: true, error: '' }
}

export function isValidTaskTask(step: unknown): ValidationResult {
  const baseValidation = validateStepBase(step, STEP_TYPES.TASK)
  if (!baseValidation.isValid) return baseValidation
  const s = step as Partial<TaskTask>

  if (!s.taskId) {
    return { isValid: false, error: `[ValidateTaskTask] Step ${s.id} does not have a taskId` }
  }
  return { isValid: true, error: '' }
}

export function isValidTaskExternal(step: unknown): ValidationResult {
  const baseValidation = validateStepBase(step, STEP_TYPES.EXTERNAL)
  if (!baseValidation.isValid) return baseValidation

  return { isValid: true, error: '' }
}

export function isValidTaskStep(step: unknown): ValidationResult {
  const baseValidation = validateStepBase(step, STEP_TYPES.STEP)
  if (!baseValidation.isValid) return baseValidation
  return { isValid: true, error: '' }
}
