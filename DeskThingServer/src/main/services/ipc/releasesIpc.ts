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
              channel: ProgressChannel.ST_RELEASE_REFRESH,
              weight: 100
            }
          ]
        )
        await releaseStore.refreshData(data.options?.force)
        progressBus.complete(ProgressChannel.IPC_RELEASES, 'Refresh Complete', 'Complete')
        return
      } catch (error) {
        progressBus.error(
          ProgressChannel.IPC_RELEASES,
          `Unable to refresh repositories! ${handleError(error)}`
        )
        return
      }
    case IPC_RELEASE_TYPES.ADD_REPOSITORY:
      progressBus.startOperation(
        ProgressChannel.IPC_RELEASES,
        'Adding Repository',
        'Initializing',
        [
          {
            channel: ProgressChannel.ST_RELEASE_ADD_REPO,
            weight: 100
          }
        ]
      )
      try {
        const result = await releaseStore.addRepositoryUrl(data.payload)
        progressBus.complete(ProgressChannel.IPC_RELEASES, 'Refreshing Releases', 'complete')
        return result
      } catch (error) {
        progressBus.error(
          ProgressChannel.IPC_RELEASES,
          `Unable to add ${data.payload} repository! ${handleError(error)}`
        )
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
    case IPC_RELEASE_TYPES.REMOVE_APP_REPOSITORY:
      try {
        progressBus.startOperation(
          ProgressChannel.IPC_RELEASES,
          'Removing App Repository',
          'Initializing',
          [
            {
              channel: ProgressChannel.ST_RELEASE_APP_REMOVE,
              weight: 100
            }
          ]
        )
        const removed = await releaseStore.removeAppRelease(data.payload)
        progressBus.complete(
          ProgressChannel.IPC_RELEASES,
          `Successfully removed ${removed} apps`,
          'Operation Success'
        )
        return removed
      } catch (error) {
        progressBus.error(
          ProgressChannel.IPC_RELEASES,
          `Unable to remove repository! ${handleError(error)}`,
          'Error Removing Repository'
        )
        return
      }
    case IPC_RELEASE_TYPES.DOWNLOAD_APP:
      try {
        progressBus.startOperation(
          ProgressChannel.IPC_RELEASES,
          'Downloading App',
          'Initializing',
          [
            {
              channel: ProgressChannel.ST_RELEASE_APP_DOWNLOAD,
              weight: 100
            }
          ]
        )
        const stagedApp = await releaseStore.downloadLatestApp(data.payload)
        progressBus.complete(
          ProgressChannel.IPC_RELEASES,
          `Successfully downloaded app`,
          'Operation Success'
        )
        return stagedApp
      } catch (error) {
        progressBus.error(
          ProgressChannel.IPC_RELEASES,
          `Unable to download app! ${handleError(error)}`,
          'Error Downloading App'
        )
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
        progressBus.startOperation(
          ProgressChannel.ST_RELEASE_CLIENT_REFRESH,
          'Getting Client Repositories',
          'Initializing',
          [
            {
              channel: ProgressChannel.ST_RELEASE_CLIENT_REFRESH,
              weight: 100
            }
          ]
        )
        const clients = await releaseStore.getCommunityClients()
        progressBus.complete(
          ProgressChannel.IPC_RELEASES,
          `Successfully got ${clients && clients.length} clients`,
          'Operation Success'
        )
        return clients
      } catch (error) {
        progressBus.error(
          ProgressChannel.IPC_RELEASES,
          `Unable to get client repositories! ${handleError(error)}`,
          'Error Getting Clients'
        )
        return
      }
    case IPC_RELEASE_TYPES.REMOVE_CLIENT_REPOSITORY:
      try {
        progressBus.startOperation(
          ProgressChannel.IPC_RELEASES,
          'Removing Client Repository',
          'Initializing',
          [
            {
              channel: ProgressChannel.ST_RELEASE_CLIENT_REMOVE,
              weight: 100
            }
          ]
        )
        const removed = await releaseStore.removeClientRelease(data.payload)
        progressBus.complete(
          ProgressChannel.IPC_RELEASES,
          `Successfully removed ${removed} clients`,
          'Operation Success'
        )
        return removed
      } catch (error) {
        progressBus.error(
          ProgressChannel.IPC_RELEASES,
          `Unable to remove client repository! ${handleError(error)}`,
          'Error Removing Client'
        )
        return
      }
    case IPC_RELEASE_TYPES.DOWNLOAD_CLIENT:
      try {
        progressBus.startOperation(
          ProgressChannel.IPC_RELEASES,
          'Downloading Client',
          'Initializing',
          [
            {
              channel: ProgressChannel.ST_CLIENT_DOWNLOAD,
              weight: 100
            }
          ]
        )
        const client = await releaseStore.downloadLatestClient(data.payload)
        progressBus.complete(
          ProgressChannel.IPC_RELEASES,
          `Successfully downloaded client`,
          'Operation Success'
        )
        return client
      } catch (error) {
        progressBus.error(
          ProgressChannel.IPC_RELEASES,
          `Unable to download client! ${handleError(error)}`,
          'Error Downloading Client'
        )
        return
      }
  }
}
