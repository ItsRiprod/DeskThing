import { PlatformIPC } from '@shared/types/ipc/ipcPlatform'
import Logger from '@server/utils/logger'
import { storeProvider } from '@server/stores/storeProvider'
import { PlatformStoreClass } from '@shared/stores/platformStore'
import { progressBus } from '../events/progressBus'
import { ProgressChannel } from '@shared/types'

export const platformHandler = async <T extends PlatformIPC>(data: T): Promise<T['data']> => {
  const platformStore = (await storeProvider.getStore('platformStore')) as PlatformStoreClass

  progressBus.startOperation(
    ProgressChannel.IPC_PLATFORM,
    `Running ${data.type}`,
    'Initializing request',
    [
      {
        channel: ProgressChannel.PLATFORM_CHANNEL,
        weight: 100
      }
    ]
  )

  try {
    Logger.debug(`Handling platform event for ${data.platform}`, {
      domain: 'platform',
      source: 'platformHandler'
    })

    const returnData = await platformStore.sendPlatformData(data)
    progressBus.complete(
      ProgressChannel.IPC_PLATFORM,
      `Finished ${data.type}`,
      'Process operation complete'
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
