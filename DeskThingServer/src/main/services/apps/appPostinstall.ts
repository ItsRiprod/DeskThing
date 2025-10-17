import { ProgressChannel } from '@shared/types'
import { progressBus } from '../events/progressBus'
import { getAppFilePath, getManifest } from './appUtils'
import { fork } from 'child_process'
import { join } from 'path'
import { mkdir, rename, stat } from 'fs/promises'
import { existsSync } from 'fs'
import logger from '@server/utils/logger'
import { handleError } from '@server/utils/errorHandler'
import { app as ElectronApp } from 'electron'

export const runPostInstall = async (appId: string): Promise<void> => {
  progressBus.start(
    ProgressChannel.FN_APP_POSTINSTALL,
    'Running Postinstall',
    'Running postinstall script'
  )

  const errors: string[] = []

  const appPath = getAppFilePath(appId)
  const appManifestData = await getManifest(appPath)

  if (!appManifestData?.postinstall) {
    console.log(appManifestData)
    progressBus.complete(ProgressChannel.FN_APP_POSTINSTALL, 'Postinstall skipped')
    return
  }

  const possibleLocations = [
    appManifestData.postinstall_script,
    appManifestData.postinstall_script?.replace('.js', '.mjs'),
    appManifestData.postinstall_script?.replace('.js', '.cjs'),
    'postinstall.js',
    'postinstall.mjs',
    'postinstall.cjs'
  ]

  const scriptPath = await findScriptName(appPath, possibleLocations)

  if (!scriptPath) {
    progressBus.complete(ProgressChannel.FN_APP_POSTINSTALL, 'Postinstall skipped (no file found)')
    logger.debug('Locations Checked: ' + possibleLocations.join(', '))
    return
  }

  try {
    await stat(scriptPath) // will throw if the path doesn't exist

    // Creates the server path if it has not been made yet
    const serverDir = join(appPath, 'server')
    if (!existsSync(serverDir)) {
      progressBus.update(
        ProgressChannel.FN_APP_POSTINSTALL,
        `Creating server directory: ${serverDir}`,
        10
      )
      try {
        await mkdir(serverDir, { recursive: true })
      } catch (err) {
        progressBus.warn(
          ProgressChannel.FN_APP_POSTINSTALL,
          `Error creating server directory: ${err instanceof Error ? err.message : err}`
        )
        errors.push('Unable to make server dir')
      }
    }

    const libDir = join(appPath, 'lib')

    if (!existsSync(libDir)) {
      progressBus.update(
        ProgressChannel.FN_APP_POSTINSTALL,
        `Creating lib directory: ${libDir}`,
        10
      )
      try {
        await mkdir(libDir, { recursive: true })
      } catch (err) {
        progressBus.warn(
          ProgressChannel.FN_APP_POSTINSTALL,
          `Error creating lib directory: ${err instanceof Error ? err.message : err}`
        )
        errors.push('Unable to make lib dir')
      }
    }

    const mjsScriptPath = scriptPath.replace(/\.js$/, '.mjs')

    // Only rename if it's not already an .mjs file
    if (scriptPath !== mjsScriptPath) {
      // Check if the file already exists (from a previous attempt)
      if (!existsSync(mjsScriptPath)) {
        await rename(scriptPath, mjsScriptPath)
      }
    }

    const child = fork(mjsScriptPath, {
      cwd: appPath,
      silent: true,
      env: {
        DESKTHING_APP_NAME: appId,
        DESKTHING_LIB_DIR: libDir,
        DESKTHING_ROOT_DIR: appPath,
        DESKTHING_SERVER_PATH: serverDir,
        DESKTHING_VERSION: ElectronApp.getVersion(),
        ...process.env
      }
    })

    progressBus.update(ProgressChannel.FN_APP_POSTINSTALL, `Running script`, 30)

    child.stdout?.on('data', (data) => {
      progressBus.update(ProgressChannel.FN_APP_POSTINSTALL, data.toString())
    })

    child.stderr?.on('data', (data) => {
      progressBus.update(ProgressChannel.FN_APP_POSTINSTALL, `Error: ${data.toString()}`)
    })

    child.on('error', (error) => {
      progressBus.warn(
        ProgressChannel.FN_APP_POSTINSTALL,
        `Postinstall Error`,
        error instanceof Error ? error.message : handleError(error)
      )
      errors.push(handleError(error))
      throw error
    })

    await new Promise<void>((resolve, reject) => {
      child.on('exit', (code) => {
        if (code === 0) {
          resolve()
        } else {
          errors.push(`Postinstall script exited with code ${code}`)
          reject(new Error(`Postinstall script exited with code ${code}`))
        }
      })
    })
  } catch (error) {
    progressBus.error(
      ProgressChannel.FN_APP_POSTINSTALL,
      'Critical error while running postinstall',
      error instanceof Error ? error.message : String(error)
    )
    throw error
  } finally {
    progressBus.complete(
      ProgressChannel.FN_APP_POSTINSTALL,
      `Postinstall completed with ${errors.length} errors. ${errors.length > 0 && 'See logs for details'}`,
      'Postinstall Complete'
    )
    if (errors.length > 0) {
      logger.warn(`Postinstall errors: ${errors.join(', ')}`)
    }
  }
}

const findScriptName = async (
  appLocation: string,
  altScriptNames?: (undefined | string)[]
): Promise<string | undefined> => {
  const scriptNames = altScriptNames?.filter(Boolean) || []
  for (const scriptName of scriptNames) {
    if (!scriptName) continue

    const scriptPath = join(appLocation, scriptName)
    try {
      await stat(scriptPath) // throws if the file does not exist
      return scriptPath
    } catch {
      continue
    }
  }
  return undefined
}
