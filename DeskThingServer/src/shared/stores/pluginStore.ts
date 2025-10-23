import { PluginApplications, PluginManifest } from '@deskthing/types'
import { StoreInterface } from '@shared/interfaces/storeInterface'
import { PluginPayload } from '@shared/types'
import { EventEmitter } from 'node:events'

export type PluginStoreEvents = {
  'plugin:install': [{ id: string }]
  'plugin:uninstall': [{ id: string }]
}

export type PluginReference = {
  version: string
  location: string
  id: string
  types: PluginApplications[]
}

export interface PluginStoreClass extends StoreInterface, EventEmitter<PluginStoreEvents> {
  findPluginsInPath(pluginPath: string): Promise<void>

  findAppPlugins(appId: string): Promise<void>

  getPluginByApplication(application: PluginApplications): Promise<PluginManifest[]>

  getPluginById(id: string): Promise<PluginManifest | undefined>

  installAdbPlugin(id: string, options: PluginPayload<PluginApplications.ADB>): Promise<void>

  uninstallAdbPlugin(id: string, options: PluginPayload<PluginApplications.ADB>): Promise<void>
}
