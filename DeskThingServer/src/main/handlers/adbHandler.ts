console.log('[ADB Handler] Starting')
import path from 'node:path'
import { execFile } from 'node:child_process'
import getPlatform from '../utils/get-platform.ts'
import loggingStore from '../stores/loggingStore.ts'
import settingsStore from '../stores/settingsStore.ts'
import { MESSAGE_TYPES, ReplyFn } from '@shared/types/index.ts'

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

export const handleAdbCommands = async (command: string, replyFn?: ReplyFn): Promise<string> => {
  const settings = await settingsStore.getSettings()
  const useGlobalADB = settings.globalADB === true
  loggingStore.log(MESSAGE_TYPES.LOGGING, useGlobalADB ? 'Using Global ADB' : 'Using Local ADB')
  return new Promise((resolve, reject) => {
    execFile(
      useGlobalADB ? 'adb' : adbPath,
      splitArgs(command),
      { cwd: execPath },
      (error, stdout, stderr) => {
        if (error) {
          replyFn &&
            replyFn('logging', {
              status: false,
              data: 'Error Encountered!',
              final: false,
              error: stderr
            })
          loggingStore.log(MESSAGE_TYPES.ERROR, `ADB Error: ${stderr}, ${command}, ${adbPath}`)
          reject(`ADB Error: ${stderr}, ${command}, ${adbPath}`)
        } else {
          replyFn &&
            replyFn('logging', {
              status: true,
              data: 'ADB Success!',
              final: false
            })
          resolve(stdout)
        }
      }
    )
  })
}
