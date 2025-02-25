console.log('[ADB Handler] Starting')
import path from 'path'
import { execFile } from 'child_process'
import getPlatform from '@server/utils/get-platform'
import Logger from '@server/utils/logger'
import settingsStore from '../stores/settingsStore'
import { ReplyFn } from '@shared/types'

const isDevelopment = process.env.NODE_ENV === 'development'
const execPath = isDevelopment
  ? path.join(__dirname, '..', '..', '..', 'adb_source', getPlatform())
  : path.join(process.resourcesPath, getPlatform())

const adbExecutableName = process.platform === 'win32' ? 'adb.exe' : 'adb'
const adbPath = path.join(execPath, adbExecutableName)

/**
 * Splits a string into an array of arguments, handling quoted strings.
 * @param str - The input string to split.
 * @returns An array of arguments extracted from the input string.
 */
const splitArgs = (str: string): string[] => {
  const regex: RegExp = /(".*?"|[^"\s]+)(?=\s*|\s*$)/g
  const matches: string[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(str)) !== null) {
    matches.push(match[1].replace(/(^"|"$)/g, '')) // Remove surrounding quotes if any
  }

  return matches
}

/**
 * Executes an ADB command and returns the output.
 * @param command - The ADB command to execute.
 * @param replyFn - An optional callback function to handle logging.
 * @returns A Promise that resolves with the output of the ADB command.
 */
export const handleAdbCommands = async (command: string, replyFn?: ReplyFn): Promise<string> => {
  const settings = await settingsStore.getSettings()
  const useGlobalADB = settings.globalADB === true
  Logger.info(useGlobalADB ? 'Using Global ADB' : 'Using Local ADB')
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
          Logger.error(`ADB Error: ${stderr}, ${command}, ${adbPath}`, {
            error: error as Error,
            function: 'adbHandler',
            source: 'adbHandler'
          })
          reject(new Error(`ADB Error: ${stderr}, ${command}, ${adbPath}`))
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
