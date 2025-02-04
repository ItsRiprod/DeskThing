import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import TaskStore from '@server/stores/taskStore'
import { Step, Task } from '@shared/types/tasks'

vi.mock('fs')
vi.mock('@server/services/apps', () => ({
  sendMessageToApp: vi.fn()
}))
vi.mock('@server/utils/fileHandler', () => ({
  readFromFile: vi.fn(),
  writeToFile: vi.fn()
}))
vi.mock('@server/stores/Logger', () => ({
  default: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))
vi.mock('@server/services/task/taskUtils', () => ({
  isValidTaskList: vi.fn().mockReturnValue({ isValid: true }),
  isValidTask: vi.fn().mockReturnValue({ isValid: true })
}))

describe('TaskStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('should notify listeners when task list changes', async () => {
    const listener = vi.fn()
    TaskStore.on(listener)

    const task: Task = {
      version: '0.0.1',
      started: false,
      steps: {
        step1: {
          id: 'placeholder',
          type: 'step',
          label: 'Step 1',
          instructions: 'Step 1 Instructions',
          completed: false
        }
      },
      id: 'test-task',
      label: 'Test Task',
      description: 'Test Description',
      completed: false,
      source: 'test'
    }

    await TaskStore.addTask(task)
    vi.runAllTimers()

    expect(listener).toHaveBeenCalled()
  })

  it('should handle nested task references correctly', async () => {
    const parentTask: Task = {
      version: '0.0.1',
      started: false,
      id: 'parent-task',
      label: 'Parent Task',
      description: 'Parent Description',
      completed: false,
      source: 'test',
      steps: {
        step1: {
          id: 'placeholder',
          type: 'step',
          label: 'Step 1',
          instructions: 'Step 1 Instructions',
          completed: false
        }
      }
    }

    const childTask: Task = {
      version: '0.0.1',
      started: false,
      id: 'child-task',
      label: 'Child Task',
      description: 'Child Description',
      completed: false,
      steps: {
        step1: {
          id: 'placeholder',
          type: 'step',
          label: 'Step 1',
          instructions: 'Step 1 Instructions',
          completed: false
        }
      },
      source: 'test'
    }

    const step: Step = {
      id: 'step-1',
      type: 'task',
      taskId: 'child-task',
      label: 'Test Step',
      completed: false
    }

    await TaskStore.addTask(childTask)
    await TaskStore.addTask(parentTask)
    await TaskStore.addStep('parent-task', step)
    await TaskStore.completeTask('child-task')
    vi.runAllTimers()

    const updatedParentTask = TaskStore.getTask('parent-task')
    expect(updatedParentTask?.started && updatedParentTask?.steps?.['step-1'].completed).toBe(true)
  })

  it('should handle task restart correctly', async () => {
    const task: Task = {
      version: '0.0.1',
      started: false,
      id: 'restart-task',
      label: 'Restart Task',
      description: 'Test Description',
      completed: true,
      source: 'test',
      steps: {
        step1: {
          id: 'step1',
          type: 'action',
          label: 'Test Step',
          action: {
            enabled: true,
            source: 'server',
            id: 'action'
          },
          completed: true
        }
      }
    }

    await TaskStore.addTask(task)
    await TaskStore.restartTask('restart-task')
    vi.runAllTimers()

    const updatedTask = TaskStore.getTask('restart-task')
    expect(updatedTask?.completed).toBe(false)
    expect(updatedTask?.started && updatedTask?.steps?.['step1'].completed).toBe(false)
  })

  it('should complete task when all steps are completed', async () => {
    const task: Task = {
      version: '0.0.1',
      started: false,
      id: 'complete-task',
      label: 'Complete Task',
      description: 'Test Description',
      completed: false,
      source: 'test',
      steps: {
        'step-1': {
          id: 'step-1',
          type: 'step',
          label: 'Step 1',
          completed: false
        },
        'step-2': {
          id: 'step-2',
          type: 'step',
          label: 'Step 2',
          completed: false
        }
      }
    }

    await TaskStore.addTask(task)
    await TaskStore.completeStep('complete-task', 'step-1')
    await TaskStore.completeStep('complete-task', 'step-2')
    vi.runAllTimers()

    const updatedTask = TaskStore.getTask('complete-task')
    expect(updatedTask?.completed).toBe(true)
  })

  it('should filter tasks by source correctly', async () => {
    const task1: Task = {
      version: '0.0.1',
      started: false,
      id: 'task-1',
      label: 'Task 1',
      description: 'Test Description',
      completed: false,
      source: 'source1',
      steps: {
        step1: {
          id: 'placeholder',
          type: 'step',
          label: 'Step 1',
          instructions: 'Step 1 Instructions',
          completed: false
        }
      }
    }

    const task2: Task = {
      version: '0.0.1',
      started: false,
      id: 'task-2',
      label: 'Task 2',
      description: 'Test Description',
      completed: false,
      source: 'source2',
      steps: {
        step1: {
          id: 'placeholder',
          type: 'step',
          label: 'Step 1',
          instructions: 'Step 1 Instructions',
          completed: false
        }
      }
    }

    await TaskStore.addTask(task1)
    await TaskStore.addTask(task2)
    vi.runAllTimers()

    const source1Tasks = TaskStore.getTasksBySource('source1')
    expect(source1Tasks).toHaveLength(1)
    expect(source1Tasks[0].id).toBe('task-1')
  })
})
