import { vi, describe, expect, it } from 'vitest'
import {
  isValidTaskList,
  isValidTask,
  isValidStep,
  isValidTaskAction,
  isValidTaskShortcut,
  isValidTaskSetting,
  isValidTaskTask,
  isValidTaskExternal,
  isValidTaskStep
} from '@server/services/task/taskUtils'
import { STEP_TYPES } from '@shared/types/tasks'

vi.mock('@server/stores/Logger', () => ({
  default: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('@server/services/mappings/utilsMaps', () => ({
  isValidActionReference: vi.fn().mockReturnValue(true)
}))

describe('taskUtils', () => {
  describe('isValidTaskList', () => {
    it('should reject null or undefined input', () => {
      expect(isValidTaskList({})).toEqual({
        isValid: false,
        error: 'TaskList must be an object'
      })
      expect(isValidTaskList({})).toEqual({
        isValid: false,
        error: 'TaskList must be an object'
      })
    })

    it('should reject taskList without version', () => {
      expect(isValidTaskList({ tasks: {} })).toEqual({
        isValid: false,
        error: '[ValidateTaskList] TaskList does not have an ID'
      })
    })

    it('should reject taskList with invalid tasks', () => {
      expect(
        isValidTaskList({
          version: '1.0.0',
          tasks: {
            task1: {
              id: 'task1',
              source: '',
              version: '1.0.0',
              started: false,
              completed: false,
              label: 'Test Task'
            }
          }
        })
      ).toEqual({
        isValid: false,
        error: '[ValidateTask] Task task1 does not have a source'
      })
    })
  })

  describe('isValidTask', () => {
    it('should reject null or undefined input', () => {
      expect(isValidTask(null)).toEqual({
        isValid: false,
        error: 'Task must be an object'
      })
      expect(isValidTask(undefined)).toEqual({
        isValid: false,
        error: 'Task must be an object'
      })
    })

    it('should reject task without required properties', () => {
      expect(isValidTask({})).toEqual({
        isValid: false,
        error: '[ValidateTask] Tasks must have an ID'
      })

      expect(isValidTask({ id: 'task1' })).toEqual({
        isValid: false,
        error: '[ValidateTask] Task task1 does not have a source'
      })

      expect(isValidTask({ id: 'task1', source: 'test' })).toEqual({
        isValid: false,
        error: '[ValidateTask] Task task1 from test must have a specified version'
      })

      expect(isValidTask({ id: 'task1', source: 'test', version: '1.0.0' })).toEqual({
        isValid: false,
        error: '[ValidateTask] Task task1 from test must have at least one specified step'
      })
    })
  })

  describe('isValidStep', () => {
    it('should validate basic step properties', () => {
      expect(isValidStep({})).toEqual({
        isValid: false,
        error: '[ValidateStep] Step must have an ID'
      })

      expect(isValidStep({ id: 'step1' })).toEqual({
        isValid: false,
        error: '[ValidateStep] Step step1 does not have a type'
      })

      expect(isValidStep({ id: 'step1', type: 'invalid' })).toEqual({
        isValid: false,
        error: '[ValidateStep] Step step1 has invalid type invalid'
      })
    })
  })

  describe('isValidTaskAction', () => {
    it('should validate action step requirements', () => {
      const invalidAction = {
        id: 'step1',
        type: STEP_TYPES.ACTION
      }
      expect(isValidTaskAction(invalidAction)).toEqual({
        isValid: false,
        error: '[ValidateTaskAction] Step step1 is not a valid action'
      })
    })
  })

  describe('isValidTaskSetting', () => {
    it('should validate setting step requirements', () => {
      const invalidSetting = {
        id: 'step1',
        type: STEP_TYPES.SETTING,
        setting: {
          type: 'invalid-type',
          label: 'Test'
        }
      }
      expect(isValidTaskSetting(invalidSetting)).toEqual({
        isValid: false,
        error: '[ValidateTaskSetting] Step step1 has invalid setting type'
      })

      const noLabel = {
        id: 'step1',
        type: STEP_TYPES.SETTING,
        setting: {
          type: 'boolean'
        }
      }
      expect(isValidTaskSetting(noLabel)).toEqual({
        isValid: false,
        error: '[ValidateTaskSetting] Step step1 setting does not have a label'
      })
    })
  })

  describe('isValidTaskExternal', () => {
    it('should validate external step requirements', () => {
      const validExternal = {
        id: 'step1',
        type: STEP_TYPES.EXTERNAL,
        url: 'https://example.com'
      }
      expect(isValidTaskExternal(validExternal)).toEqual({
        isValid: true,
        error: ''
      })

      const invalidExternal = {
        id: 'step1',
        type: STEP_TYPES.EXTERNAL
      }
      expect(isValidTaskExternal(invalidExternal)).toEqual({
        isValid: false,
        error: '[ValidateTaskExternal] Step step1 does not have a url'
      })
    })
  })

  describe('isValidTaskShortcut', () => {
    it('should validate shortcut step requirements', () => {
      const validShortcut = {
        id: 'step1',
        type: STEP_TYPES.SHORTCUT,
        destination: '/some/path'
      }
      expect(isValidTaskShortcut(validShortcut)).toEqual({
        isValid: true,
        error: ''
      })

      const invalidShortcut = {
        id: 'step1',
        type: STEP_TYPES.SHORTCUT
      }
      expect(isValidTaskShortcut(invalidShortcut)).toEqual({
        isValid: false,
        error: '[ValidateTaskShortcut] Step step1 does not have a destination'
      })
    })
  })

  describe('isValidTaskTask', () => {
    it('should validate task step requirements', () => {
      const validTask = {
        id: 'step1',
        type: STEP_TYPES.TASK,
        taskId: 'task1'
      }
      expect(isValidTaskTask(validTask)).toEqual({
        isValid: true,
        error: ''
      })

      const invalidTask = {
        id: 'step1',
        type: STEP_TYPES.TASK
      }
      expect(isValidTaskTask(invalidTask)).toEqual({
        isValid: false,
        error: '[ValidateTaskTask] Step step1 does not have a taskId'
      })
    })
  })

  describe('isValidTaskStep', () => {
    it('should validate basic step requirements', () => {
      const validStep = {
        id: 'step1',
        type: STEP_TYPES.STEP
      }
      expect(isValidTaskStep(validStep)).toEqual({
        isValid: true,
        error: ''
      })

      const invalidStep = {
        id: 'step1',
        type: STEP_TYPES.ACTION
      }
      expect(isValidTaskStep(invalidStep)).toEqual({
        isValid: false,
        error: '[ValidateStep] Step step1 is not a step'
      })
    })
  })
})
