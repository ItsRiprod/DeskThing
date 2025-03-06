import { FullTaskList } from '@shared/types'
import { readFromFile, writeToFile } from './fileService'
import { join } from 'node:path'
import logger from '@server/utils/logger'
import { isValidTaskList, sanitizeTaskList, sanitizeTaskListFile } from '../task'

export const saveTaskList = async (taskList: FullTaskList): Promise<void> => {
  try {
    const sTaskList = sanitizeTaskListFile(taskList)
    isValidTaskList(sTaskList)
    const taskListPath = join('system', 'tasks.json')
    await writeToFile(sTaskList, taskListPath)
  } catch (error) {
    logger.error(`Failed to save task list`, {
      error: error as Error,
      function: 'saveTaskList',
      source: 'taskFileService'
    })
    throw new Error(`Failed to save task list: ${error}`)
  }
}

export const readTasksFromFile = async (): Promise<FullTaskList | undefined> => {
  try {
    const taskListPath = join('system', 'tasks.json')
    const taskList = await readFromFile<FullTaskList>(taskListPath)
    isValidTaskList(taskList)
    const sTaskList = sanitizeTaskList(taskList)
    return sTaskList
  } catch (error) {
    logger.error(`Failed to read task list`, {
      error: error as Error,
      function: 'readTasksFromFile',
      source: 'taskFileService'
    })
    throw new Error(`Failed to read task list: ${error}`)
  }
}
