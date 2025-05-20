import { ProgressChannel } from '@shared/types'
import { progressBus } from '../events/progressBus'
import { getAppFilePath, getManifest } from './appUtils'
import { spawn } from 'child_process'
import { join } from 'path'
import { rename, stat } from 'fs/promises'
import { app } from 'electron'
import { existsSync } from 'fs'

export const runPostInstall = async (): Promise<void> => {
  progressBus.start(
    ProgressChannel.FN_APP_POSTINSTALL,
    'Running Postinstall',
    'Running postinstall script'
  )

  const extractedPath = getAppFilePath('staged', 'extracted')
  const appManifestData = await getManifest(extractedPath)

  if (!appManifestData?.postinstall) {
    console.log(appManifestData)
    progressBus.complete(ProgressChannel.FN_APP_POSTINSTALL, 'Postinstall skipped')
    return
  }

  const script = appManifestData.postinstall_script || 'postinstall.js'
  const scriptPath = join(extractedPath, script)

  try {
    await stat(scriptPath) // will throw if the path doesn't exist

    const mjsScriptPath = scriptPath.replace(/\.js$/, '.mjs')

    // Only rename if it's not already an .mjs file
    if (scriptPath !== mjsScriptPath) {
      // Check if the file already exists (from a previous attempt)
      if (!existsSync(mjsScriptPath)) {
        await rename(scriptPath, mjsScriptPath)
      }
    }

    const child = spawn(app.getPath('exe'), ['--experimental-modules', mjsScriptPath], {
      cwd: extractedPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_OPTIONS: '--experimental-specifier-resolution=node'
      }
    })

    child.stdout?.on('data', (data) => {
      progressBus.update(ProgressChannel.FN_APP_POSTINSTALL, data.toString())
    })

    child.stderr?.on('data', (data) => {
      progressBus.update(ProgressChannel.FN_APP_POSTINSTALL, `Error: ${data.toString()}`)
    })

    child.on('error', (error) => {
      progressBus.error(
        ProgressChannel.FN_APP_POSTINSTALL,
        `Postinstall Error`,
        error instanceof Error ? error.message : String(error)
      )
      throw error
    })

    await new Promise<void>((resolve, reject) => {
      child.on('exit', (code) => {
        if (code === 0) {
          resolve()
        } else {
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
      'Postinstall Complete',
      'Postinstall completed successfully'
    )
  }
}
