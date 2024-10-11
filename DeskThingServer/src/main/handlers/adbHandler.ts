import path from 'path'
import { execFile } from 'child_process'
import getPlatform from '../utils/get-platform'
import dataListener, { MESSAGE_TYPES } from '../utils/events'
import settingsStore from '../stores/settingsStore'

const isDevelopment = process.env.NODE_ENV === 'development'
const execPath = isDevelopment
  ? path.join(__dirname, '..', '..', 'adb_source', getPlatform())
  : path.join(process.resourcesPath, getPlatform())

const adbExecutableName = process.platform === 'win32' ? 'adb.exe' : 'adb'
const adbPath = path.join(execPath, adbExecutableName)

const splitArgs = (str: string): string[] => {
  const regex: RegExp = /(".*?"|[^"\s]+)(?=\s*|\s*$)/g
  const matches: string[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(str)) !== null) {
    matches.push(match[1].replace(/(^"|"$)/g, '')) // Remove surrounding quotes if any
  }

  return matches
}

export const handleAdbCommands = async (
  command: string,
  send?: (channel: string, ...args: any[]) => void
): Promise<string> => {
  const settings = await settingsStore.getSettings()
  const useGlobalADB = settings.globalADB === true
  dataListener.asyncEmit(
    MESSAGE_TYPES.LOGGING,
    useGlobalADB ? 'Using Global ADB' : 'Using Local ADB'
  )
  return new Promise((resolve, reject) => {
    execFile(
      useGlobalADB ? 'adb' : adbPath,
      splitArgs(command),
      { cwd: execPath },
      (error, stdout, stderr) => {
        console.log(error, stdout, stderr)
        if (error) {
          if (send) {
            send('logging', {
              status: false,
              data: 'Error Encountered!',
              final: true,
              error: stderr
            })
          }
          dataListener.asyncEmit(
            MESSAGE_TYPES.ERROR,
            `ADB Error: ${stderr}, ${command}, ${adbPath}`
          )
          reject(`ADB Error: ${stderr}, ${command}, ${adbPath}`)
        } else {
          if (send) {
            send('logging', {
              status: true,
              data: 'ADB Success!',
              final: true
            })
          }
          resolve(stdout)
        }
      }
    )
  })
}
