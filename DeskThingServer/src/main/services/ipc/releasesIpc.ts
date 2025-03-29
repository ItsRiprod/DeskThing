import { ReleaseIPCData, ReleaseHandlerReturnMap, IPC_RELEASE_TYPES } from '@shared/types'
import Logger from '@server/utils/logger'
import { storeProvider } from '@server/stores/storeProvider'

export const releaseHandler = async (
  data: ReleaseIPCData
): Promise<ReleaseHandlerReturnMap[(typeof data)['type']]> => {
  const releaseStore = await storeProvider.getStore('releaseStore')

  switch (data.type) {
    case IPC_RELEASE_TYPES.GITHUB_REFRESH_APP:
      try {
        await releaseStore.addAppRepository(data.payload)
        return
      } catch (error) {
        Logger.error('Unable to refresh repository!', {
          error: error as Error,
          function: 'github.refreshApp',
          source: 'releaseHandler'
        })
        return
      }
    case IPC_RELEASE_TYPES.GITHUB_REFRESH_APPS:
      try {
        await releaseStore.refreshData(true)
        return
      } catch (error) {
        Logger.error('Unable to refresh repositories!', {
          error: error as Error,
          function: 'github.refreshApps',
          source: 'releaseHandler'
        })
        return
      }
    case IPC_RELEASE_TYPES.GITHUB_GET_APPS:
      try {
        return await releaseStore.getAppReleases()
      } catch (error) {
        Logger.error('Unable to get repositories!', {
          error: error as Error,
          function: 'github.getApps',
          source: 'releaseHandler'
        })
        return
      }
    case IPC_RELEASE_TYPES.GITHUB_GET_APP_REFERENCES:
      try {
        return await releaseStore.getAppReferences()
      } catch (error) {
        Logger.error('Unable to get app references!', {
          error: error as Error,
          function: 'github.getAppReferences',
          source: 'releaseHandler'
        })
        return
      }
    case IPC_RELEASE_TYPES.GITHUB_ADD_APP_REPO:
      try {
        return await releaseStore.addAppRepository(data.payload)
      } catch (error) {
        Logger.error('Unable to add repository!', {
          error: error as Error,
          function: 'github.addAppRepo',
          source: 'releaseHandler'
        })
        return
      }
    case IPC_RELEASE_TYPES.GITHUB_REMOVE_APP_REPO:
      try {
        return await releaseStore.removeAppRelease(data.payload)
      } catch (error) {
        Logger.error('Unable to remove repository!', {
          error: error as Error,
          function: 'github.removeAppRepo',
          source: 'releaseHandler'
        })
        return
      }
    case IPC_RELEASE_TYPES.GITHUB_GET_CLIENTS:
      try {
        return releaseStore.getClientReleases()
      } catch (error) {
        Logger.error('Unable to get client releases!', {
          error: error as Error,
          function: 'github.getClients',
          source: 'releaseHandler'
        })
        return
      }
  }
}
