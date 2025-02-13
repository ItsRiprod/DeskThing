/**
 * Imports the `app` module from the `electron` package.
 * This module provides access to the Electron application's functionality.
 */
import { app } from 'electron'
import { join } from 'path'
import fs from 'node:fs'
import Logger from '@server/utils/logger'

class FileOperationQueue {
  private queues: Map<string, Array<() => Promise<void>>> = new Map()
  private processingQueues: Set<string> = new Set()
  private retryDelay = 100
  private maxRetries = 3

  private async processQueue(queueId: string): Promise<void> {
    if (this.processingQueues.has(queueId) || !this.queues.get(queueId)?.length) return

    this.processingQueues.add(queueId)
    const queue = this.queues.get(queueId)!
    const operation = queue.shift()

    if (operation) {
      let retries = 0
      while (retries < this.maxRetries) {
        try {
          await operation()
          break
        } catch (error) {
          retries++
          if (retries === this.maxRetries) {
            Logger.error(`Failed to process operation after ${this.maxRetries} retries`, {
              error: error as Error,
              function: 'processQueue',
              source: 'FileService'
            })
            break
          }
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay))
        }
      }
    }

    this.processingQueues.delete(queueId)
    if (queue.length === 0) {
      this.queues.delete(queueId)
    } else {
      this.processQueue(queueId)
    }
  }

  public enqueue<T>(queueId: string, operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.queues.has(queueId)) {
        this.queues.set(queueId, [])
      }

      this.queues.get(queueId)!.push(async () => {
        try {
          const result = await operation()
          resolve(result)
        } catch (err) {
          reject(err)
        }
      })
      this.processQueue(queueId)
    })
  }
}
const fileQueue = new FileOperationQueue()

/**
 * Reads data from a file in the user's application data directory.
 *
 * @param filename - The name of the file to read.
 * @returns The parsed data from the file, or `false` if the file does not exist or an error occurs.
 */
export const readFromFile = async <T>(filename: string): Promise<T | undefined> => {
  return fileQueue.enqueue(filename, async () => {
    const dataFilePath = join(app.getPath('userData'), filename)
    try {
      try {
        await fs.promises.access(dataFilePath)
      } catch (err) {
        throw new Error(`[readFromFile]: File ${filename} does not exist or do not have access`, {
          cause: err
        })
      }

      const rawData = await fs.promises.readFile(dataFilePath)
      return JSON.parse(rawData.toString())
    } catch (err) {
      Logger.error('Error reading data', {
        error: err as Error,
        source: 'readFromFile'
      })
      throw new Error(`[readFromFile]: Error reading data from file ${filename}`, { cause: err })
    }
  })
}

/**
 * Writes data to a file in the user's application data directory.
 * If the directory path does not exist, it will be created recursively.
 *
 * @param data - The data to be written to the file.
 * @param filepath - The path of the file relative to the user's application data directory.
 * @throws - error when it fails
 */
export const writeToFile = async <T>(data: T, filepath: string): Promise<void> => {
  return fileQueue.enqueue(filepath, async () => {
    const finalPath = join(app.getPath('userData'), filepath)
    const dirPath = join(app.getPath('userData'), ...filepath.split(/[/\\]/).slice(0, -1))

    try {
      // Check if file exists
      const fileExists = await fs.promises
        .access(finalPath)
        .then(() => true)
        .catch(() => false)

      if (!fileExists) {
        // If file doesn't exist, write directly
        await fs.promises.mkdir(dirPath, { recursive: true })
        await fs.promises.writeFile(finalPath, JSON.stringify(data, null, 2))
        return
      }

      // If file exists, use temp file for safe writing
      const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const tempPath = join(app.getPath('temp'), `${filepath}-${uniqueId}.tmp`)
      const tempDir = join(app.getPath('temp'), ...filepath.split(/[/\\]/).slice(0, -1))

      try {
        await fs.promises.mkdir(tempDir, { recursive: true })
        await fs.promises.mkdir(dirPath, { recursive: true })
        await fs.promises.writeFile(tempPath, JSON.stringify(data, null, 2))
        await fs.promises.copyFile(tempPath, finalPath)
      } catch (err) {
        Logger.error('Error writing data', {
          error: err as Error,
          source: 'writeToFile'
        })
        throw new Error('[writeToFile]: failed with ', { cause: err })
      } finally {
        try {
          await Promise.allSettled([
            fs.promises.rm(tempPath, { force: true }),
            fs.promises.rm(tempDir, { force: true, recursive: true })
          ])
        } catch (err) {
          Logger.error('Error deleting temp files', {
            error: err as Error,
            source: 'writeToFile'
          })
        }
      }
    } catch (err) {
      Logger.error('Error writing data', {
        error: err as Error,
        source: 'writeToFile'
      })
      throw new Error('[writeToFile]: failed with ', { cause: err })
    }
  })
}
export const addToFile = async (data: string | Buffer, filepath: string): Promise<void> => {
  return fileQueue.enqueue(filepath, async () => {
    const fullPath = join(app.getPath('userData'), filepath)
    const dirPath = join(app.getPath('userData'), ...filepath.split(/[/\\]/).slice(0, -1))

    try {
      await fs.promises.mkdir(dirPath, { recursive: true })

      const content = typeof data === 'string' ? data : data.toString()
      await fs.promises.appendFile(fullPath, content + '\n')
    } catch (err) {
      throw new Error('[addToFile]: failed with ' + { source: err })
    }
  })
}

/**
 * Writes data to a file at the specified filepath.
 *
 * @param data - The data to be written to the file.
 * @param filepath - The full path of the file to write the data to.
 * @depreciated - use {@link writeToFile} instead
 * @throws - Error or Unknown
 */
export const writeToGlobalFile = async <T>(data: T, filepath: string): Promise<void> => {
  writeToFile(data, filepath)
}

/**
 * Reads data from a file at the specified global filepath.
 *
 * @param filename - The name of the file to read from the user's application data directory.
 * @depreciated - use {@link readFromFile} instead
 * @returns The parsed data from the file, or `false` if the file does not exist or an error occurs.
 */
export const readFromGlobalFile = async <T>(filename: string): Promise<T | false> => {
  return fileQueue.enqueue(filename, async () => {
    const dataFilePath = join(app.getPath('userData'), filename)
    try {
      if (!fs.existsSync(dataFilePath)) {
        // File does not exist, create it with default data
        return false
      }
      const rawData = await fs.promises.readFile(dataFilePath)
      return JSON.parse(rawData.toString())
    } catch (err) {
      console.error('Error reading data:', err)
      return false
    }
  })
}
/**
 * Deletes a file from the user's application data directory.
 *
 * @param filename - The name of the file to delete.
 * @returns `true` if the deletion was successful, `false` if the file doesn't exist or an error occurs.
 /**
 * Deletes a file from the user's application data directory.
 *
 * @param filename - The name of the file to delete.
 * @returns `true` if the deletion was successful, `false` if the file doesn't exist or an error occurs.
 */
export const deleteFile = async (filename: string): Promise<void> => {
  if (!filename || typeof filename !== 'string') {
    throw new Error('[deleteFile] Invalid filename provided')
  }

  return fileQueue.enqueue(filename, async () => {
    const filePath = join(app.getPath('userData'), filename)

    try {
      const fileStats = await fs.promises.stat(filePath)
      if (!fileStats.isFile()) {
        throw new Error('[deleteFile] Path exists but is not a file: ' + filePath)
      }

      await fs.promises.unlink(filePath)
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        throw new Error('[deleteFile] File does not exist: ' + filePath)
      }

      if (error instanceof Error) {
        throw new Error('[deleteFile] Error deleting file: ' + error.message)
      } else {
        throw new Error('[deleteFile] Unknown error deleting file: ', { cause: error })
      }
    }
  })
}
