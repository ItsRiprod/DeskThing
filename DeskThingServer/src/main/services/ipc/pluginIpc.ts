import {
  PluginIPCData,
  PluginHandlerReturnMap,
  IPC_PLUGIN_TYPES,
  PluginPayload
} from '@shared/types'
import Logger from '@server/utils/logger'
import { storeProvider } from '@server/stores/storeProvider'
import { PluginApplications } from '@deskthing/types'

export const pluginHandler = async (
  data: PluginIPCData
): Promise<PluginHandlerReturnMap[(typeof data)['type']]> => {
  const pluginStore = await storeProvider.getStore('pluginStore')

  const { debug } = Logger.createLogger({
    method: 'pluginHandler',
    store: 'plugin'
  })

  debug('Received plugin IPC data:', data)

  switch (data.type) {
    case IPC_PLUGIN_TYPES.RUN: {
      //
      switch (data.payload.pluginType) {
        case PluginApplications.ADB: {
          await pluginStore.installAdbPlugin(
            data.payload.pluginId,
            data.payload.data as PluginPayload<PluginApplications.ADB>
          )
        }
      }
      break
    }
    case IPC_PLUGIN_TYPES.UNINSTALL: {
      switch (data.payload.pluginType) {
        case PluginApplications.ADB: {
          await pluginStore.uninstallAdbPlugin(
            data.payload.pluginId,
            data.payload.data as PluginPayload<PluginApplications.ADB>
          )
        }
      }
      break
    }
    case IPC_PLUGIN_TYPES.GET: {
      const plugins = await pluginStore.getPluginByApplication(data.payload.application)
      return plugins
    }
    default:
      break
  }
}
