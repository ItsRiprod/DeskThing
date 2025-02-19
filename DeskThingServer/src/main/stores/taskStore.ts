import {
  isValidStep,
  isValidTask,
  isValidTaskList,
  sanitizeTaskList
} from '@server/services/task/taskUtils'
import defaultTaskList from '@server/static/defaultTasks'
import { TaskReference, TaskList, CacheableStore } from '@shared/types'
import Logger from '@server/utils/logger'
import { LOGGING_LEVELS, Step, Task } from '@DeskThing/types'
import appStore from './appStore'
import { readTasksFromFile, saveTaskList } from '@server/services/files/taskFileService'
import defaultTask from '@server/static/defaultTasks'

type TaskStoreEvents = {
  taskList: TaskList
  step: { source: string; taskId: string; step: Step }
  task: Task | TaskReference
}

// Create listener types automatically from event map
type Listener<T> = (payload: T) => void
type TaskStoreListener<K extends keyof TaskStoreEvents> = Listener<TaskStoreEvents[K]>

// Create listeners collection type automatically
type TaskStoreListeners = {
  [K in keyof TaskStoreEvents]: TaskStoreListener<K>[]
}

class TaskStore implements CacheableStore {
  private saveTimeout: NodeJS.Timeout | null = null
  private readonly SAVE_DELAY = 100 // Delay a second before saving to file
  private static instance: TaskStore
  private taskList: TaskList = { tasks: {}, version: '', currentTaskId: '' }
  private listeners: TaskStoreListeners = {
    taskList: [],
    step: [],
    task: []
  }
  private pendingSave = false

  private constructor() {
    this.initializeTaskList()
  }

  /**
   * @implements CacheableStore
   */
  clearCache = async (): Promise<void> => {
    // Make all of the tasks references and stop them
    this.taskList.tasks = Object.entries(this.taskList.tasks).reduce(
      (acc, [id, task]) => {
        acc[id] = {
          id: task.id,
          source: task.source,
          version: task.version,
          available: task.available,
          completed: task.completed,
          label: task.label,
          started: false,
          description: task.description
        }
        return acc
      },
      {} as Record<string, TaskReference>
    )
    await this.debouncedSave()
    this.saveTimeout && clearTimeout(this.saveTimeout)
  }
  /**
   * @implements CacheableStore
   */
  saveToFile = async (): Promise<void> => {
    await this.saveTaskList()
  }

  private initializeTaskList = async (): Promise<void> => {
    this.taskList = await this.getTaskList()
    let changes = false
    // Compare versions and update tasks if needed
    Object.entries(defaultTaskList.tasks).forEach(([taskId, defaultTask]) => {
      const existingTask = this.taskList.tasks[taskId]
      if (existingTask && existingTask.version !== defaultTask.version) {
        this.taskList.tasks[taskId] = defaultTask
        changes = true
      }
      if (!existingTask) {
        this.taskList.tasks[taskId] = defaultTask
        changes = true
      }
    })
    if (changes) {
      await this.saveTaskList()
    }
  }

  public static getInstance(): TaskStore {
    if (!TaskStore.instance) {
      TaskStore.instance = new TaskStore()
    }
    return TaskStore.instance
  }

  /**
   * Notifies all of the taskList listeners
   */
  private async notify<K extends keyof TaskStoreEvents>(
    type: K,
    payload: TaskStoreEvents[K]
  ): Promise<void> {
    await Promise.all(this.listeners[type].map((listener) => listener(payload)))
  }

  on<K extends keyof TaskStoreEvents>(type: K, listener: TaskStoreListener<K>): () => void {
    this.listeners[type].push(listener)
    return () => this.off(type, listener)
  }

  off<K extends keyof TaskStoreEvents>(type: K, listener: TaskStoreListener<K>): void {
    this.listeners[type] = this.listeners[type].filter(
      (l) => l !== listener
    ) as TaskStoreListeners[K]
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

      try {
        isValidTask(task)
        return task
      } catch (error) {
        Logger.warn(`Task ${taskReference.id} is invalid`, {
          function: 'fetchTask',
          source: 'taskStore'
        })
        return
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
    try {
      const taskList = await readTasksFromFile()

      if (!taskList) {
        Logger.error('[fetchTaskList]: Failed to fetch tasks!', {
          function: 'fetchTaskList',
          source: 'taskStore'
        })
        await this.saveTaskList(defaultTaskList)
        return sanitizeTaskList(defaultTaskList)
      }

      return taskList
    } catch (error) {
      Logger.error('[fetchTaskList]: Failed to fetch tasks!', {
        error: error as Error,
        function: 'fetchTaskList',
        source: 'taskStore'
      })
      await this.saveTaskList(defaultTask)
      return sanitizeTaskList(defaultTaskList)
    }
  }

  public async getTaskList(): Promise<TaskList> {
    if (this.taskList) {
      try {
        isValidTaskList(this.taskList)
        return sanitizeTaskList(this.taskList)
      } catch (error) {
        return await this.fetchTaskList()
      }
    }
    return await this.fetchTaskList()
  }

  public async saveTaskList(taskList?: TaskList): Promise<void> {
    this.taskList = taskList || this.taskList

    Logger.info('[saveTaskList] Saving the task list!')
    try {
      await saveTaskList(this.taskList)
      this.notify('taskList', this.taskList)
      return
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

  private async debouncedSave(): Promise<void> {
    try {
      if (!this.saveTimeout) {
        const promise = this.saveTaskList()
        this.saveTimeout = setTimeout(() => {
          this.saveTimeout = null
          if (this.pendingSave) {
            this.pendingSave = false
            this.debouncedSave()
          }
        }, this.SAVE_DELAY)

        await promise
      } else {
        this.pendingSave = true
      }
    } catch (error) {
      Logger.error('Failed to save tasks in debouncedSave', {
        error: error as Error,
        source: 'taskStore'
      })
    }
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

  public removeSource = async (source: string): Promise<void> => {
    const tasks = this.getTasksBySource(source)
    tasks.forEach((task) => {
      Logger.info(`Removing task ${task.id}`, {
        function: 'removeSource',
        source: 'taskStore'
      })
      delete this.taskList.tasks[task.id]
    })
    this.debouncedSave()
  }

  public getCurrentTaskId(): string | undefined {
    return this.taskList.currentTaskId
  }

  public async getStep(taskId: string, stepId: string): Promise<Step | undefined> {
    let task = this.getTask(taskId)
    if (!task) {
      Logger.warn(`[getStep]: Task ${taskId} does not exist`)
      return
    }
    if (!task.started) {
      task = await this.fetchTask(task)
    }
    return task?.steps[stepId]
  }

  /**
   * Task Management
   */

  public async addTask(task: Task): Promise<void> {
    try {
      isValidTask(task)
      this.taskList.tasks[task.id] = task
      this.debouncedSave()
    } catch (error) {
      Logger.error(`Error trying to add task ${task.id}`, {
        error: error as Error,
        function: 'addTask',
        source: 'taskStore'
      })
    }
  }

  public async addTasks(tasks: Record<string, Task>): Promise<void> {
    const validTasks: Record<string, Task> = {}

    for (const [id, task] of Object.entries(tasks)) {
      try {
        isValidTask(task)
        validTasks[id] = task
      } catch (error) {
        Logger.error(`Error trying to add task ${task.id}`, {
          error: error as Error,
          function: 'addTask',
          source: 'taskStore'
        })
      }
    }

    if (Object.keys(validTasks).length > 0) {
      this.taskList.tasks = { ...this.taskList.tasks, ...validTasks }
      this.debouncedSave()
    }
  }

  async updateTask(newTask: Partial<Task>): Promise<void> {
    if (!newTask?.id) {
      Logger.warn('[updateTask]: Task does not have an ID')
      return
    }
    const task = this.getTask(newTask.id)

    if (!task) {
      Logger.warn(`[updateTask]: Task ${newTask.id} does not exist`)
      try {
        isValidTask(newTask)
        Logger.log(LOGGING_LEVELS.LOG, `[updateTask]: Adding task ${newTask.id} as it is new`)
        this.addTask(newTask as Task)
      } catch (error) {
        Logger.warn(`[updateTask]: Invalid task ${newTask.id}`, { error: error as Error })
      }
      return
    }

    Logger.log(LOGGING_LEVELS.LOG, `[updateTask]: Updating task ${newTask.id}`)
    Object.assign(task, newTask)
    this.taskList.tasks[task.id] = task
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
      Logger.info(`[resolveTask]: Task ${taskId} has not been started`)
      return
    }

    task.completed = true

    if (task.steps) {
      Object.values(task.steps).forEach((step) => {
        step.completed = true
      })
    }
    task.currentStep = undefined

    this.taskList.tasks[taskId] = task

    this.notify('task', task)

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

    this.notify('task', task)

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

    const task = taskRef.source == 'server' ? (taskRef as Task) : await this.fetchTask(taskRef)

    if (!task) {
      Logger.warn(`Task ${taskId} does not exist from app ${taskRef.source}`, {
        function: 'startTask',
        source: 'taskStore'
      })
      return
    }

    task.started = true
    task.completed = false
    task.currentStep = task.currentStep || Object.keys(task.steps)[0]
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

  async pauseTask(): Promise<void> {
    this.taskList.currentTaskId = undefined
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
      Logger.info(`[addStep]: Task ${taskId} has not been started!`, {
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
      Logger.info(`Task ${taskId} has not been started!`, {
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

    Logger.info(`[updateStep]: Updating step ${newStep.id}`, {
      function: 'updateStep',
      source: 'taskStore'
    })

    Object.assign(step, newStep)
    try {
      isValidStep(newStep)
      this.taskList.tasks[taskId] = task
      this.debouncedSave()
    } catch (error) {
      Logger.warn(`[updateStep]: Step ${newStep.id} is invalid`, { error: error as Error })
    }
  }
  async deleteStep(taskId: string, stepId: string): Promise<void> {
    let task = this.getTask(taskId)
    if (!task) {
      Logger.warn(`[deleteStep]: Task ${taskId} does not exist`)
      return
    }
    if (!task.started) {
      Logger.info(`Task ${taskId} has not been started!`, {
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

    if (task.currentStep === stepId) {
      task.currentStep = undefined
    }

    delete task.steps[stepId]
    this.taskList.tasks[taskId] = task
    this.debouncedSave()
  }

  async nextStep(taskId: string): Promise<void> {
    let task = this.getTask(taskId)
    if (!task) {
      Logger.warn(`[nextStep]: Task ${taskId} does not exist`)
      return
    }
    if (!task.started) {
      Logger.info(`Task ${taskId} has not been started!`, {
        function: 'nextStep',
        source: 'taskStore'
      })
      task = await this.fetchTask(task)
      if (!task) {
        Logger.warn(`Task ${taskId} does not exist`, {
          function: 'nextStep',
          source: 'taskStore'
        })
        return
      }
    }
    if (!task.steps) {
      Logger.warn(`[nextStep]: Task ${taskId} does not have any steps`)
      return
    }
    if (!task.currentStep) {
      Logger.info(`[nextStep]: Task ${taskId} does not have a current step`)
      task.currentStep = Object.values(task.steps)[0].id
      this.taskList.tasks[taskId] = task
      this.debouncedSave()
      return
    }
    const currentStep = task.steps[task.currentStep]
    if (!currentStep) {
      Logger.warn(`[nextStep]: Task ${taskId} does not have a current step`)
      task.currentStep = Object.values(task.steps)[0].id
      this.taskList.tasks[taskId] = task
      this.debouncedSave()
      return
    }
    if (!currentStep.completed) {
      Logger.info(`[nextStep]: Step ${currentStep.id} in ${taskId} has not been completed yet!`)
      return
    }
    const nextStep = await this.getNextStep(task, task.currentStep)
    if (!nextStep) {
      Logger.warn(`[nextStep]: Task ${taskId} does not have a next step`)
      return
    }
    task.currentStep = nextStep.id
    this.taskList.tasks[taskId] = task
    this.debouncedSave()
  }
  async prevStep(taskId: string): Promise<void> {
    let task = this.getTask(taskId)
    if (!task) {
      Logger.warn(`[prevStep]: Task ${taskId} does not exist`)
      return
    }
    if (!task.started) {
      Logger.warn(`Task ${taskId} has not been started!`, {
        function: 'prevStep',
        source: 'taskStore'
      })
      task = await this.fetchTask(task)
      if (!task) {
        Logger.warn(`Task ${taskId} does not exist`, {
          function: 'prevStep',
          source: 'taskStore'
        })
        return
      }
    }
    if (!task.steps) {
      Logger.warn(`[prevStep]: Task ${taskId} does not have any steps`)
      return
    }
    if (!task.currentStep) {
      Logger.info(`[prevStep]: Task ${taskId} does not have a current step`)
      task.currentStep = Object.values(task.steps)[0].id
      this.taskList.tasks[taskId] = task
      this.debouncedSave()
      return
    }

    const stepIndex = Object.values(task.steps).findIndex((s) => s.id === task.currentStep)
    if (stepIndex === -1) {
      Logger.info(`[prevStep]: Task ${taskId} does not have a current step`)
      task.currentStep = Object.values(task.steps)[0].id
      this.taskList.tasks[taskId] = task
      this.debouncedSave()
      return
    }
    if (stepIndex === 0) {
      Logger.info(`[prevStep]: Task ${taskId} is on the first step`)
      return
    }
    const prevStep = Object.values(task.steps)[stepIndex - 1]
    task.currentStep = prevStep.id
    this.taskList.tasks[taskId] = task
    this.debouncedSave()
  }

  async getNextStep(task: string | Task, stepId: string): Promise<Step | undefined> {
    // If it is just the ID, fetch the actual task
    if (typeof task === 'string') {
      const newTask = this.getTask(task)
      if (!newTask || !newTask.started) {
        Logger.warn(`[getNextStep]: Task ${task} does not exist`)
        return
      }

      task = newTask
    }

    if (!task.steps) {
      Logger.warn(`[getNextStep]: Task ${task.id} does not have any steps`)
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
      Logger.info(`[getNextStep]: No next step for step ${stepId}`)
      return
    }

    return nextStep
  }

  async completeStep(taskId: string, stepId: string): Promise<void> {
    let task = this.getTask(taskId)
    if (!task) {
      Logger.warn(`[completeStep]: Task ${taskId} does not exist`)
      return
    }
    if (!task.started) {
      Logger.info(`Task ${taskId} has not been started!`, {
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
      Logger.info(`[completeStep]: Step ${stepId} does not exist`)
      return
    } else {
      task.steps[stepId].completed = true
    }
    this.taskList.tasks[taskId] = task

    const nextStep = await this.getNextStep(task, stepId)
    if (nextStep) {
      // Keep getting next steps until we find an incomplete one or reach the end
      let currentStep: Step | undefined = nextStep
      while (currentStep && currentStep.completed) {
        currentStep = await this.getNextStep(taskId, currentStep.id)
      }

      // If we found an incomplete step, set it as current
      // Otherwise currentStep will be undefined and we'll use the last known step
      task.currentStep = currentStep?.id || nextStep.id
    } else {
      task.currentStep = undefined
    }

    if (task.source != 'server') {
      appStore.completeStep(task, stepId)
    }

    this.notify('step', { taskId: task.id, source: task.source, step: task.steps[stepId] })

    // Potentially handle server action resolutions
    const allStepsCompleted = Object.values(task.steps).every((step) => step.completed)

    if (allStepsCompleted) {
      this.completeTask(taskId)
      Logger.log(LOGGING_LEVELS.LOG, `[completeStep]: All steps completed for task ${taskId}`)
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
