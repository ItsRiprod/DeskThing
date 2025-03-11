import { Task, Step } from '@deskthing/types'
import { FullTaskList } from '@shared/types'

export type TaskStoreEvents = {
  /** Full key-val task list update */
  taskList: { source: string; taskList: Record<string, Task> }
  /** Individual step updates */
  step: { source: string; taskId: string; step: Step }
  /** Individual task updates */
  task: Task
  /** Current Task Updates */
  currentTask: { source: string; id: string }
}

// Create listener types automatically from event map
export type Listener<T> = (payload: T) => void
export type TaskStoreListener<K extends keyof TaskStoreEvents> = Listener<TaskStoreEvents[K]>

// Create listeners collection type automatically
export type TaskStoreListeners = {
  [K in keyof TaskStoreEvents]: TaskStoreListener<K>[]
}

export interface TaskStoreClass {
  /**
   * Clears the task store cache
   */
  clearCache(): Promise<void>

  /**
   * Saves the current task list to file
   */
  saveToFile(): Promise<void>

  /**
   * Registers an event listener
   * @param type Event type to listen for
   * @param listener Function to call when event occurs
   * @returns Function to unregister the listener
   */
  on<K extends keyof TaskStoreEvents>(type: K, listener: TaskStoreListener<K>): () => void

  /**
   * Unregisters an event listener
   * @param type Event type to stop listening for
   * @param listener Function to remove
   */
  off<K extends keyof TaskStoreEvents>(type: K, listener: TaskStoreListener<K>): void

  /**
   * Gets the current task list
   * @returns Promise resolving to the task list
   */
  getTaskList(): Promise<FullTaskList>

  /**
   * Gets the current task
   * @returns Promise resolving to the current Task or undefined
   */
  getCurrentTask(): Promise<Task | undefined>

  /**
   * Gets the current task reference
   * @returns Current task reference or undefined
   */
  getCurrentTaskReference(): { source: string; id: string } | undefined

  /**
   * Adds a new task
   * @param task Task to add
   */
  addTask(task: Task): Promise<void>

  /**
   * Adds multiple tasks
   * @param appId Source app ID
   * @param tasks Record of tasks to add
   */
  addTasks(appId: string, tasks: Record<string, Task>): Promise<void>

  /**
   * Updates a task
   * @param source Source identifier
   * @param newTask Partial task data to update
   */
  updateTask(source: string, newTask: Partial<Task>): Promise<void>

  /**
   * Deletes a task
   * @param sourceId Source identifier
   * @param taskId ID or array of IDs of tasks to delete
   */
  deleteTask(sourceId: string, taskId: string[] | string): Promise<void>

  /**
   * Marks a task as completed
   * @param sourceId Source identifier
   * @param taskId ID of task to complete
   */
  completeTask(sourceId: string, taskId: string): Promise<void>

  /**
   * Restarts a task
   * @param source Optional source identifier
   * @param id Optional task ID
   */
  restartTask(source?: string, id?: string): Promise<void>

  /**
   * Starts a task
   * @param source Source identifier
   * @param id Task ID
   */
  startTask(source: string, id: string): Promise<void>

  /**
   * Stops a task
   * @param source Source identifier
   * @param id Task ID
   */
  stopTask(source: string, id: string): Promise<void>

  /**
   * Pauses the current task
   */
  pauseTask(): Promise<void>

  /**
   * Adds a step to a task
   * @param source Source identifier
   * @param id Task ID
   * @param step Step to add
   */
  addStep(source: string, id: string, step: Step): Promise<void>

  /**
   * Updates a step in a task
   * @param source Source identifier
   * @param id Task ID
   * @param newStep Partial step data to update
   */
  updateStep(source: string, id: string, newStep: Partial<Step>): Promise<void>

  /**
   * Deletes a step from a task
   * @param source Source identifier
   * @param taskId Task ID
   * @param stepId Step ID to delete
   */
  deleteStep(source: string, taskId: string, stepId: string): Promise<void>

  /**
   * Moves to the next step in a task
   * @param source Source identifier
   * @param taskId Task ID
   */
  nextStep(source: string, taskId: string): Promise<void>

  /**
   * Moves to the previous step in a task
   * @param source Source identifier
   * @param taskId Task ID
   */
  prevStep(source: string, taskId: string): Promise<void>

  /**
   * Gets the next step in a task
   * @param task Task object
   * @param stepId Current step ID
   * @returns Promise resolving to the next Step or undefined
   */
  getNextStep(task: Task, stepId: string): Promise<Step | undefined>

  /**
   * Marks a step as completed
   * @param source Source identifier
   * @param taskId Task ID
   * @param stepId Step ID to complete
   */
  completeStep(source: string, taskId: string, stepId: string): Promise<void>

  /**
   * Restarts a step
   * @param source Source identifier
   * @param taskId Task ID
   * @param stepId Step ID to restart
   */
  restartStep(source: string, taskId: string, stepId: string): Promise<void>
}
