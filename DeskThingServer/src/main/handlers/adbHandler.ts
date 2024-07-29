import path from 'path'
import { exec } from 'child_process'
import getPlatform from '../utils/get-platform'

const isProduction = process.env.NODE_ENV === 'development'
const execPath = isProduction
  ? path.join(__dirname, '..', '..', 'adb_source', getPlatform())
  : path.join(process.resourcesPath, getPlatform())

const adbExecutableName = process.platform === 'win32' ? 'adb.exe' : 'adb'
const adbPath = path.join(execPath, adbExecutableName)

export const handleAdbCommands = (command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(`cd '${execPath}' && ${adbExecutableName} ${command}`, (error, stdout, stderr) => {
      if (error) {
        reject(`ADB Error: ${stderr}, ${command}, ${adbPath}`)
      } else {
        resolve(stdout)
      }
    })
  })
}
