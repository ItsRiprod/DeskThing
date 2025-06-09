import {
  ReleaseIPCData,
  ReleaseHandlerReturnMap,
  IPC_RELEASE_TYPES,
  ProgressChannel
} from '@shared/types'
import Logger from '@server/utils/logger'
import { storeProvider } from '@server/stores/storeProvider'
import { progressBus } from '../events/progressBus'
import { handleError } from '@server/utils/errorHandler'

export const releaseHandler = async (
  data: ReleaseIPCData
): Promise<ReleaseHandlerReturnMap[(typeof data)['type']]> => {
  const releaseStore = await storeProvider.getStore('releaseStore')

  switch (data.type) {
    case IPC_RELEASE_TYPES.REFRESH_RELEASES:
      try {
        progressBus.startOperation(
          ProgressChannel.IPC_RELEASES,
          'Refreshing Releases',
          'initializing',
          [
            {
              channel: ProgressChannel.REFRESH_RELEASES,
              weight: 100
            }
          ]
        )
        await releaseStore.refreshData(data.options?.force)
        progressBus.complete(ProgressChannel.IPC_RELEASES, 'Refreshing Releases', 'complete')
        return
      } catch (error) {
        Logger.error(`Unable to refresh repositories! ${handleError(error)}`, {
          error: error as Error,
          function: 'releases.refresh',
          source: 'releaseHandler'
        })
        return
      }
    case IPC_RELEASE_TYPES.GET_APPS:
      try {
        return await releaseStore.getAppReleases()
      } catch (error) {
        Logger.error(`Unable to get repositories! ${handleError(error)}`, {
          error: error as Error,
          function: 'releases.getApps',
          source: 'releaseHandler'
        })
        return
      }
    case IPC_RELEASE_TYPES.GET_APP_REPOSITORIES:
      try {
        return await releaseStore.getCommunityApps()
      } catch (error) {
        Logger.error(`Unable to get app references! ${handleError(error)}`, {
          error: error as Error,
          function: 'releases.getAppRepositories',
          source: 'releaseHandler'
        })
        return
      }
    case IPC_RELEASE_TYPES.ADD_APP_REPOSITORY:
      try {
        return await releaseStore.addAppRepository(data.payload)
      } catch (error) {
        Logger.error(`Unable to add repository! ${handleError(error)}`, {
          error: error as Error,
          function: 'releases.addAppRepo',
          source: 'releaseHandler'
        })
        return
      }
    case IPC_RELEASE_TYPES.REMOVE_APP_REPOSITORY:
      try {
        return await releaseStore.removeAppRelease(data.payload)
      } catch (error) {
        Logger.error(`Unable to remove repository! ${handleError(error)}`, {
          error: error as Error,
          function: 'releases.removeAppRepo',
          source: 'releaseHandler'
        })
        return
      }
    case IPC_RELEASE_TYPES.DOWNLOAD_APP:
      try {
        return await releaseStore.downloadLatestApp(data.payload)
      } catch (error) {
        Logger.error(`Unable to download app! ${handleError(error)}`, {
          error: error as Error,
          function: 'releases.downloadApp',
          source: 'releaseHandler'
        })
        return
      }
    case IPC_RELEASE_TYPES.GET_CLIENTS:
      try {
        return await releaseStore.getClientReleases()
      } catch (error) {
        Logger.error(`Unable to get client releases! ${handleError(error)}`, {
          error: error as Error,
          function: 'releases.getClients',
          source: 'releaseHandler'
        })
        return
      }
    case IPC_RELEASE_TYPES.GET_CLIENT_REPOSITORIES:
      try {
        return await releaseStore.getCommunityClients()
      } catch (error) {
        Logger.error(`Unable to get client repositories! ${handleError(error)}`, {
          error: error as Error,
          function: 'releases.getClientRepositories',
          source: 'releaseHandler'
        })
        return
      }
    case IPC_RELEASE_TYPES.ADD_CLIENT_REPOSITORY:
      try {
        return await releaseStore.addClientRepository(data.payload)
      } catch (error) {
        Logger.error(`Unable to add client repository! ${handleError(error)}`, {
          error: error as Error,
          function: 'releases.addClientRepo',
          source: 'releaseHandler'
        })
        return
      }
    case IPC_RELEASE_TYPES.REMOVE_CLIENT_REPOSITORY:
      try {
        return await releaseStore.removeClientRelease(data.payload)
      } catch (error) {
        Logger.error(`Unable to remove client repository! ${handleError(error)}`, {
          error: error as Error,
          function: 'releases.removeClientRepo',
          source: 'releaseHandler'
        })
        return
      }
    case IPC_RELEASE_TYPES.DOWNLOAD_CLIENT:
      try {
        return await releaseStore.downloadLatestClient(data.payload)
      } catch (error) {
        Logger.error(`Unable to download client! ${handleError(error)}`, {
          error: error as Error,
          function: 'releases.downloadClient',
          source: 'releaseHandler'
        })
        return
      }
  }
}