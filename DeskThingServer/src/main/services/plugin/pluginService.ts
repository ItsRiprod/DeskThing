import { PluginApplications, PluginManifest } from '@deskthing/types'
import { PluginPayload } from '@shared/types'
import appProcessPath from '@processes/appProcess?modulePath'
import { Worker } from 'node:worker_threads'
import logger from '@server/utils/logger'
import { PluginReference } from '@shared/stores/pluginStore'
import { join } from 'node:path'
import { readFromFile, writeToFile } from '../files/fileService'
import { readdir, stat } from 'node:fs/promises'
import { ADBServiceClass } from '@shared/stores/adbServiceClass'

async function launchWorker(
  filePath: string,
  operation: 'install' | 'uninstall',
  workerData: PluginPayload<PluginApplications>
): Promise<void> {
  const { log, error } = logger.createLogger({ method: 'Plugin Worker', store: 'pluginService' })

  const worker = new Worker(appProcessPath, {
    workerData: { filePath, operation, workerData },
    name: 'Plugin Initializer',
    stdout: true,
    stderr: true
  })

  const TIMEOUT_MS = 60_000 // 60 seconds

  return new Promise((resolve) => {
    let settled = false
    const cleanup = (): void => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      worker.removeAllListeners()
      try {
        worker.stdout?.removeAllListeners()
        worker.stderr?.removeAllListeners()
        worker.stdout?.destroy?.()
        worker.stderr?.destroy?.()
      } catch {
        // ignore stream cleanup errors
      }
    }

    const onResolve = (msg?: string): void => {
      if (!settled) {
        log(msg ?? 'Worker finished or timed out')
        cleanup()
        resolve()
      }
    }

    const onError = (err: unknown): void => {
      if (!settled) {
        error('Worker error', err as Error)
        cleanup()
        // Per request: resolve when worker closes or timeout; do not throw here.
        resolve()
      }
    }

    // stdout/stderr logging
    if (worker.stdout) {
      worker.stdout.on('data', (chunk: Buffer | string) => {
        log(String(chunk).trim())
      })
      worker.stdout.on('error', (err) => {
        error('Worker stdout error', err)
      })
    }

    if (worker.stderr) {
      worker.stderr.on('data', (chunk: Buffer | string) => {
        error(String(chunk).trim())
      })
      worker.stderr.on('error', (err) => {
        error('Worker stderr error', err)
      })
    }

    // messages from worker
    worker.on('message', (msg) => {
      try {
        if (msg && typeof msg === 'object' && msg.level === 'error') {
          error('Worker message', msg)
        } else {
          log('Worker message', msg)
        }
      } catch {
        log('Worker message (unserializable)')
      }
    })

    // worker runtime errors
    worker.on('error', (err) => {
      onError(err)
    })

    // exit: consider success regardless of exit code but log non-zero
    worker.on('exit', (code) => {
      if (code === 0) {
        onResolve('Worker exited successfully (code 0)')
      } else {
        error(`Worker exited with code ${code}`)
        onResolve(`Worker exited with code ${code}`)
      }
    })

    // timeout handling: terminate and resolve
    const timeout = setTimeout(() => {
      error(`Worker timed out after ${TIMEOUT_MS}ms, terminating`)
      // attempt graceful termination then resolve
      worker.terminate().finally(() => onResolve('Worker terminated due to timeout'))
    }, TIMEOUT_MS)
  })
}

export const savePluginReferences = async (pluginReference: PluginReference[]): Promise<void> => {
  const { debug, error } = logger.createLogger({
    method: 'Save Plugin Reference',
    store: 'pluginService'
  })

  const filePath = join('plugins', 'pluginReferences.json')

  try {
    debug('Saving plugin reference to', filePath)
    await writeToFile(pluginReference, filePath)
  } catch (err) {
    error('Failed to save plugin reference', err as Error)
  }
}

export const readPluginReferences = async (): Promise<PluginReference[] | null> => {
  const { debug, error, warn } = logger.createLogger({
    method: 'Read Plugin Reference',
    store: 'pluginService'
  })

  const filePath = join('plugins', 'pluginReferences.json')

  try {
    const pluginReference = await readFromFile<PluginReference[]>(filePath)

    if (!pluginReference) {
      warn('No plugin reference found at:', filePath)
      return null
    }

    debug('Read plugin reference from', filePath)
    return pluginReference
  } catch (err) {
    error('Failed to read plugin reference', err as Error)
    return null
  }
}

export const findPluginsInDirectory = async (pluginDir: string): Promise<PluginManifest[]> => {
  const { debug, warn, error } = logger.createLogger({
    method: 'Find Plugins',
    store: 'pluginService'
  })

  try {
    const entries = await readdir(pluginDir, { withFileTypes: true })
    const manifests: PluginManifest[] = []

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const manifestPath = join(pluginDir, entry.name, 'manifest.json')
      try {
        const manifest = await readFromFile<PluginManifest>(manifestPath)
        if (manifest) {
          manifests.push(manifest)
          debug('Found plugin manifest at', manifestPath)
        } else {
          warn('No manifest found or manifest empty at', manifestPath)
        }
      } catch (err) {
        warn('Failed to read manifest at', manifestPath, err as Error)
      }
    }

    return manifests
  } catch (err) {
    error('Failed to read plugin directory', err as Error)
    return []
  }
}

export const getPluginManifestFromPath = async (pluginPath: string): Promise<PluginManifest> => {
  const manifestPath = join(pluginPath, 'manifest.json')
  const manifest = await readFromFile<PluginManifest>(manifestPath)
  if (!manifest) {
    throw new Error(`No manifest found at path: ${manifestPath}`)
  }
  return manifest
}

type ADBRegistryEntry = {
  pluginId: string
  pluginVersion: string
  installDate: string
}

const getADBRegistry = async (
  adbService: ADBServiceClass,
  adbId: string
): Promise<ADBRegistryEntry[]> => {
  const { debug, error } = logger.createLogger({
    method: 'Get ADB Registry',
    store: 'pluginService'
  })

  const deviceRegistryDir = join('var', 'lib')
  const deviceRegistryPath = join(deviceRegistryDir, 'pluginRegistry.json')

  try {
    const registryContent = await adbService.sendCommand('shell cat ' + deviceRegistryPath, adbId)
    if (registryContent) {
      const registry: ADBRegistryEntry[] = JSON.parse(registryContent)
      debug('Fetched ADB registry from device:', adbId)
      return registry
    } else {
      debug('No ADB registry found on device:', adbId)
      return []
    }
  } catch (err) {
    error('Failed to fetch ADB registry from device:', adbId, err as Error)
    return []
  }
}
const addToADBRegistry = async (
  adbService: ADBServiceClass,
  adbId: string,
  pluginId: string,
  pluginVersion: string
): Promise<void> => {
  const { debug, error } = logger.createLogger({
    method: 'Add to ADB Registry',
    store: 'pluginService'
  })

  const deviceRegistryDir = join('var', 'lib')
  const deviceRegistryPath = join(deviceRegistryDir, 'pluginRegistry.json')

  try {
    // Ensure the directory exists
    await adbService.sendCommand(`shell mkdir -p ${deviceRegistryDir}`, adbId)

    // Get existing registry
    const existingRegistry = await getADBRegistry(adbService, adbId)

    // Overwrite existing entry if present, otherwise add new entry
    const idx = existingRegistry.findIndex((e) => e.pluginId === pluginId)
    if (idx >= 0) {
      existingRegistry[idx] = {
        ...existingRegistry[idx],
        pluginVersion,
        installDate: new Date().toISOString()
      }
    } else {
      existingRegistry.push({
        pluginId,
        pluginVersion,
        installDate: new Date().toISOString()
      })
    }

    // Write updated registry back to device
    const tempFilePath = '/data/local/tmp/pluginRegistry.json.tmp'
    const json = JSON.stringify(existingRegistry, null, 2)
    const b64 = Buffer.from(json, 'utf8').toString('base64')
    // write file on device by echoing base64 and decoding there (uses only sendCommand)
    debug('Writing updated ADB registry to device:', adbId)
    await adbService.sendCommand(`shell echo '${b64}' | base64 -d > ${tempFilePath}`, adbId)
    debug('Moving temp registry to final location on device:', adbId)
    await adbService.sendCommand(`shell mv ${tempFilePath} ${deviceRegistryPath}`, adbId)

    debug(`Added plugin ${pluginId} to ADB registry on device:`, adbId)
  } catch (err) {
    error('Failed to add plugin to ADB registry on device:', adbId, err as Error)
  }
}

const removeFromADBRegistry = async (
  adbService: ADBServiceClass,
  adbId: string,
  pluginId: string
): Promise<void> => {
  const { debug, error } = logger.createLogger({
    method: 'Remove from ADB Registry',
    store: 'pluginService'
  })

  const deviceRegistryDir = join('var', 'lib')
  const deviceRegistryPath = join(deviceRegistryDir, 'pluginRegistry.json')

  try {
    // Get existing registry
    const existingRegistry = await getADBRegistry(adbService, adbId)

    // Filter out the plugin to be removed
    const updatedRegistry = existingRegistry.filter((e) => e.pluginId !== pluginId)

    // Write updated registry back to device
    const tempFilePath = '/data/local/tmp/pluginRegistry.json.tmp'
    const json = JSON.stringify(updatedRegistry, null, 2)
    const b64 = Buffer.from(json, 'utf8').toString('base64')
    // write file on device by echoing base64 and decoding there (uses only sendCommand)
    debug('Writing updated ADB registry to device:', adbId)
    await adbService.sendCommand(`shell echo '${b64}' | base64 -d > ${tempFilePath}`, adbId)
    debug('Moving temp registry to final location on device:', adbId)
    await adbService.sendCommand(`shell mv ${tempFilePath} ${deviceRegistryPath}`, adbId)

    debug(`Removed plugin ${pluginId} from ADB registry on device:`, adbId)
  } catch (err) {
    error('Failed to remove plugin from ADB registry on device:', adbId, err as Error)
  }
}

export const runADBPlugin = async (
  adbService: ADBServiceClass,
  pluginManifest: PluginManifest,
  data: PluginPayload<PluginApplications.ADB>
): Promise<void> => {
  const { debug, error } = logger.createLogger({
    method: 'Run ADB Plugin',
    store: 'pluginService'
  })

  if (!pluginManifest.entrypoints?.[PluginApplications.ADB]) {
    throw new Error('Invalid plugin manifest: missing ADB entrypoint')
  }

  // only run the somewhat expensive check for if it has run before IF the plugin requires it
  if (pluginManifest.entrypoints[PluginApplications.ADB].isRepeatable === false) {
    const existingRegistry = await getADBRegistry(adbService, data.adbId)
    const pluginEntry = existingRegistry.find((entry) => entry.pluginId === pluginManifest.id)

    if (!pluginEntry || pluginEntry.pluginVersion !== pluginManifest.version) {
      debug(`Plugin ${pluginManifest.id} has not been run before on device ${data.adbId}`)

      // case a: not found, add to reg and continue
      try {
        await addToADBRegistry(adbService, data.adbId, pluginManifest.id, pluginManifest.version)
      } catch (err) {
        error('Failed to add plugin to ADB registry after running plugin')
        throw err
      }

      // continue to run the plugin
    } else if (pluginEntry.pluginVersion === pluginManifest.version) {
      // case b: found, version matches, skip
      debug(`Plugin ${pluginManifest.id} already run on device ${data.adbId}, skipping`)
      return
    }
  }

  // Assuming plugins are stored in 'plugins/<pluginId>/index.js'
  const pluginPath = join(
    'plugins',
    pluginManifest.id,
    pluginManifest.entrypoints[PluginApplications.ADB].fileName
  )

  // check if the path exists
  try {
    await stat(pluginPath)
  } catch {
    throw new Error(`Plugin path does not exist: ${pluginPath}`)
  }

  // run the plugin in a worker
  debug(`Launching ADB plugin worker for ${pluginManifest.id}`)
  await launchWorker(pluginPath, 'install', data)
  debug(`Completed ADB plugin worker for ${pluginManifest.id}`)
}

export const removeADBPlugin = async (
  adbService: ADBServiceClass,
  pluginManifest: PluginManifest,
  data: PluginPayload<PluginApplications.ADB>
): Promise<void> => {
  const { debug, error } = logger.createLogger({
    method: 'Remove ADB Plugin',
    store: 'pluginService'
  })

  if (!pluginManifest.entrypoints?.[PluginApplications.ADB]) {
    throw new Error('Invalid plugin manifest: missing ADB entrypoint')
  }

  let err: unknown | Error

  // only run the somewhat expensive check for if it has run before IF the plugin requires it
  if (pluginManifest.entrypoints[PluginApplications.ADB].isRepeatable === false) {
    try {
      await removeFromADBRegistry(adbService, data.adbId, pluginManifest.id)
    } catch (er) {
      error('Failed to remove plugin from ADB registry before uninstalling plugin')
      err = er
    }
  }

  // Assuming plugins are stored in 'plugins/<pluginId>/index.js'
  const pluginPath = join(
    'plugins',
    pluginManifest.id,
    pluginManifest.entrypoints[PluginApplications.ADB].fileName
  )

  // check if the path exists
  try {
    await stat(pluginPath)
  } catch {
    throw new Error(`Plugin path does not exist: ${pluginPath}`)
  }

  // run the plugin in a worker
  debug(`Launching ADB plugin worker for ${pluginManifest.id}`)
  await launchWorker(pluginPath, 'uninstall', data)
  debug(`Completed ADB plugin worker for ${pluginManifest.id}`)

  // wait to throw the error till AFTER The worker uninstalls the plugin
  if (err) {
    throw err
  }
}
