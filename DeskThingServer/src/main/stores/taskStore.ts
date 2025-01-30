import {
  isValidStep,
  isValidTask,
  isValidTaskList,
  sanitizeTaskList
} from '@server/services/task/taskUtils'
import defaultTaskList from '@server/static/defaultTasks'
import { readFromFile, writeToFile } from '@server/utils/fileHandler'
import { Step, Task, TaskList, TaskReference } from '@shared/types/tasks'
import Logger from '@server/utils/logger'
import { MESSAGE_TYPES } from '@shared/types'
import appStore from './appStore'

type taskStoreListener = (taskList: TaskList) => void

class TaskStore {
  private saveTimeout: NodeJS.Timeout | null = null
  private readonly SAVE_DELAY = 1000 // Delay a second before saving to file
  private static instance: TaskStore
  private taskList: TaskList = { tasks: {}, version: '', currentTaskId: '' }
  private listeners: taskStoreListener[] = []
  private taskStepReferences: Map<string, { taskId: string; stepId: string }[]> = new Map()

  private constructor() {
    this.initializeTaskList()
    this.buildTaskReferences()
  }

  private initializeTaskList = async (): Promise<void> => {
    this.taskList = await this.getTaskList()
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
      if (task.started && task.steps) {
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
      if (task?.started && task?.steps) {
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

  private fetchTask = async (taskReference: TaskReference | Task): Promise<Task | undefined> => {
    try {
      const tasks = await appStore.getTasks(taskReference.source)
      if (!tasks) {
        Logger.warn(`Task ${taskReference.id} does not exist`, {
          function: 'fetchTask',
          source: 'taskStore'
        })
        return
      }

      const task = tasks[taskReference.id]

      const validity = isValidTask(task)
      if (!task || !validity.isValid) {
        Logger.warn(`Task ${taskReference.id} is invalid`, {
          function: 'fetchTask',
          source: 'taskStore'
        })
        return
      } else {
        return task
      }
    } catch (error) {
      Logger.error(`Failed to fetch task ${taskReference.id}`, {
        error: error as Error,
        function: 'fetchTask',
        source: 'taskStore'
      })
      return
    }
  }

  private fetchTaskList = async (): Promise<TaskList> => {
    const taskList = await readFromFile<TaskList>('tasks.json')

    if (!taskList) {
      Logger.warn('[fetchTaskList]: Failed to fetch tasks!')
      return defaultTaskList
    }

    const validity = isValidTaskList(taskList)

    if (taskList && validity.isValid) {
      return taskList
    } else {
      Logger.warn('[fetchTaskList]: Failed to fetch tasks! ' + validity.error)
      // Return the default task data
      try {
        await writeToFile(defaultTaskList, 'tasks.json')
      } catch (error) {
        Logger.error('Failed to save default tasks!', {
          error: error as Error,
          function: 'fetchTaskList',
          source: 'taskStore'
        })
      }
      return defaultTaskList
    }
  }

  public async getTaskList(): Promise<TaskList> {
    if (this.taskList && isValidTaskList(this.taskList).isValid) {
      return sanitizeTaskList(this.taskList)
    }
    return await this.fetchTaskList()
  }

  public async saveTaskList(): Promise<void> {
    Logger.warn('[saveTaskList] Saving the task list!')
    try {
      if (isValidTaskList(this.taskList).isValid) {
        await writeToFile(this.taskList, 'tasks.json')
        this.notifyListeners()
        return
      } else {
        Logger.error('[saveTaskList]: Failed to save tasks!')
        return
      }
    } catch (error) {
      Logger.error('Failed to save tasks! ', {
        error: error as Error,
        function: 'saveTaskList',
        source: 'taskStore'
      })

      // Attempt to fetch again
      this.taskList = await this.fetchTaskList()
    }
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

  public getTask(taskId: string): Task | TaskReference | undefined {
    return this.taskList.tasks[taskId]
  }

  public getTasks(): (Task | TaskReference)[] {
    return Object.values(this.taskList.tasks)
  }

  public getTasksBySource(source: string): (Task | TaskReference)[] {
    return Object.values(this.taskList.tasks).filter((task) => task.source === source)
  }

  public getCurrentTaskId(): string | undefined {
    return this.taskList.currentTaskId
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
      Logger.warn('[updateTask]: Task does not have an ID')
      return
    }
    const task = this.getTask(newTask.id)

    if (!task) {
      Logger.warn(`[updateTask]: Task ${newTask.id} does not exist`)
      if (isValidTask(newTask).isValid) {
        Logger.log(MESSAGE_TYPES.LOGGING, `[updateTask]: Adding task ${newTask.id} as it is new`)
        this.addTask(newTask as Task)
      }
      return
    }

    Logger.log(MESSAGE_TYPES.LOGGING, `[updateTask]: Updating task ${newTask.id}`)
    Object.assign(task, newTask)
    this.taskList.tasks[task.id] = task
    this.buildTaskReferences()
    this.debouncedSave()
  }

  async deleteTask(taskId: string): Promise<void> {
    if (!taskId) {
      Logger.warn('[deleteTask]: No task ID provided')
      return
    }

    const task = this.getTask(taskId)
    if (!task) {
      Logger.warn(`[deleteTask]: Task ${taskId} does not exist`)
      return
    }

    this.removeStepReference(taskId)

    delete this.taskList.tasks[taskId]
    this.debouncedSave()
  }
  async completeTask(taskId: string): Promise<void> {
    const task = this.getTask(taskId)
    if (!task) {
      Logger.warn(`[resolveTask]: Task ${taskId} does not exist`)
      return
    }
    if (!task.started) {
      Logger.warn(`[resolveTask]: Task ${taskId} has not been started`)
      return
    }

    task.completed = true

    if (task.steps) {
      Object.values(task.steps).forEach((step) => {
        step.completed = true
      })
    }
    task.currentStep = undefined

    const references = this.taskStepReferences.get(taskId)
    if (references) {
      references.forEach(({ taskId: parentTaskId, stepId }) => {
        const parentTask = this.taskList.tasks[parentTaskId]
        if (parentTask.started && parentTask?.steps?.[stepId]) {
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
      Logger.warn(`[restartTask]: Task ${taskId} does not exist`)
      return
    }
    task.completed = false
    if (task.started && task.steps) {
      Object.values(task.steps).forEach((step) => {
        step.completed = false
      })
      task.currentStep = undefined
    }
    this.taskList.tasks[taskId] = task
    this.stopTask(taskId) // saves it too
  }

  async startTask(taskId: string): Promise<void> {
    const taskRef = this.getTask(taskId)
    if (!taskRef) {
      Logger.warn(`Task ${taskId} does not exist`, {
        function: 'startTask',
        source: 'taskStore'
      })
      return
    }

    const task = await this.fetchTask(taskRef)

    if (!task) {
      Logger.warn(`Task ${taskId} does not exist from app ${taskRef.source}`, {
        function: 'startTask',
        source: 'taskStore'
      })
      return
    }

    task.started = true
    task.completed = false
    task.currentStep = Object.keys(task.steps)[0]
    this.taskList.currentTaskId = task.id
    this.taskList.tasks[taskId] = task
    this.debouncedSave()
  }

  async stopTask(taskId: string): Promise<void> {
    const task = this.getTask(taskId)
    if (!task) {
      Logger.warn(`[stopTask]: Task ${taskId} does not exist`)
      return
    }
    task.started = false
    if (this.taskList.currentTaskId === task.id) {
      this.taskList.currentTaskId = undefined
    }
    this.taskList.tasks[taskId] = task
    this.debouncedSave()
  }

  /**
   * Step Management
   */

  async addStep(taskId: string, step: Step): Promise<void> {
    let task = this.getTask(taskId)
    if (!task) {
      Logger.warn(`[addStep]: Task ${taskId} does not exist`, {
        function: 'addStep',
        source: 'taskStore'
      })
      return
    }
    if (!task.started) {
      Logger.warn(`[addStep]: Task ${taskId} has not been started!`, {
        function: 'addStep',
        source: 'taskStore'
      })
      task = await this.fetchTask(task)
      if (!task) {
        Logger.warn(`Task ${taskId} does not exist from app ${taskId}`, {
          function: 'addStep',
          source: 'taskStore'
        })
        return
      }
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
    let task = this.getTask(taskId)
    if (!task) {
      Logger.warn(`[updateStep]: Task ${taskId} does not exist`)
      return
    }
    if (!task.started) {
      Logger.warn(`Task ${taskId} has not been started!`, {
        function: 'updateStep',
        source: 'taskStore'
      })
      task = await this.fetchTask(task)
      if (!task) {
        Logger.warn(`Task ${taskId} does not exist`, {
          function: 'updateStep',
          source: 'taskStore'
        })
        return
      }
    }

    if (!newStep?.id) {
      Logger.warn('[updateStep]: Step does not have an ID')
      return
    }

    const step = task.steps[newStep.id]

    if (!step) {
      Logger.warn(`[updateStep]: Step ${newStep.id} does not exist`)
      return
    }

    Logger.log(MESSAGE_TYPES.LOGGING, `[updateStep]: Updating step ${newStep.id}`)

    Object.assign(step, newStep)
    if (isValidStep(newStep).isValid) {
      this.updateStepReference(taskId, step.id, step)

      this.taskList.tasks[taskId] = task
      this.debouncedSave()
    } else {
      Logger.warn(`[updateStep]: Step ${newStep.id} is invalid`)
    }
  }

  async deleteStep(taskId: string, stepId: string): Promise<void> {
    let task = this.getTask(taskId)
    if (!task) {
      Logger.warn(`[deleteStep]: Task ${taskId} does not exist`)
      return
    }
    if (!task.started) {
      Logger.warn(`Task ${taskId} has not been started!`, {
        function: 'deleteStep',
        source: 'taskStore'
      })
      task = await this.fetchTask(task)
      if (!task) {
        Logger.warn(`Task ${taskId} does not exist`, {
          function: 'deleteStep',
          source: 'taskStore'
        })
        return
      }
    }
    if (!task.steps) {
      Logger.warn(`[deleteStep]: Task ${taskId} does not have any steps`)
      return
    }
    if (!task.steps[stepId]) {
      Logger.warn(`[deleteStep]: Step ${stepId} does not exist`)
      return
    }
    const step = task.steps[stepId]
    this.removeStepReference(taskId, stepId, step)

    if (task.currentStep === stepId) {
      task.currentStep = undefined
    }

    delete task.steps[stepId]
    this.taskList.tasks[taskId] = task
    this.debouncedSave()
  }

  async getNextStep(taskId: string, stepId: string): Promise<string | undefined> {
    const task = this.getTask(taskId)
    if (!task) {
      Logger.warn(`[getNextStep]: Task ${taskId} does not exist`)
      return
    }
    if (!task.started) {
      Logger.warn(`[getNextStep]: Task ${taskId} must be started before getting the next step!`)
      return
    }
    if (!task.steps) {
      Logger.warn(`[getNextStep]: Task ${taskId} does not have any steps`)
      return
    }
    if (!task.steps[stepId]) {
      Logger.warn(`[getNextStep]: Step ${stepId} does not exist`)
      return
    }

    const stepIndex = Object.values(task.steps).findIndex((s) => s.id === stepId)
    if (stepIndex === -1) {
      Logger.warn(`[getNextStep]: Step ${stepId} does not exist`)
      return
    }

    const nextStep = Object.values(task.steps)[stepIndex + 1]

    if (!nextStep) {
      Logger.warn(`[getNextStep]: No next step for step ${stepId}`)
      return
    }

    return nextStep.id
  }

  async completeStep(taskId: string, stepId: string): Promise<void> {
    let task = this.getTask(taskId)
    if (!task) {
      Logger.warn(`[completeStep]: Task ${taskId} does not exist`)
      return
    }
    if (!task.started) {
      Logger.warn(`Task ${taskId} has not been started!`, {
        function: 'completeStep',
        source: 'taskStore'
      })
      task = await this.fetchTask(task)
      if (!task) {
        Logger.warn(`Task ${taskId} does not exist`, {
          function: 'completeStep',
          source: 'taskStore'
        })
        return
      }
    }
    if (!task.steps) {
      Logger.warn(`[completeStep]: Task ${taskId} does not have any steps`)
      return
    }
    if (!task.steps[stepId]) {
      Logger.warn(`[completeStep]: Step ${stepId} does not exist`)
      return
    }
    task.steps[stepId].completed = true
    this.taskList.tasks[taskId] = task

    const nextStep = await this.getNextStep(taskId, stepId)
    if (nextStep) {
      task.currentStep = nextStep
    } else {
      task.currentStep = undefined
    }

    if (task.source != 'server') {
      appStore.completeStep(task, stepId)
    }
    // Potentially handle server action resolutions

    const allStepsCompleted = Object.values(task.steps).every((step) => step.completed)

    if (allStepsCompleted) {
      this.completeTask(taskId)
      Logger.log(MESSAGE_TYPES.LOGGING, `[completeStep]: All steps completed for task ${taskId}`)
    }

    this.debouncedSave()
  }

  async restartStep(taskId: string, stepId: string): Promise<void> {
    const task = this.getTask(taskId)
    if (!task) {
      Logger.warn(`[restartStep]: Task ${taskId} does not exist`)
      return
    }
    if (!task.started) {
      Logger.warn(`Task ${taskId} cannot have a step restarted while it is not started`, {
        function: 'restartStep',
        source: 'taskStore'
      })
      return
    }
    if (!task.steps) {
      Logger.warn(`[restartStep]: Task ${taskId} does not have any steps`)
      return
    }
    if (!task.steps[stepId]) {
      Logger.warn(`[restartStep]: Step ${stepId} does not exist`)
      return
    }
    task.steps[stepId].completed = false
    this.taskList.tasks[taskId] = task
    this.debouncedSave()
  }
}

export default TaskStore.getInstance()
