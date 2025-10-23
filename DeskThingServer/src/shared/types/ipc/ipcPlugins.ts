import { PluginApplications, PluginManifest } from '@deskthing/types'
import { IPC_HANDLERS } from './ipcTypes'

export enum IPC_PLUGIN_TYPES {
  RUN = 'run',
  REGISTER = 'register',
  UNREGISTER = 'unregister',
  UNINSTALL = 'uninstall',
  GET = 'get'
}

export type PluginPayload<T extends PluginApplications> = T extends PluginApplications.ADB
  ? { adbId: string; clientId: string }
  : T extends PluginApplications.SERVER
    ? { pluginPath: string }
    : T extends PluginApplications.CLIENT
      ? { pluginId: string }
      : T extends PluginApplications.BLUETOOTH
        ? { pluginId: string }
        : never

export type PluginIPCData<T extends PluginApplications = PluginApplications> = {
  kind: IPC_HANDLERS.PLUGIN
} & (
  | {
      type: IPC_PLUGIN_TYPES.RUN
      payload: { pluginId: string; pluginType: T; data: PluginPayload<T> }
    }
  | {
      type: IPC_PLUGIN_TYPES.REGISTER
      payload: { source: string; taskId: string }
    }
  | {
      type: IPC_PLUGIN_TYPES.UNREGISTER
      payload: { source: string; taskId: string }
    }
  | {
      type: IPC_PLUGIN_TYPES.UNINSTALL
      payload: { pluginId: string; pluginType: T; data: PluginPayload<T> }
    }
  | {
      type: IPC_PLUGIN_TYPES.GET
      payload: { application: PluginApplications }
    }
)

export type PluginHandlerReturnMap = {
  [IPC_PLUGIN_TYPES.RUN]: void
  [IPC_PLUGIN_TYPES.REGISTER]: void
  [IPC_PLUGIN_TYPES.UNREGISTER]: void
  [IPC_PLUGIN_TYPES.UNINSTALL]: void
  [IPC_PLUGIN_TYPES.GET]: PluginManifest[]
}
