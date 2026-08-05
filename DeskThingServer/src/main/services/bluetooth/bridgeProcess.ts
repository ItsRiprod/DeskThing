import path from 'path'
import { existsSync } from 'node:fs'
import { ChildProcess, spawn } from 'child_process'
import getPlatform from '@server/utils/get-platform'
import Logger from '@server/utils/logger'
import { LOGGING_LEVELS } from '@deskthing/types'

/**
 * Process supervision for the platform's Bluetooth bridge helper.
 *
 * This module's single job is keeping the helper process alive: spawn it,
 * restart it if it dies, stop it on shutdown, and surface its output through
 * the app logger. Talking to the helper is bridgeClient's job; deciding
 * whether this platform has a helper at all is the manager's job.
 */

const isDevelopment = process.env.NODE_ENV === 'development'

const resourceRoot = isDevelopment
  ? path.join(__dirname, '..', '..', '..', '..', 'bt_source')
  : process.resourcesPath

export const bridgeBinaryPath = path.join(
  resourceRoot,
  getPlatform(),
  process.platform === 'win32' ? 'btbridge.exe' : 'btbridge'
)

/** Where the device-side mux ships, for provisioning a Car Thing over adb. */
export const deviceMuxScriptPath = path.join(resourceRoot, 'superbird', 'btmux.py')

/** Device-side pairing agent, installed next to the mux during provisioning. */
export const deviceAgentScriptPath = path.join(resourceRoot, 'superbird', 'btagent.py')

const RESTART_DELAY_MS = 5000

let child: ChildProcess | undefined
let stopping = false
let restartTimer: NodeJS.Timeout | undefined

export const bridgeBinaryExists = (): boolean => existsSync(bridgeBinaryPath)

export const isBridgeRunning = (): boolean => child !== undefined

const launch = (): void => {
  if (stopping) return

  if (!bridgeBinaryExists()) {
    Logger.log(
      LOGGING_LEVELS.WARN,
      `[btBridge] helper not found at ${bridgeBinaryPath} — Bluetooth transport unavailable`
    )
    return
  }

  child = spawn(bridgeBinaryPath, [], { stdio: ['ignore', 'pipe', 'pipe'] })

  child.stdout?.on('data', (chunk: Buffer) => {
    chunk
      .toString()
      .split('\n')
      .filter(Boolean)
      .forEach((line) => Logger.log(LOGGING_LEVELS.DEBUG, `[btBridge] ${line}`))
  })

  child.stderr?.on('data', (chunk: Buffer) => {
    Logger.log(LOGGING_LEVELS.WARN, `[btBridge] ${chunk.toString().trim()}`)
  })

  child.on('error', (error) => {
    Logger.log(LOGGING_LEVELS.ERROR, `[btBridge] failed to start: ${error.message}`)
  })

  child.on('exit', (code, signal) => {
    child = undefined
    if (stopping) return
    Logger.log(
      LOGGING_LEVELS.WARN,
      `[btBridge] exited (code=${code} signal=${signal}); restarting in ${RESTART_DELAY_MS}ms`
    )
    restartTimer = setTimeout(launch, RESTART_DELAY_MS)
  })

  Logger.log(LOGGING_LEVELS.LOG, `[btBridge] started (pid ${child.pid})`)
}

export const startBridgeProcess = (): void => {
  if (child) return
  stopping = false
  launch()
}

export const stopBridgeProcess = (): void => {
  stopping = true
  if (restartTimer) {
    clearTimeout(restartTimer)
    restartTimer = undefined
  }
  if (child) {
    Logger.log(LOGGING_LEVELS.LOG, '[btBridge] stopping')
    child.kill()
    child = undefined
  }
}
