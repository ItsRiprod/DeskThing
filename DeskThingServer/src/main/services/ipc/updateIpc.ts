import { UpdateIPCData, UpdateHandlerReturnMap, IPC_UPDATE_TYPES } from '@shared/types'
import Logger from '@server/utils/logger'
import { storeProvider } from '@server/stores/storeProvider'

export const updateHandler = async (
  data: UpdateIPCData
): Promise<UpdateHandlerReturnMap[(typeof data)['type']]> => {
  Logger.debug(`Handling update data with type: ${data.type}`, {
    source: 'updateHandler',
    function: 'update'
  })

  const updateStore = await storeProvider.getStore('updateStore')

  switch (data.type) {
    case IPC_UPDATE_TYPES.CHECK:
      return await updateStore.checkForUpdates()
    case IPC_UPDATE_TYPES.DOWNLOAD:
      return updateStore.startDownload()
    case IPC_UPDATE_TYPES.RESTART:
      return updateStore.quitAndInstall()
  }
}
