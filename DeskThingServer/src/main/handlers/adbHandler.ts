console.log('[ADB Handler] Starting')
import path from 'path'
import { execFile } from 'child_process'
import getPlatform from '@server/utils/get-platform'
import Logger from '@server/utils/logger'
import { storeProvider } from '../stores/storeProvider'
import { progressBus } from '@server/services/events/progressBus'
import { ProgressChannel } from '@shared/types'

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
 * @channel - {@link ProgressChannel.ADB}
 * @returns A Promise that resolves with the output of the ADB command.
 */
export const handleAdbCommands = async (command: string): Promise<string> => {
  progressBus.start(ProgressChannel.ADB, 'ADB - Runner', 'Executing ADB Command')
  const settingsStore = await storeProvider.getStore('settingsStore')
  const useGlobalADB = await settingsStore.getSetting('adb_useGlobal')
  Logger.info(useGlobalADB ? 'Using Global ADB' : 'Using Local ADB')
  return new Promise((resolve, reject) => {
    execFile(
      useGlobalADB ? 'adb' : adbPath,
      splitArgs(command),
      { cwd: execPath },
      (error, stdout, stderr) => {
        if (error) {
          progressBus.error(ProgressChannel.ADB, 'Error Encountered!', error.message)
          Logger.error(
            `ADB Error: STDERR: ${stderr}  STDOUT: ${stdout}, COMMAND: ${command}, PATH: ${adbPath}`,
            {
              error: error as Error,
              function: 'adbHandler',
              source: 'adbHandler'
            }
          )
          reject(new Error(`ADB Error: ${stderr}, ${command}, ${adbPath}`))
        } else {
          progressBus.complete(ProgressChannel.ADB, 'ADB Success!')
          resolve(stdout)
        }
      }
    )
  })
}
