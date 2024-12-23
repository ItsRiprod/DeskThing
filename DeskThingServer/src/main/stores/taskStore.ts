import { isValidTask, isValidTaskList } from '@server/services/task/taskUtils'
import defaultTaskList from '@server/static/defaultTasks'
import { readFromFile, writeToFile } from '@server/utils/fileHandler'
import { Step, Task, TaskList } from '@shared/types/tasks'
import loggingStore from './loggingStore'
import { MESSAGE_TYPES } from '@shared/types'

type taskStoreListener = (taskList: TaskList) => void

class TaskStore {
  private saveTimeout: NodeJS.Timeout | null = null
  private readonly SAVE_DELAY = 1000 // Delay a second before saving to file
  private static instance: TaskStore
  private taskList: TaskList
  private listeners: taskStoreListener[] = []
  private taskStepReferences: Map<string, { taskId: string; stepId: string }[]> = new Map()

  private constructor() {
    this.taskList = this.getTaskList()
    this.buildTaskReferences()
  }

  public static getInstance(): TaskStore {
    if (!TaskStore.instance) {
      TaskStore.instance = new TaskStore()
    }
    return TaskStore.instance
  }

  private async notifyListeners(): Promise<void> {
    await Promise.all(this.listeners.map((listener) => listener(this.taskList)))
  }

  on(listener: taskStoreListener): () => void {
    this.listeners.push(listener)
    return () => this.off(listener)
  }

  off(listener: taskStoreListener): void {
    this.listeners = this.listeners.filter((l) => l !== listener)
  }

  private async buildTaskReferences(): Promise<void> {
    Object.entries(this.taskList.tasks).forEach(([taskId, task]) => {
      if (task.steps) {
        Object.entries(task.steps).forEach(([stepId, step]) => {
          if (step.type === 'task' && step.taskId) {
            const refs = this.taskStepReferences.get(step.taskId) || []
            refs.push({ taskId, stepId })
            this.taskStepReferences.set(step.taskId, refs)
          }
        })
      }
    })
  }

  private updateStepReference(taskId: string, stepId: string, step: Step): void {
    if (step.type === 'task' && step.taskId) {
      const refs = this.taskStepReferences.get(step.taskId) || []
      refs.push({ taskId, stepId })
      this.taskStepReferences.set(step.taskId, refs)
    }
  }

  // Remove step reference
  private async removeStepReference(taskId: string, stepId?: string, step?: Step): Promise<void> {
    this.taskStepReferences.delete(taskId)

    // Clean up references FROM this task
    if (!stepId && !step) {
      // When removing entire task, clean up all its steps' references
      const task = this.getTask(taskId)
      if (task?.steps) {
        Object.values(task.steps).forEach((step) => {
          if (step.type === 'task' && step.taskId) {
            const refs = this.taskStepReferences.get(step.taskId) || []
            const filtered = refs.filter((ref) => ref.taskId !== taskId)
            this.taskStepReferences.set(step.taskId, filtered)
          }
        })
      }
      return
    }

    // Handle individual step removal
    if (stepId && step?.type === 'task' && step.taskId) {
      const refs = this.taskStepReferences.get(step.taskId) || []
      const filtered = refs.filter((ref) => ref.taskId !== taskId || ref.stepId !== stepId)
      this.taskStepReferences.set(step.taskId, filtered)
    }
  }

  private fetchTaskList = (): TaskList => {
    const taskList = readFromFile<TaskList>('tasks.json')

    const validity = isValidTaskList(taskList)

    if (taskList && validity.isValid) {
      return taskList
    } else {
      loggingStore.warn('[fetchTaskList]: Failed to fetch tasks! ' + validity.error)
      // Return the default task data
      writeToFile(defaultTaskList, 'tasks.json')
      return defaultTaskList
    }
  }

  public getTaskList(): TaskList {
    if (this.taskList && isValidTaskList(this.taskList).isValid) {
      return this.taskList
    }
    return this.fetchTaskList()
  }

  public async saveTaskList(): Promise<void> {
    loggingStore.warn('[saveTaskList] Saving the task list!')
    await new Promise((res, rej) => {
      try {
        if (isValidTaskList(this.taskList).isValid) {
          writeToFile(this.taskList, 'tasks.json')
          this.notifyListeners()
          res(true)
        } else {
          loggingStore.error('[saveTaskList]: Failed to save tasks!')
          rej(false)
        }
      } catch (error) {
        if (error instanceof Error) {
          loggingStore.error('[saveTaskList]: Failed to save tasks! ' + error.message)
          rej(error)
        } else {
          loggingStore.error('[saveTaskList]: Failed to save tasks! ' + String(error))
          rej(error)
        }

        this.taskList = this.fetchTaskList()
      }
    })
  }

  private debouncedSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }
    this.saveTimeout = setTimeout(() => {
      this.saveTaskList()
      this.saveTimeout = null
    }, this.SAVE_DELAY)
  }

  public getTask(taskId: string): Task | undefined {
    return this.taskList.tasks[taskId]
  }

  public getTasks(): Task[] {
    return Object.values(this.taskList.tasks)
  }

  public getTasksBySource(source: string): Task[] {
    return Object.values(this.taskList.tasks).filter((task) => task.source === source)
  }

  /**
   * Task Management
   */

  public async addTask(task: Task): Promise<void> {
    this.taskList.tasks[task.id] = task
    this.debouncedSave()
  }

  async updateTask(newTask: Partial<Task>): Promise<void> {
    if (!newTask?.id) {
      loggingStore.warn('[updateTask]: Task does not have an ID')
      return
    }
    const task = this.getTask(newTask.id)

    if (!task) {
      loggingStore.warn(`[updateTask]: Task ${newTask.id} does not exist`)
      if (isValidTask(newTask).isValid) {
        loggingStore.log(
          MESSAGE_TYPES.LOGGING,
          `[updateTask]: Adding task ${newTask.id} as it is new`
        )
        this.addTask(newTask as Task)
      }
      return
    }

    loggingStore.log(MESSAGE_TYPES.LOGGING, `[updateTask]: Updating task ${newTask.id}`)
    Object.assign(task, newTask)
    this.taskList.tasks[task.id] = task
    this.buildTaskReferences()
    this.debouncedSave()
  }

  async deleteTask(taskId: string): Promise<void> {
    if (!taskId) {
      loggingStore.warn('[deleteTask]: No task ID provided')
      return
    }

    const task = this.getTask(taskId)
    if (!task) {
      loggingStore.warn(`[deleteTask]: Task ${taskId} does not exist`)
      return
    }

    this.removeStepReference(taskId)

    delete this.taskList.tasks[taskId]
    this.debouncedSave()
  }
  async completeTask(taskId: string): Promise<void> {
    const task = this.getTask(taskId)
    if (!task) {
      loggingStore.warn(`[resolveTask]: Task ${taskId} does not exist`)
      return
    }
    task.completed = true
    if (task.steps) {
      Object.values(task.steps).forEach((step) => {
        step.completed = true
      })
    }

    const references = this.taskStepReferences.get(taskId)
    if (references) {
      references.forEach(({ taskId: parentTaskId, stepId }) => {
        const parentTask = this.taskList.tasks[parentTaskId]
        if (parentTask?.steps?.[stepId]) {
          parentTask.steps[stepId].completed = true
        }
      })
    }

    this.taskList.tasks[taskId] = task

    this.debouncedSave()
  }

  async restartTask(taskId: string): Promise<void> {
    const task = this.getTask(taskId)
    if (!task) {
      loggingStore.warn(`[restartTask]: Task ${taskId} does not exist`)
      return
    }
    task.completed = false
    if (task.steps) {
      Object.values(task.steps).forEach((step) => {
        step.completed = false
      })
    }
    this.taskList.tasks[taskId] = task
    this.debouncedSave()
  }

  async startTask(taskId: string): Promise<void> {
    const task = this.getTask(taskId)
    if (!task) {
      loggingStore.warn(`[startTask]: Task ${taskId} does not exist`)
      return
    }
    task.started = true
    task.completed = false
    this.taskList.tasks[taskId] = task
    this.debouncedSave()
  }

  async stopTask(taskId: string): Promise<void> {
    const task = this.getTask(taskId)
    if (!task) {
      loggingStore.warn(`[stopTask]: Task ${taskId} does not exist`)
      return
    }
    task.started = false
    this.taskList.tasks[taskId] = task
    this.debouncedSave()
  }

  /**
   * Step Management
   */

  async addStep(taskId: string, step: Step): Promise<void> {
    const task = this.getTask(taskId)
    if (!task) {
      loggingStore.warn(`[addStep]: Task ${taskId} does not exist`)
      return
    }
    if (!task.steps) {
      task.steps = {}
    }
    task.steps[step.id] = step
    this.updateStepReference(taskId, step.id, step)
    this.taskList.tasks[taskId] = task
    this.debouncedSave()
  }

  async updateStep(taskId: string, newStep: Partial<Step>): Promise<void> {
    const task = this.getTask(taskId)
    if (!task) {
      loggingStore.warn(`[updateStep]: Task ${taskId} does not exist`)
      return
    }

    if (!newStep?.id) {
      loggingStore.warn('[updateStep]: Step does not have an ID')
      return
    }

    const step = task.steps[newStep.id]

    if (!step) {
      loggingStore.warn(`[updateStep]: Step ${newStep.id} does not exist`)
      return
    }

    loggingStore.log(MESSAGE_TYPES.LOGGING, `[updateStep]: Updating step ${newStep.id}`)

    Object.assign(step, newStep)
    this.updateStepReference(taskId, step.id, step)

    this.taskList.tasks[taskId] = task

    this.debouncedSave()
  }

  async deleteStep(taskId: string, stepId: string): Promise<void> {
    const task = this.getTask(taskId)
    if (!task) {
      loggingStore.warn(`[deleteStep]: Task ${taskId} does not exist`)
      return
    }
    if (!task.steps) {
      loggingStore.warn(`[deleteStep]: Task ${taskId} does not have any steps`)
      return
    }
    if (!task.steps[stepId]) {
      loggingStore.warn(`[deleteStep]: Step ${stepId} does not exist`)
      return
    }
    const step = task.steps[stepId]
    this.removeStepReference(taskId, stepId, step)

    delete task.steps[stepId]
    this.taskList.tasks[taskId] = task
    this.debouncedSave()
  }

  async completeStep(taskId: string, stepId: string): Promise<void> {
    const task = this.getTask(taskId)
    if (!task) {
      loggingStore.warn(`[resolveStep]: Task ${taskId} does not exist`)
      return
    }
    if (!task.steps) {
      loggingStore.warn(`[resolveStep]: Task ${taskId} does not have any steps`)
      return
    }
    if (!task.steps[stepId]) {
      loggingStore.warn(`[resolveStep]: Step ${stepId} does not exist`)
      return
    }
    task.steps[stepId].completed = true
    this.taskList.tasks[taskId] = task

    if (task.source != 'server') {
      const { appStore } = await import('@server/stores')
      appStore.sendDataToApp(task.source, {
        type: 'step',
        payload: { ...task.steps[stepId], parentId: taskId } as Step,
        request: stepId
      })
    }
    // Potentially handle server action resolutions

    const allStepsCompleted = Object.values(task.steps).every((step) => step.completed)

    if (allStepsCompleted) {
      this.completeTask(taskId)
      loggingStore.log(
        MESSAGE_TYPES.LOGGING,
        `[completeStep]: All steps completed for task ${taskId}`
      )
    }

    this.debouncedSave()
  }

  async restartStep(taskId: string, stepId: string): Promise<void> {
    const task = this.getTask(taskId)
    if (!task) {
      loggingStore.warn(`[restartStep]: Task ${taskId} does not exist`)
      return
    }
    if (!task.steps) {
      loggingStore.warn(`[restartStep]: Task ${taskId} does not have any steps`)
      return
    }
    if (!task.steps[stepId]) {
      loggingStore.warn(`[restartStep]: Step ${stepId} does not exist`)
      return
    }
    task.steps[stepId].completed = false
    this.taskList.tasks[taskId] = task
    this.debouncedSave()
  }
}

export default TaskStore.getInstance()
