/**
 * Imports the `app` module from the `electron` package.
 * This module provides access to the Electron application's functionality.
 */
import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'
import Logger from '@server/utils/logger'

/**
 * Reads data from a file in the user's application data directory.
 *
 * @param filename - The name of the file to read.
 * @returns The parsed data from the file, or `false` if the file does not exist or an error occurs.
 */
export const readFromFile = async <T>(filename: string): Promise<T | false> => {
  const dataFilePath = join(app.getPath('userData'), filename)
  try {
    try {
      await fs.promises.access(dataFilePath)
    } catch (err) {
      throw new Error('[readFromFile]: File does not exist or do not have access', { cause: err })
    }

    const rawData = await fs.promises.readFile(dataFilePath)
    return JSON.parse(rawData.toString())
  } catch (err) {
    Logger.error('Error reading data', {
      error: err as Error,
      source: 'readFromFile'
    })
    throw new Error('[readFromFile]: Error reading data', { cause: err })
  }
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
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const tempPath = join(app.getPath('temp'), `${filepath}-${uniqueId}.tmp`)
  const tempDir = join(app.getPath('temp'), ...filepath.split(/[/\\]/).slice(0, -1))
  const finalPath = join(app.getPath('userData'), filepath)
  const dirPath = join(app.getPath('userData'), ...filepath.split(/[/\\]/).slice(0, -1))

  try {
    await Promise.all([
      fs.promises.mkdir(tempDir, { recursive: true }),
      fs.promises.mkdir(dirPath, { recursive: true })
    ])

    await fs.promises.writeFile(tempPath, JSON.stringify(data, null, 2))
    await fs.promises.copyFile(tempPath, finalPath)
    await fs.promises.unlink(tempPath)
  } catch (err) {
    Logger.error('Error writing data', {
      error: err as Error,
      source: 'writeToFile'
    })
    throw new Error('[writeToFile]: failed with ' + { source: err })
  } finally {
    await Promise.allSettled([
      fs.promises.rm(tempPath, { force: true }),
      fs.promises.rm(tempDir, { force: true, recursive: true })
    ])
  }
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
export const deleteFile = async (filename: string): Promise<boolean> => {
  if (!filename || typeof filename !== 'string') {
    console.error('[deleteFile] Invalid filename provided')
    return false
  }

  const filePath = join(app.getPath('userData'), filename)

  try {
    const fileStats = await fs.promises.stat(filePath)
    if (!fileStats.isFile()) {
      console.error('[deleteFile] Path exists but is not a file:', filePath)
      return false
    }

    await fs.promises.unlink(filePath)
    return true
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      // File doesn't exist, which is an acceptable state
      return false
    }

    if (error instanceof Error) {
      console.error('[deleteFile] Error deleting file:', error.message)
    } else {
      console.error('[deleteFile] Unknown error deleting file:', error)
    }

    return false
  }
}
