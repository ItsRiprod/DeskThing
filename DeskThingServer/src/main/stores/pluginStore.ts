// types
import { CacheableStore } from '@shared/types'
import { PluginApplications, PluginManifest } from '@deskthing/types'

import { PluginReference, PluginStoreClass, PluginStoreEvents } from '@shared/stores/pluginStore'
import EventEmitter from 'node:events'
import { ADBServiceClass } from '@shared/stores/adbServiceClass'
import { ADBService } from './platforms/superbird/adbService'
import {
  findPluginsInDirectory,
  getPluginManifestFromPath,
  removeADBPlugin,
  runADBPlugin,
  savePluginReferences
} from '@server/services/plugin/pluginService'
import logger from '@server/utils/logger'
import * as fs from 'node:fs/promises'
import { join } from 'node:path'

export class PluginStore
  extends EventEmitter<PluginStoreEvents>
  implements CacheableStore, PluginStoreClass
{
  private pluginDirectory: Record<string, PluginReference> = {}
  private pluginCache: PluginManifest[] = []
  // This never gets saved to file
  private _initialized: boolean = false
  public get initialized(): boolean {
    return this._initialized
  }
  private adbService: ADBServiceClass

  constructor() {
    super()
    this.adbService = new ADBService()
  }

  private addToCache(manifest: PluginManifest): void {
    const existingIndex = this.pluginCache.findIndex((m) => m.id === manifest.id)
    if (existingIndex !== -1) {
      this.pluginCache[existingIndex] = manifest
    } else {
      this.pluginCache.push(manifest)
    }
  }

  /**
   * @implements CacheableStore
   */
  clearCache = async (): Promise<void> => {
    this.pluginCache = []
  }
  /**
   * @implements CacheableStore
   */
  saveToFile = async (): Promise<void> => {
    // save the directory to file
    const pluginDirectory: PluginReference[] = Object.values(this.pluginDirectory)
    await savePluginReferences(pluginDirectory)
  }

  async findPluginsInPath(pluginPath: string): Promise<void> {
    const pluginManifests = await findPluginsInDirectory(pluginPath)
    for (const manifest of pluginManifests) {
      this.addToCache(manifest)
    }
  }

  async findAppPlugins(appId: string): Promise<void> {
    // get the plugins folder
    const pluginsPath = join('apps', appId, 'plugins')

    // check if it exists
    try {
      await fs.access(pluginsPath)
    } catch {
      // doesn't exist, nothing to do
      return
    }

    const pluginManifests = await findPluginsInDirectory(pluginsPath)
    for (const manifest of pluginManifests) {
      this.addToCache(manifest)
    }
  }

  async getPluginByApplication(application: PluginApplications): Promise<PluginManifest[]> {
    const matches: PluginManifest[] = []

    for (const [id, ref] of Object.entries(this.pluginDirectory)) {
      const apps = ref.types || undefined
      // If the plugin has no types or the wanted type, skip it
      if (!apps || !apps.includes(application)) continue

      // if the plugin is in cache, use it
      const cached = this.pluginCache.find((m) => m.id === id)
      if (cached) {
        matches.push(cached)
      } else {
        // else, fetch it from disk
        try {
          const manifest = await getPluginManifestFromPath(ref.location)
          if (manifest) {
            this.addToCache(manifest)
            matches.push(manifest)
          }
        } catch (err) {
          const { warn } = logger.createLogger({
            method: 'getPluginByApplication',
            store: 'PluginStore'
          })
          warn(`Failed to load plugin ${id} from ${ref.location}: ${String(err)}`)
        }
      }
    }

    return matches
  }

  async getPluginById(id: string): Promise<PluginManifest | undefined> {
    // check cache first
    const cached = this.pluginCache.find((m) => m.id === id)
    if (cached) return cached

    // fall back to directory entry
    const ref = this.pluginDirectory[id]
    if (!ref) return undefined

    try {
      const manifest = await getPluginManifestFromPath(ref.location)
      if (manifest) this.addToCache(manifest)
      return manifest
    } catch (err) {
      const { warn } = logger.createLogger({ method: 'getPluginById', store: 'PluginStore' })
      warn(`Failed to load plugin ${id} from ${ref.location}: ${String(err)}`)
      return undefined
    }
  }

  async installAdbPlugin(id: string, options: { adbId: string; clientId: string }): Promise<void> {
    const { debug, warn } = logger.createLogger({
      method: 'uninstallAdbPlugin',
      store: 'PluginStore'
    })
    const pluginManifest = await this.getPluginById(id)
    if (!pluginManifest) {
      warn(`Plugin with id ${id} not found`)
      return
    }
    debug(`Installing ADB Plugin ${id} on device ${options.adbId}`)
    await runADBPlugin(this.adbService, pluginManifest, options)
    debug(`Installed ADB Plugin ${id} on device ${options.adbId}`)
  }

  async uninstallAdbPlugin(
    id: string,
    options: { adbId: string; clientId: string }
  ): Promise<void> {
    const { debug, warn } = logger.createLogger({
      method: 'uninstallAdbPlugin',
      store: 'PluginStore'
    })
    const pluginManifest = await this.getPluginById(id)
    if (!pluginManifest) {
      warn(`Plugin with id ${id} not found`)
      return
    }

    debug(`Uninstalling ADB Plugin ${id} from device ${options.adbId}`)
    await removeADBPlugin(this.adbService, pluginManifest, options)
    debug(`Uninstalled ADB Plugin ${id} from device ${options.adbId}`)
  }

  async initialize(): Promise<void> {
    if (this._initialized) return
    this._initialized = true
  }
}
