import { PluginApplications } from '@deskthing/types'
import { IPC_HANDLERS, PluginPayload } from '@shared/types'
import { IPC_PLUGIN_TYPES, PluginHandlerReturnMap, PluginIPCData } from '@shared/types'
import { ipcRenderer } from 'electron'

export const plugins = {
  installPlugin: async (
    pluginId: string,
    pluginType: PluginApplications,
    data: PluginPayload<PluginApplications>
  ): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.PLUGIN,
      type: IPC_PLUGIN_TYPES.RUN,
      payload: { pluginId, pluginType, data }
    }),
  uninstallPlugin: async (
    pluginId: string,
    pluginType: PluginApplications,
    data: PluginPayload<PluginApplications>
  ): Promise<void> =>
    await sendCommand({
      kind: IPC_HANDLERS.PLUGIN,
      type: IPC_PLUGIN_TYPES.UNINSTALL,
      payload: { pluginId, pluginType, data }
    }),

  getPluginsByApplication: async (
    application: PluginApplications
  ): Promise<PluginHandlerReturnMap[IPC_PLUGIN_TYPES.GET]> =>
    await sendCommand({
      kind: IPC_HANDLERS.PLUGIN,
      type: IPC_PLUGIN_TYPES.GET,
      payload: { application }
    })
}

const sendCommand = <T extends IPC_PLUGIN_TYPES>(
  data: Extract<PluginIPCData, { type: T }>
): Promise<PluginHandlerReturnMap[T]> => {
  const requestPayload = { ...data, kind: IPC_HANDLERS.PLUGIN }
  return ipcRenderer.invoke(IPC_HANDLERS.PLUGIN, requestPayload)
}
