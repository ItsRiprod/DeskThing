import path from 'path'
import { execFile } from 'child_process'
import getPlatform from '../utils/get-platform'
import dataListener, { MESSAGE_TYPES } from '../utils/events'

const isDevelopment = process.env.NODE_ENV === 'development'
const execPath = isDevelopment
  ? path.join(__dirname, '..', '..', 'adb_source', getPlatform())
  : path.join(process.resourcesPath, getPlatform())

const adbExecutableName = process.platform === 'win32' ? 'adb.exe' : 'adb'
const adbPath = path.join(execPath, adbExecutableName)

export const handleAdbCommands = (command: string, event?): Promise<string> => {
  return new Promise((resolve, reject) => {
    execFile(adbPath, command.split(' '), { cwd: execPath }, (error, stdout, stderr) => {
      if (error) {
        if (event) {
          event.sender.send('logging', {
            status: false,
            data: 'Error Encountered!',
            final: true,
            error: stderr
          })
        }
        dataListener.emit(MESSAGE_TYPES.ERROR, `ADB Error: ${stderr}, ${command}, ${adbPath}`)
        reject(`ADB Error: ${stderr}, ${command}, ${adbPath}`)
      } else {
        if (event) {
          event.sender.send('logging', {
            status: true,
            data: 'ADB Success!',
            final: true
          })
        }
        resolve(stdout)
      }
    })
  })
}
