import { PlatformIPC } from '@shared/types/ipc/ipcPlatform'
import Logger from '@server/utils/logger'
import { storeProvider } from '@server/stores/storeProvider'
import { progressBus } from '../events/progressBus'
import { ProgressChannel } from '@shared/types'
import { PlatformIDs } from '@deskthing/types'

export const platformHandler = async <T extends PlatformIPC>(data: T): Promise<T['data']> => {
  const platformStore = await storeProvider.getStore('platformStore')

  progressBus.startOperation(
    ProgressChannel.IPC_PLATFORM,
    `Running ${data.type}`,
    `Initializing ${data.request || data.type}`,
    [
      {
        channel: ProgressChannel.PLATFORM_CHANNEL,
        weight: 100
      }
    ]
  )

  try {
    Logger.debug(`Handling platform event for ${data.platform} with data ${JSON.stringify(data)}`, {
      domain: 'platform',
      source: 'platformHandler'
    })

    let returnData: T['data']

    if (data.platform === PlatformIDs.MAIN) {
      switch (data.type) {
        case 'refresh-clients':
          await platformStore.refreshClients()
          returnData = await platformStore.fetchClients()
          break
        case 'initial-data':
          await platformStore.sendInitialDataToClient(data.request)
          returnData = undefined
          break
      }
    } else {
      returnData = await platformStore.sendPlatformData(data)
    }

    progressBus.complete(
      ProgressChannel.IPC_PLATFORM,
      `Completed the operation`,
      `Finished ${data.type}`
    )
    return returnData
  } catch (error) {
    progressBus.error(
      ProgressChannel.IPC_PLATFORM,
      `Error handling ${data.type}`,
      'Error handling request',
      'Platform Error'
    )

    Logger.error(`Error handling platform event for ${data.platform}`, {
      error: error as Error,
      domain: 'platform',
      source: 'platformHandler'
    })
    return
  }
}
