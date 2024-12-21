/**
 * Imports the `app` module from the `electron` package.
 * This module provides access to the Electron application's functionality.
 */
import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'

/**
 * Reads data from a file in the user's application data directory.
 *
 * @param filename - The name of the file to read.
 * @returns The parsed data from the file, or `false` if the file does not exist or an error occurs.
 */
export const readFromFile = <T>(filename: string): T | false => {
  const dataFilePath = join(app.getPath('userData'), filename)
  try {
    if (!fs.existsSync(dataFilePath)) {
      // File does not exist, create it with default data
      return false
    }

    const rawData = fs.readFileSync(dataFilePath)
    return JSON.parse(rawData.toString())
  } catch (err) {
    // console.error('Error reading data:', err)
    return false
  }
}

/**
 * Writes data to a file in the user's application data directory.
 * If the directory path does not exist, it will be created recursively.
 *
 * @param data - The data to be written to the file.
 * @param filepath - The path of the file relative to the user's application data directory.
 * @returns `true` if the write operation was successful, `false` otherwise.
 */
export const writeToFile = <T>(data: T, filepath: string): void => {
  try {
    const dataFilePath = join(app.getPath('userData'), filepath)
    const dirPath = join(app.getPath('userData'), ...filepath.split(/[/\\]/).slice(0, -1))
    if (!fs.existsSync(dirPath)) {
      console.log('Creating directory path')
      fs.mkdirSync(dirPath, { recursive: true })
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2))
  } catch (err) {
    if (err instanceof Error) {
      throw new Error('[writeToFile]: failed with ' + err.message)
    } else {
      console.error(err)
      throw new Error('[writeToFile]: failed unexpectedly. Please see logs for full error')
    }
  }
}

/**
 * Writes data to a file at the specified filepath.
 *
 * @param data - The data to be written to the file.
 * @param filepath - The full path of the file to write the data to.
 * @throws - Error or Unknown
 */
export const writeToGlobalFile = <T>(data: T, filepath: string): void => {
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2))
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('[writeToGlobalFile] failed with ' + error.message)
    } else {
      console.error(error)
      throw error
    }
  }
}

/**
 * Reads data from a file at the specified global filepath.
 *
 * @param filename - The name of the file to read from the user's application data directory.
 * @returns The parsed data from the file, or `false` if the file does not exist or an error occurs.
 */
export const readFromGlobalFile = <T>(filename: string): T | false => {
  const dataFilePath = join(app.getPath('userData'), filename)
  try {
    if (!fs.existsSync(dataFilePath)) {
      // File does not exist, create it with default data
      return false
    }
    const rawData = fs.readFileSync(dataFilePath)
    return JSON.parse(rawData.toString())
  } catch (err) {
    // console.error('Error reading data:', err)
    return false
  }
}
