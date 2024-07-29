import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'

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
    console.error('Error reading data:', err)
    return false
  }
}

// Helper function to write data
export const writeToFile = <T>(data: T, filepath: string): boolean => {
  try {
    const dataFilePath = join(app.getPath('userData'), filepath)
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2))
    return true
  } catch (err) {
    console.error('Error writing data:', err)
    return false
  }
}
