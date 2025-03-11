import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { TaskStore } from '../../../src/main/stores/taskStore'
import { AppDataStoreClass } from '@shared/stores/appDataStore'
import { AppStoreClass } from '@shared/stores/appStore'
import { STEP_TYPES, Task } from '@deskthing/types'
vi.mock('@server/utils/logger', () => ({
  default: {
    log: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

describe('TaskStore', () => {
  let taskStore: TaskStore
  let mockAppDataStore: AppDataStoreClass
  let mockAppStore: AppStoreClass

  beforeEach(() => {
    mockAppDataStore = {
      getTasks: vi.fn(),
      getTask: vi.fn(),
      getStep: vi.fn(),
      delTasks: vi.fn(),
      getTaskList: vi.fn()
    } as unknown as AppDataStoreClass

    mockAppStore = {
      onAppMessage: vi.fn(),
      sendDataToApp: vi.fn()
    } as unknown as AppStoreClass

    taskStore = new TaskStore(mockAppDataStore, mockAppStore)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Task Management', () => {
    it('should handle task start correctly', async () => {
      const mockTask: Task = {
        id: 'task1',
        source: 'test',
        steps: { step1: { type: STEP_TYPES.STEP, id: 'step1' } },
        started: false,
        completed: false,
        version: '',
        label: ''
      }

      vi.mocked(mockAppDataStore.getTask).mockResolvedValue(mockTask)

      const listenerSpy = vi.fn()
      taskStore.on('task', listenerSpy)

      await taskStore.startTask('test', 'task1')

      expect(mockAppDataStore.getTask).toHaveBeenCalledWith('test', 'task1')
      expect(listenerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          started: true,
          completed: false,
          currentStep: 'step1'
        })
      )
    })

    it('should handle task completion correctly', async () => {
      const mockTask: Task = {
        id: 'task1',
        source: 'test',
        completed: false,
        steps: {
          step1: { type: STEP_TYPES.STEP, id: 'step1', completed: false },
          step2: { type: STEP_TYPES.STEP, id: 'step2', completed: false }
        },
        version: '',
        label: '',
        started: false
      }

      vi.mocked(mockAppDataStore.getTask).mockResolvedValue(mockTask)

      const listenerSpy = vi.fn()
      taskStore.on('task', listenerSpy)

      await taskStore.completeTask('test', 'task1')

      expect(listenerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          completed: true,
          steps: expect.objectContaining({
            step1: expect.objectContaining({ completed: true }),
            step2: expect.objectContaining({ completed: true })
          })
        })
      )
    })

    it('should handle step completion and task progression', async () => {
      const mockTask: Task = {
        id: 'task1',
        source: 'test',
        completed: false,
        currentStep: 'step1',
        steps: {
          step1: { type: STEP_TYPES.STEP, id: 'step1', completed: false },
          step2: { type: STEP_TYPES.STEP, id: 'step2', completed: false }
        },
        version: '',
        label: '',
        started: false
      }

      vi.mocked(mockAppDataStore.getTask).mockResolvedValue(mockTask)

      const taskListenerSpy = vi.fn()
      const stepListenerSpy = vi.fn()
      taskStore.on('task', taskListenerSpy)
      taskStore.on('step', stepListenerSpy)

      await taskStore.completeStep('test', 'task1', 'step1')

      expect(stepListenerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task1',
          source: 'test',
          step: expect.objectContaining({ completed: true })
        })
      )
      expect(taskListenerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStep: 'step2'
        })
      )
    })

    it('should handle task restart correctly', async () => {
      const mockTask: Task = {
        id: 'task1',
        source: 'test',
        completed: true,
        started: true,
        steps: {
          step1: { type: STEP_TYPES.STEP, id: 'step1', completed: true },
          step2: { type: STEP_TYPES.STEP, id: 'step2', completed: true }
        },
        version: '',
        label: ''
      }

      vi.mocked(mockAppDataStore.getTask).mockResolvedValue(mockTask)

      const listenerSpy = vi.fn()
      taskStore.on('task', listenerSpy)

      await taskStore.restartTask('test', 'task1')

      expect(listenerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          completed: false,
          started: false,
          steps: expect.objectContaining({
            step1: expect.objectContaining({ completed: false }),
            step2: expect.objectContaining({ completed: false })
          })
        })
      )
    })
  })
})
