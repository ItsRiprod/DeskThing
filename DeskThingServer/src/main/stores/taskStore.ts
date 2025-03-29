// types
import { FullTaskList, CacheableStore } from '@shared/types'
import { LOGGING_LEVELS, APP_REQUESTS, Step, Task, DESKTHING_EVENTS } from '@DeskThing/types'
import {
  TaskStoreClass,
  TaskStoreEvents,
  TaskStoreListener,
  TaskStoreListeners
} from '@shared/stores/taskStore'

// Utils
import { isValidStep, isValidTask, sanitizeTask } from '@server/services/task/taskUtils'
import Logger from '@server/utils/logger'

// Static
import { AppDataStoreClass } from '@shared/stores/appDataStore'
import { AppStoreClass } from '@shared/stores/appStore'

export class TaskStore implements CacheableStore, TaskStoreClass {
  // This never gets saved to file
  private currentTask?: { source: string; id: string }
  private _initialized: boolean = false
  public get initialized(): boolean {
    return this._initialized
  }

  private listeners: TaskStoreListeners = {
    taskList: [],
    step: [],
    task: [],
    currentTask: []
  }

  // stores
  private appDataStore: AppDataStoreClass
  private appStore: AppStoreClass

  constructor(appDataStore: AppDataStoreClass, appStore: AppStoreClass) {
    this.appDataStore = appDataStore
    this.appStore = appStore
  }

  async initialize(): Promise<void> {
    if (this._initialized) return
    this._initialized = true
    this.appDataStore.initialize()
    this.initializeServerTasks()
    this.initializeListeners()
  }

  private initializeListeners = (): void => {
    this.appStore.onAppMessage(APP_REQUESTS.TASK, async (data) => {
      try {
        const source = data.source

        switch (data.request) {
          case 'init':
            if (data.payload?.tasks) {
              // Similar to handleRequestInitTasks
              this.initTasks(data.source, data.payload.tasks)
            }
            break

          case 'get': {
            // Get tasks for the requesting app
            const tasks = await this.appDataStore.getTasks(data.payload?.source || source)
            if (tasks) {
              this.appStore.sendDataToApp(source, {
                type: DESKTHING_EVENTS.TASKS,
                payload: tasks,
                request: 'update'
              })
            }
            break
          }

          case 'update':
            if (data.payload?.task) {
              await this.updateTask(source, data.payload.task)
            }
            break

          case 'delete':
            if (data.payload?.taskId) {
              await this.deleteTask(source, data.payload?.taskId)
            }
            break

          case 'add':
            if (data.payload?.task) {
              try {
                isValidTask(data.payload.task)
                const sanitizedTask = sanitizeTask(data.payload.task, source)
                await this.addTask(sanitizedTask)
              } catch (error) {
                Logger.error(`Invalid task in add request`, {
                  source: 'TaskStore',
                  function: 'initializeListeners',
                  error: error as Error
                })
              }
            }
            break

          case 'complete':
            if (data.payload?.taskId) {
              await this.completeTask(data.payload.source || source, data.payload.taskId)
            }
            break

          case 'restart':
            if (data.payload?.taskId) {
              await this.restartTask(data.payload.source || source, data.payload.taskId)
            }
            break

          case 'start':
            if (data.payload?.taskId) {
              await this.startTask(data.payload.source || source, data.payload.taskId)
            }
            break

          case 'end':
            if (data.payload?.taskId) {
              await this.stopTask(data.payload.source || source, data.payload.taskId)
            }
            break

          default:
            Logger.warn(`Unknown task request: ${String(data)}`, {
              source: 'TaskStore',
              function: 'initializeListeners'
            })
            break
        }
      } catch (error) {
        Logger.error(`Error handling task message`, {
          source: 'TaskStore',
          function: 'initializeListeners',
          error: error as Error
        })
      }
    })

    // Handle step operations
    this.appStore.onAppMessage(APP_REQUESTS.STEP, async (data) => {
      try {
        const source = data.source

        switch (data.request) {
          case 'get':
            if (data.payload?.taskId && data.payload?.stepId) {
              const step = await this.appDataStore.getStep(
                data.payload.source || source,
                data.payload.taskId,
                data.payload.stepId
              )
              if (step) {
                this.appStore.sendDataToApp(source, {
                  type: DESKTHING_EVENTS.TASKS,
                  payload: step,
                  request: 'step'
                })
              }
            }
            break

          case 'update':
            if (data.payload?.taskId && data.payload?.step) {
              await this.updateStep(source, data.payload.taskId, data.payload.step)
            }
            break

          case 'delete':
            if (data.payload?.taskId && data.payload?.stepId) {
              await this.deleteStep(source, data.payload.taskId, data.payload.stepId)
            }
            break

          case 'add':
            if (data.payload?.taskId && data.payload?.step) {
              try {
                isValidStep(data.payload.step)
                await this.addStep(source, data.payload.taskId, data.payload.step)
              } catch (error) {
                Logger.error(`Invalid step in add request`, {
                  source: 'TaskStore',
                  function: 'initializeListeners',
                  error: error as Error
                })
              }
            }
            break

          case 'complete':
            if (data.payload?.taskId && data.payload?.stepId) {
              await this.completeStep(source, data.payload.taskId, data.payload.stepId)
            }
            break

          case 'restart':
            if (data.payload?.taskId && data.payload?.stepId) {
              await this.restartStep(source, data.payload.taskId, data.payload.stepId)
            }
            break

          default:
            Logger.warn(`Unknown step request from ${source}: ${String(data)}`, {
              source: 'TaskStore',
              function: 'initializeListeners',
              domain: 'SERVER.' + source.toUpperCase()
            })
            break
        }
      } catch (error) {
        Logger.error(`Error handling step message`, {
          source: 'TaskStore',
          function: 'initializeListeners',
          error: error as Error
        })
      }
    })
  }

  /**
   * @implements CacheableStore
   */
  clearCache = async (): Promise<void> => {
    this.currentTask = undefined
  }
  /**
   * @implements CacheableStore
   */
  saveToFile = async (): Promise<void> => {}

  private initializeServerTasks = async (): Promise<void> => {
    const defaultTasks = await import('../static/defaultTasks')
    this.initTasks('server', defaultTasks.ServerTasks)
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

  public async initTasks(app: string, tasks: Record<string, Task>): Promise<void> {
    const existingTasks = (await this.appDataStore.getTasks(app)) || {}
    const newTasks = Object.entries(tasks as Record<string, Task>).reduce<Record<string, Task>>(
      (acc, [id, task]) => {
        try {
          isValidTask(task)
          if (!existingTasks[id] || task.version !== existingTasks[id].version) {
            const sanitizedTask = sanitizeTask(task, app)
            acc[id] = sanitizedTask
          }
          return acc
        } catch (error) {
          Logger.error(
            `Error in task init. Unable to add task ${typeof task == 'object' ? JSON.stringify(task) : 'unknown'}`,
            {
              source: 'TaskStore',
              function: 'initializeListeners',
              error: error as Error
            }
          )
          return acc
        }
      },
      {}
    )

    const mergedTasks = { ...existingTasks, ...newTasks }
    await this.addTasks(app, mergedTasks)
  }

  public async getTaskList(): Promise<FullTaskList> {
    const tasks = await this.appDataStore.getTaskList()
    return tasks
  }

  public async getCurrentTask(): Promise<Task | undefined> {
    if (!this.currentTask) return
    const task = await this.appDataStore.getTask(this.currentTask?.source, this.currentTask.id)
    return task
  }

  public getCurrentTaskReference(): { source: string; id: string } | undefined {
    return this.currentTask
  }

  /**
   * Task Management
   */

  public async addTask(task: Task): Promise<void> {
    try {
      isValidTask(task)

      // Updates the appDataStore listener with the new task
      this.notify('task', task)
    } catch (error) {
      Logger.error(`Error trying to add task ${task.id}`, {
        error: error as Error,
        function: 'addTask',
        source: 'taskStore'
      })
    }
  }

  public async addTasks(appId: string, tasks: Record<string, Task>): Promise<void> {
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
      this.notify('taskList', { source: appId, taskList: validTasks })
    }
  }

  async updateTask(source: string, newTask: Partial<Task>): Promise<void> {
    if (!newTask?.id) {
      Logger.warn('[updateTask]: Task does not have an ID')
      return
    }
    const task = this.appDataStore.getTask(source, newTask.id)

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
  }

  async deleteTask(sourceId: string, taskId: string[] | string): Promise<void> {
    if (!taskId || !sourceId) {
      Logger.warn('[deleteTask]: No task or source ID provided')
      return
    }

    const taskIds = Array.isArray(taskId) ? taskId : [taskId]

    await this.appDataStore.delTasks(sourceId, taskIds)
  }

  async completeTask(sourceId: string, taskId: string): Promise<void> {
    Logger.debug(`Completing task ${taskId} from ${sourceId}`)

    const task = await this.appDataStore.getTask(sourceId, taskId)

    if (!task) {
      Logger.warn(`[resolveTask]: Task ${taskId} does not exist`)
      return
    }

    // Early break if the task is already completed
    if (task.completed) return

    // Mark task as completed
    task.completed = true

    // Mark steps as completed
    if (task.steps) {
      Object.values(task.steps).forEach((step) => {
        step.completed = true
      })
    }

    if (this.currentTask?.id == taskId) this.currentTask = undefined

    task.currentStep = undefined

    // Update the apps and any other listeners of hte new task
    this.notify('task', task)
  }

  async restartTask(source?: string, id?: string): Promise<void> {
    Logger.debug(`Restarting task ${id} from ${source}`)
    if ((!source || !id) && !this.currentTask) {
      Logger.warn(`[restartTask]: No task or source ID provided`)
      return
    } else {
      source = source || this.currentTask?.source || ''
      id = id || this.currentTask?.id || ''
    }

    const task = await this.appDataStore.getTask(source, id)

    if (!task) {
      Logger.warn(`[restartTask]: Task ${id} does not exist`)
      return
    }

    task.completed = false
    task.started = false

    if (task.steps) {
      Object.values(task.steps).forEach((step) => {
        step.completed = false
      })
      task.currentStep = undefined
    }

    this.notify('task', task)
  }

  async startTask(source: string, id: string): Promise<void> {
    const task = await this.appDataStore.getTask(source, id)
    if (!task) {
      Logger.warn(`Task ${id} does not exist`, {
        function: 'startTask',
        source: 'taskStore'
      })
      return
    }

    task.started = true
    task.completed = false
    task.currentStep = task.currentStep || Object.keys(task.steps)[0]

    this.currentTask = { source, id }
    this.notify('task', task)
    this.notify('currentTask', this.currentTask)
  }

  async stopTask(source: string, id: string): Promise<void> {
    const task = await this.appDataStore.getTask(source, id)
    if (!task) {
      Logger.warn(`[stopTask]: Task ${id} does not exist`)
      return
    }

    task.started = false
    if (this.currentTask?.id == id) this.currentTask = undefined

    this.notify('task', task)
  }

  async pauseTask(): Promise<void> {
    this.currentTask = undefined
  }

  /**
   * Step Management
   */
  async addStep(source: string, id: string, step: Step): Promise<void> {
    const task = await this.appDataStore.getTask(source, id)
    if (!task) {
      Logger.warn(`[addStep]: Task ${id} does not exist`, {
        function: 'addStep',
        source: 'taskStore'
      })
      return
    }

    if (!task.steps) {
      task.steps = {}
    }
    task.steps[step.id] = step

    // Notify that the step was added and the task was changed
    this.notify('step', { taskId: task.id, source: task.source, step })
    this.notify('task', task)
  }

  async updateStep(source: string, id: string, newStep: Partial<Step>): Promise<void> {
    if (!newStep?.id) {
      Logger.warn('[updateStep]: Step does not have an ID')
      return
    }

    const step = await this.appDataStore.getStep(source, id, newStep.id)

    if (!step) {
      try {
        isValidStep(newStep)
        this.addStep(source, id, newStep)
      } catch (error) {
        Logger.warn(`[updateStep]: Invalid step ${newStep.id}`, {
          error: error as Error,
          function: 'updateStep',
          source: 'taskStore'
        })
      }
      return
    }

    const updatedStep = { ...step, ...newStep }

    try {
      isValidStep(updatedStep)

      this.notify('step', { taskId: id, source: source, step: updatedStep })
    } catch (error) {
      Logger.warn(`[updateStep]: Step ${newStep.id} is invalid`, {
        error: error as Error,
        function: 'updateStep',
        source: 'taskStore'
      })
    }
  }

  async deleteStep(source: string, taskId: string, stepId: string): Promise<void> {
    const task = await this.appDataStore.getTask(source, taskId)
    if (!task) {
      Logger.warn(`[deleteStep]: Task ${taskId} does not exist`, {
        function: 'deleteStep',
        source: 'taskStore'
      })
      return
    }

    if (!task.steps) {
      Logger.warn(`[deleteStep]: Task ${taskId} does not have any steps`, {
        function: 'deleteStep',
        source: 'taskStore'
      })
      return
    }

    if (!task.steps[stepId]) {
      Logger.warn(`[deleteStep]: Step ${stepId} does not exist`, {
        function: 'deleteStep',
        source: 'taskStore'
      })
      return
    }

    if (task.currentStep === stepId) {
      task.currentStep = undefined
    }

    delete task.steps[stepId]
    this.notify('task', task)
  }

  async nextStep(source: string, taskId: string): Promise<void> {
    const task = await this.appDataStore.getTask(source, taskId)
    if (!task) {
      Logger.warn(`[nextStep]: Task ${taskId} does not exist`, {
        function: 'nextStep',
        source: 'taskStore'
      })
      return
    }

    if (!task.started) {
      Logger.warn(`[nextStep]: Task ${taskId} has not been started! Starting...`, {
        function: 'nextStep',
        source: 'taskStore'
      })
      await this.startTask(source, taskId)
    }

    if (!task.steps) {
      Logger.warn(`[nextStep]: Task ${taskId} does not have any steps`, {
        function: 'nextStep',
        source: 'taskStore'
      })
      return
    }

    if (!task.currentStep) {
      Logger.warn(`[nextStep]: Task ${taskId} does not have a current step`, {
        function: 'nextStep',
        source: 'taskStore'
      })
      task.currentStep = Object.values(task.steps)[0].id
      this.notify('task', task)
      return
    }
    const currentStep = task.steps[task.currentStep]

    if (!currentStep) {
      Logger.warn(`[nextStep]: Task ${taskId} does not have a current step`, {
        function: 'nextStep',
        source: 'taskStore'
      })
      task.currentStep = Object.values(task.steps)[0].id
      this.notify('task', task)
      return
    }

    if (!currentStep.completed) {
      Logger.warn(`[nextStep]: Step ${currentStep.id} in ${taskId} has not been completed yet!`, {
        function: 'nextStep',
        source: 'taskStore'
      })
      return
    }

    const nextStep = await this.getNextStep(task, task.currentStep)

    if (!nextStep) {
      Logger.warn(`[nextStep]: Task ${taskId} does not have a next step`, {
        function: 'nextStep',
        source: 'taskStore'
      })
      return
    }

    task.currentStep = nextStep.id
    this.notify('task', task)
  }
  async prevStep(source: string, taskId: string): Promise<void> {
    const task = await this.appDataStore.getTask(source, taskId)
    if (!task) {
      Logger.warn(`[prevStep]: Task ${taskId} does not exist`, {
        function: 'prevStep',
        source: 'taskStore'
      })
      return
    }

    if (!task.steps) {
      Logger.warn(`[prevStep]: Task ${taskId} does not have any steps`, {
        function: 'prevStep',
        source: 'taskStore'
      })
      return
    }

    if (!task.currentStep) {
      Logger.warn(`[prevStep]: Task ${taskId} does not have a current step`, {
        function: 'prevStep',
        source: 'taskStore'
      })
      task.currentStep = Object.values(task.steps)[0].id
      this.notify('task', task)
      return
    }

    const stepIndex = Object.values(task.steps).findIndex((s) => s.id === task.currentStep)

    if (stepIndex === -1) {
      Logger.warn(`[prevStep]: Task ${taskId} does not have a current step`, {
        function: 'prevStep',
        source: 'taskStore'
      })
      task.currentStep = Object.values(task.steps)[0].id
      this.notify('task', task)
      return
    }

    if (stepIndex === 0) {
      Logger.warn(`[prevStep]: Task ${taskId} is on the first step`, {
        function: 'prevStep',
        source: 'taskStore'
      })
      return
    }

    const prevStep = Object.values(task.steps)[stepIndex - 1]
    task.currentStep = prevStep.id
    this.notify('task', task)
  }

  async getNextStep(task: Task, stepId: string): Promise<Step | undefined> {
    // If it is just the ID, fetch the actual task

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
      Logger.warn(`[getNextStep]: No next step for step ${stepId}`)
      return
    }

    return nextStep
  }

  async completeStep(source: string, taskId: string, stepId: string): Promise<void> {
    Logger.debug(`Completing step ${stepId} in task ${taskId} from ${source}`, {
      function: 'completeStep',
      source: 'taskStore'
    })
    const task = await this.appDataStore.getTask(source, taskId)

    if (!task) {
      Logger.warn(`[completeStep]: Task ${taskId} does not exist`, {
        function: 'completeStep',
        source: 'taskStore'
      })
      return
    }

    if (!task.steps) {
      Logger.warn(`[completeStep]: Task ${taskId} does not have any steps`, {
        function: 'completeStep',
        source: 'taskStore'
      })
      return
    }
    if (!task.steps[stepId]) {
      Logger.warn(`Step ${stepId} does not exist in task ${taskId}`, {
        function: 'completeStep',
        source: 'taskStore'
      })
      console.log(task)
      return
    } else {
      if (task.steps[stepId].completed) {
        Logger.info(`Step ${stepId} has already been completed`)
        return
      }

      task.steps[stepId].completed = true
    }

    const nextStep = await this.getNextStep(task, stepId)
    if (nextStep && !nextStep?.completed) {
      task.currentStep = nextStep.id
    } else {
      Logger.debug(`Step ${stepId} was the last to complete the task`, {
        function: 'completeStep',
        source: 'taskStore'
      })
      this.completeTask(source, taskId)
    }

    Logger.debug(`Step ${stepId} completed`, {
      function: 'completeStep',
      source: 'taskStore'
    })
    Logger.debug(`Step ${stepId} completed`, {
      function: 'completeStep',
      source: 'taskStore'
    })

    this.notify('step', { taskId, source, step: task.steps[stepId] })
    this.notify('task', task)
  }

  async restartStep(source: string, taskId: string, stepId: string): Promise<void> {
    const task = await this.appDataStore.getTask(source, taskId)
    if (!task) {
      Logger.warn(`[restartStep]: Task ${taskId} does not exist`)
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
    this.notify('task', task)
  }
}
