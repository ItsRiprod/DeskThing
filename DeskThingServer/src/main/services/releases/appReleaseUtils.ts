/**
 *
 *
 *  All of this has been deemed outdated and unusuable due to it being an initial proof of concept
 * Unfortunately, the scope continued to grow and this became obsolete almost the moment it worked
 * Refer to migrationUtils, releaseUtils, and releaseValidation instead as those work with both Clients and Apps and are more universal
 *
 * Additionaly, the seperation of migration logic and functional logic has been improved so there is less cross-domain errors
 *
 *
 *
 */

import { AppLatestJSONLatest, AppReleaseMeta, MultiReleaseJSONLatest } from '@deskthing/types'
import {
  AppLatestServer,
  AppReleaseFile,
  AppReleaseFile0118,
  GithubAsset,
  GithubRelease,
  GitRepoUrl,
  ProgressChannel,
  RefreshOptions
} from '@shared/types'
import { determineValidUpdateUrl, determineValidUrl, sanitizeLatestJSON } from './releaseValidation'
import logger from '@server/utils/logger'
import { handleError } from '@server/utils/errorHandler'
import { satisfies } from 'semver'
import { progressBus } from '../events/progressBus'
import { storeProvider } from '@server/stores/storeProvider'

export const createAppReleaseFile = async (force: boolean = false): Promise<AppReleaseFile0118> => {
  const { appsRepo, defaultAppLatestJSONFallback: defaultLatestJSONFallback } = await import(
    '@server/static/releaseMetadata'
  )
  try {
    progressBus.startOperation(
      ProgressChannel.FN_RELEASE_APP_REFRESH,
      'Refreshing App Releases',
      'Initializing Refresh',
      [
        {
          channel: ProgressChannel.FN_RELEASE_APP_STATS,
          weight: 10
        }
      ]
    )
    const githubStore = await storeProvider.getStore('githubStore')

    logger.debug(`Fetching latest release from ${appsRepo}`)
    const latestReleaseAssets = await githubStore.getLatestRelease(appsRepo)

    if (!latestReleaseAssets) {
      throw new Error('Unable to find latest release assets')
    }

    const latestReleaseJsonAsset = latestReleaseAssets.assets.find(
      (asset) => asset.name == 'latest.json'
    )

    if (!latestReleaseJsonAsset) {
      throw new Error('Unable to find latest.json asset in releases')
    }

    logger.debug(`Fetching latest.json from ${latestReleaseJsonAsset?.browser_download_url}`)
    const latestJSON = await githubStore.fetchJSONAssetContent<
      AppReleaseMeta | AppLatestJSONLatest | MultiReleaseJSONLatest
    >(latestReleaseJsonAsset)

    if (!latestJSON) {
      throw new Error('Unable to fetch latest.json. (error downloading)')
    }

    // Check that latestJSON is valid
    const sanitizedJson = await migrateReleaseMetaToJSON(latestJSON)

    if (sanitizedJson.meta_type == 'app') {
      const latestServer: AppLatestServer = {
        id: sanitizedJson.appManifest.id,
        mainRelease: sanitizedJson,
        lastUpdated: Date.now(),
        totalDownloads: 0,
        pastReleases: []
      }

      const latestJson = await getUpdatedStats(latestServer, force)

      // Temporary quick fix
      const finalAppReleaseFile: AppReleaseFile0118 = {
        version: '0.11.8',
        repositories: [sanitizedJson.repository],
        releases: [latestJson],
        timestamp: Date.now()
      }

      progressBus.complete(
        ProgressChannel.FN_RELEASE_CLIENT_STATS,
        `Got ${finalAppReleaseFile.releases.length} releases from file and updated them all`
      )

      logger.debug(
        `Successfully got ${finalAppReleaseFile.releases.length} releases from file and updated them all`
      )

      return finalAppReleaseFile
    }

    if (sanitizedJson.meta_type != 'multi') {
      throw new Error('latest.json is not a multi release')
    }

    const finalAppReleaseFile: AppReleaseFile0118 = {
      version: '0.11.8',
      repositories: sanitizedJson.repositories || [],
      releases: [],
      timestamp: Date.now()
    }

    progressBus.start(
      ProgressChannel.FN_RELEASE_APP_STATS,
      'Getting Stats',
      `Getting Stats for the apps`
    )

    // Handle getting all of the field IDs
    if (sanitizedJson.fileIds && sanitizedJson.fileIds.length > 0) {
      const percentPerApp = 100 / sanitizedJson.fileIds.length
      const releases = await Promise.all(
        sanitizedJson.fileIds.map(async (fileId) => {
          try {
            const fileAsset = latestReleaseAssets.assets.find((asset) =>
              asset.name.includes(fileId)
            )
            if (!fileAsset) {
              throw new Error(`Unable to find file asset with id ${fileId}`)
            }

            logger.debug(`Fetching file from ${fileAsset?.browser_download_url}`)
            const fileContent =
              await githubStore.fetchJSONAssetContent<AppLatestJSONLatest>(fileAsset)
            if (!fileContent) {
              throw new Error(
                `Unable to fetch file content from ${fileAsset?.browser_download_url}`
              )
            }

            const latestServer: AppLatestServer = {
              id: fileId,
              mainRelease: fileContent,
              lastUpdated: Date.now(),
              totalDownloads: 0,
              pastReleases: []
            }

            const updatedLatestServer = await getUpdatedStats(latestServer, force, percentPerApp)

            return updatedLatestServer
          } catch (error) {
            logger.warn(`Error fetching file ${fileId}: ${handleError(error)}`)
            return null
          }
        })
      )

      finalAppReleaseFile.releases = releases.filter((file) => file !== null)
    }

    progressBus.complete(
      ProgressChannel.FN_RELEASE_APP_STATS,
      `Got ${finalAppReleaseFile.releases.length} releases from file and updated them all`
    )

    logger.debug(
      `Successfully got ${finalAppReleaseFile.releases.length} releases from file and updated them all`
    )

    return finalAppReleaseFile
  } catch (error) {
    logger.error(
      `Encountered an unknown error initializing the release data: ${handleError(error)}`,
      {
        error: error as Error,
        function: 'createAppReleaseFile',
        domain: 'appReleaseUtils'
      }
    )
    return defaultLatestJSONFallback
  }
}

/**
 * Refreshes the app release data by migrating the file and optionally updating app release statistics.
 * @param prevAppReleaseFile The previous app release file to be refreshed
 * @param options Configuration options for the refresh operation
 * @param options.force Optional flag to force refresh of stats
 * @param options.updateStates Optional flag to enable/disable stats update (default true)
 * @returns A migrated and potentially updated AppReleaseFile
 */
export const handleRefreshAppReleaseFile = async (
  prevAppReleaseFile: AppReleaseFile,
  { force = false, updateStates = true }: RefreshOptions
): Promise<AppReleaseFile0118> => {
  try {
    progressBus.startOperation(
      ProgressChannel.FN_RELEASE_APP_REFRESH,
      'Refreshing App Releases',
      'Initializing Refresh',
      [
        {
          channel: ProgressChannel.FN_RELEASE_APP_STATS,
          weight: 10
        }
      ]
    )

    // Step 1: Handle the migration of the FILE
    const migratedAppReleaseFile = await handleMigration(prevAppReleaseFile)

    // Step 2: Update all of the apps
    progressBus.start(ProgressChannel.FN_RELEASE_APP_STATS, 'Getting Stats', 'Getting Stats')

    if (updateStates) {
      const percentPerApp = 100 / migratedAppReleaseFile.releases.length

      const updatedReleases = await Promise.all(
        migratedAppReleaseFile.releases.map(async (release) => {
          return await getUpdatedStats(release, force, percentPerApp)
        })
      )
      progressBus.complete(
        ProgressChannel.FN_RELEASE_APP_STATS,
        `Successfully got ${updatedReleases.length} releases`,
        'Completed Stat Retrieval'
      )
      migratedAppReleaseFile.releases = updatedReleases
    } else {
      progressBus.complete(
        ProgressChannel.FN_RELEASE_APP_STATS,
        `Stat Refresh was disabled`,
        'Completed Task'
      )
    }

    return migratedAppReleaseFile
  } catch (error) {
    progressBus.error(
      ProgressChannel.FN_RELEASE_APP_REFRESH,
      'Failed to refresh app releases',
      `Cause: ${handleError(error)}`
    )
    throw error
  }
}

/**
 * Handles the migration of any AppReleaseFile to AppReleaseFile0118
 */
const handleMigration = async (appReleases: AppReleaseFile): Promise<AppReleaseFile0118> => {
  progressBus.start(
    ProgressChannel.FN_RELEASE_APP_MIGRATE,
    'Migrating AppReleases',
    'Starting Migration'
  )
  if (appReleases.version == '0.11.8') {
    progressBus.complete(ProgressChannel.FN_RELEASE_APP_MIGRATE, 'Version up to date')
    return appReleases
  }

  // Setup the framework of what is being added
  const newAppReleases: AppReleaseFile0118 = {
    version: '0.11.8',
    repositories: [],
    releases: [],
    timestamp: Date.now()
  }

  // The version is older than current latest
  if (satisfies(appReleases.version, `<0.11.8`)) {
    progressBus.update(ProgressChannel.FN_RELEASE_APP_MIGRATE, 'Updating to v0.11.8', 15)
    const incAmount = 70 / appReleases.releases.length
    await Promise.all(
      appReleases.releases.map(async (release) => {
        // Migrate the releases to a (hopefully) usable state
        try {
          progressBus.update(
            ProgressChannel.FN_RELEASE_APP_MIGRATE,
            `Migrating ${release.id} to v0.11.8`
          )
          const updatedRelease = await migrateReleaseMetaToJSON(release)

          if (updatedRelease.meta_type == 'app') {
            const latestAppServer: AppLatestServer = {
              id: updatedRelease.appManifest.id,
              mainRelease: updatedRelease,
              lastUpdated: Date.now(),
              totalDownloads: 0,
              pastReleases: []
            }
            newAppReleases.releases.push(latestAppServer)
          } else if (updatedRelease.meta_type == 'multi') {
            if (updatedRelease.repositories && updatedRelease.repositories.length > 0) {
              newAppReleases.repositories = [
                ...new Set([...newAppReleases.repositories, ...(updatedRelease.repositories || [])])
              ]
            }
            if (updatedRelease.fileIds && updatedRelease.fileIds.length > 0) {
              newAppReleases.repositories = [
                ...new Set([...newAppReleases.repositories, ...(updatedRelease.fileIds || [])])
              ]
            }
          } else if (updatedRelease.meta_type == 'translation') {
            const existingIds = newAppReleases.releases.map((release) => release.id)
            const uniqueApps = updatedRelease.releases.filter(
              (release) => !existingIds.includes(release.appManifest.id)
            )
            const latestAppServers = uniqueApps.map((uniqueApp) => ({
              id: uniqueApp.appManifest.id,
              mainRelease: uniqueApp,
              currentVersion: uniqueApp.appManifest.version,
              lastUpdated: Date.now(),
              totalDownloads: 0,
              pastReleases: []
            }))
            if (latestAppServers.length > 0) {
              newAppReleases.releases.push(...latestAppServers)
            }
          }
          progressBus.incrementProgress(
            ProgressChannel.FN_RELEASE_APP_MIGRATE,
            `Migrated ${release.id}`,
            incAmount
          )
        } catch (error) {
          progressBus.incrementProgress(
            ProgressChannel.FN_RELEASE_APP_MIGRATE,
            `Failed ${release.id}`,
            incAmount
          )
          progressBus.warn(
            ProgressChannel.FN_RELEASE_APP_MIGRATE,
            `Failed ${release.id}`,
            handleError(error)
          )
          logger.error(`Error migrating ${release.id} to latest version: ${handleError(error)}`, {
            function: 'handleMigration',
            source: 'appReleaseUtils',
            error: error as Error
          })
        }
      })
    )
  } else if (satisfies(appReleases.version, `>0.11.8`)) {
    logger.error(
      `Unable to migrate ${appReleases.version} to v0.11.8 because it is of an unknown version. Try updating the server.`,
      {
        function: 'handleMigration',
        source: 'appReleaseUtils'
      }
    )
  } else {
    logger.error('Server must be outdated or the version is not correct.', {
      function: 'handleMigration',
      source: 'appReleaseUtils'
    })
  }
  // ends at 85%

  progressBus.complete(
    ProgressChannel.FN_RELEASE_APP_MIGRATE,
    `Finished migration of ${newAppReleases?.releases?.length} apps`
  )

  return newAppReleases
}

type MultiTranslationJSON = {
  meta_type: 'translation'
  releases: AppLatestJSONLatest[]
}

/**
 * Handles the migration of a release's metadata to the latest version.
 */
const migrateReleaseMetaToJSON = async (
  appReleaseMeta: AppReleaseMeta | AppLatestJSONLatest | MultiReleaseJSONLatest
): Promise<AppLatestJSONLatest | MultiReleaseJSONLatest | MultiTranslationJSON> => {
  // Check if it just needs to be validated to update to v0.11.8

  if ('meta_version' in appReleaseMeta) {
    if (appReleaseMeta.meta_version == '0.11.8') {
      return appReleaseMeta
    }

    if (satisfies(appReleaseMeta.meta_version, `>0.11.8`)) {
      logger.debug(
        `Unable to find out how to migrate ${appReleaseMeta.meta_version} to v0.11.8. Sanitizing`
      )
      try {
        const sanitizedMeta = sanitizeLatestJSON(appReleaseMeta)
        if (sanitizedMeta.meta_type != 'app') {
          throw new Error('Sanitized meta is not an app')
        }
        return sanitizedMeta
      } catch (error) {
        logger.error(`Unable to sanitize ${appReleaseMeta.meta_version} to v0.11.8.`, {
          function: 'migrateReleaseMetaToJSON',
          source: 'appReleaseUtils',
          error: error as Error
        })
        return appReleaseMeta
      }
    }

    return appReleaseMeta
  }

  // Check if it is AppReleaseMeta (needs to be manually migrated)

  // ensure it is outdated
  try {
    if (appReleaseMeta.type == 'single') {
      logger.debug(
        `Migrating single release meta from ${appReleaseMeta.version} to JSON: ${appReleaseMeta.id}`,
        {
          function: 'migrateReleaseMetaToJSON',
          source: 'appReleaseUtils'
        }
      )
      const appReleaseJSON = await migrateAppLatestJSON(appReleaseMeta)
      return appReleaseJSON
    } else if (appReleaseMeta.type == 'multi') {
      logger.debug(
        `Migrating multi release meta from ${appReleaseMeta.version} to JSON: ${appReleaseMeta.id}`,
        {
          function: 'migrateReleaseMetaToJSON',
          source: 'appReleaseUtils'
        }
      )
      const appReleaseJSON: MultiTranslationJSON = {
        meta_type: 'translation',
        releases: (await Promise.all(
          appReleaseMeta.releases.map((release) => migrateReleaseMetaToJSON(release))
        )) as AppLatestJSONLatest[]
      }
      return appReleaseJSON
    } else if (appReleaseMeta.type == 'external') {
      logger.debug(
        `Migrating external release meta from ${appReleaseMeta.version} to JSON: ${appReleaseMeta.id}`,
        {
          function: 'migrateReleaseMetaToJSON',
          source: 'appReleaseUtils'
        }
      )
      const appReleaseJSON: MultiReleaseJSONLatest = {
        meta_version: '0.11.8',
        meta_type: 'multi',
        repository: await determineValidUrl(appReleaseMeta.releases.map((repo) => repo.repository)),
        repositories: appReleaseMeta.releases.map((release) => release.repository as GitRepoUrl)
      }
      return appReleaseJSON
    } else {
      throw new Error(`Error migrating release meta to JSON. Unknown "type" field detected.`)
    }
  } catch (error) {
    throw new Error(
      `Error migrating release meta to JSON: ${appReleaseMeta.id} ${handleError(error)}`
    )
  }
}

/**
 * Migrates a release.json to a AppLatestJSONLatest
 */
const migrateAppLatestJSON = async (
  appRelease: AppReleaseMeta | AppLatestJSONLatest,
  oldRelease?: AppLatestJSONLatest
): Promise<AppLatestJSONLatest> => {
  if ('meta_version' in appRelease) {
    if (appRelease.meta_type != 'app')
      throw new Error(`Invalid meta_type: ${appRelease.meta_type}! It's not 'app'`)

    if (appRelease.meta_version == '0.11.8') return { ...oldRelease, ...appRelease } // combine the two - prioritizing the appRelease

    // handle other migration here - as of right now there are no prior versions to have to migrate from
    return { ...oldRelease, ...appRelease } // combine the two - prioritizing the appRelease
  }

  if (appRelease.type == 'single') {
    return {
      meta_version: '0.11.8',
      meta_type: 'app',
      appManifest: {
        ...oldRelease?.appManifest,
        id: appRelease.id || oldRelease?.appManifest?.id || '',
        version: appRelease.version,
        requires: oldRelease?.appManifest?.requires || [],
        tags: oldRelease?.appManifest?.tags || [],
        requiredVersions: appRelease.requiredVersions || oldRelease?.appManifest?.requiredVersions
      },
      repository: await determineValidUrl([appRelease.repository, oldRelease?.repository || '']),
      updateUrl: await determineValidUpdateUrl(
        [
          appRelease.updateUrl,
          oldRelease?.updateUrl || '',
          appRelease.repository,
          oldRelease?.repository || ''
        ],
        appRelease.id || oldRelease?.appManifest?.id || ''
      ),
      size: appRelease.size || oldRelease?.size || 0,
      createdAt: appRelease.createdAt || oldRelease?.createdAt || 0,
      updatedAt: appRelease.updatedAt || oldRelease?.updatedAt || 0,
      downloads: appRelease.downloads || oldRelease?.downloads || 0,
      icon: appRelease.icon || oldRelease?.icon,
      hash: appRelease.hash,
      hashAlgorithm: appRelease.hashAlgorithm
    }
  }

  throw new Error(`Unable to update app of type ${appRelease.type}!`)
}

/**
 * Uses the server wrapper and updates all of the stats if available
 * @param appLatestServer
 * @param force
 * @param percentTotal
 * @returns
 */
const getUpdatedStats = async (
  appLatestServer: AppLatestServer,
  force = false,
  percentTotal: number = 1
): Promise<AppLatestServer> => {
  try {
    progressBus.update(
      ProgressChannel.FN_RELEASE_APP_STATS,
      `Fetching stats for ${appLatestServer.id}`
    )
    logger.debug(
      `Percent Total for ${appLatestServer.id} Stat Refresh Operation is ${percentTotal}`
    )

    const githubStore = await storeProvider.getStore('githubStore')

    const releaseData = await githubStore.getAllReleases(
      appLatestServer.mainRelease.repository,
      force
    )

    if (!releaseData || releaseData.length == 0)
      throw new Error(`No releases found at ${appLatestServer.mainRelease.repository}`)

    // inc to 25%
    progressBus.incrementProgress(
      ProgressChannel.FN_RELEASE_APP_STATS,
      `Fetched releases for ${appLatestServer.id}`,
      25 * percentTotal
    )

    logger.debug(`Got ${releaseData.length} releases`)

    // Set the last updated time to now
    appLatestServer.lastUpdated = Date.now()

    const releasesWithApp = releaseData.filter((release) => {
      return release.assets.some(
        (asset) =>
          asset.name.includes(appLatestServer.id) &&
          (asset.name.endsWith('.zip') ||
            asset.name.endsWith('.tar.gz') ||
            asset.name === `${appLatestServer.id}.json` ||
            asset.name === 'latest.json')
      )
    })

    // Step 2: If no releases contain this app, skip processing
    if (releasesWithApp.length === 0) {
      throw new Error(`No releases were found containing app ${appLatestServer.id}`)
    }

    // Step 3: Sort by date (newest first) and separate latest from past
    const sortedAppReleases = releasesWithApp.sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    )

    const latestAppRelease = sortedAppReleases[0]
    const pastAppReleases = sortedAppReleases.slice(1)

    // inc to 50%
    progressBus.incrementProgress(
      ProgressChannel.FN_RELEASE_APP_STATS,
      `Finding latest JSON and ZIP files`,
      25 * percentTotal
    )

    // Step 4: Process the latest release containing this app
    const findAppJsonAsset = (release: GithubRelease, appId: string): GithubAsset | undefined => {
      // Priority: appId.json > latest.json
      const appIdJson = release.assets.find((asset) => asset.name === `${appId}.json`)
      if (appIdJson) return appIdJson

      const latestJson = release.assets.find((asset) => asset.name === 'latest.json')
      return latestJson
    }

    const findAppZipAsset = (release: GithubRelease, appId: string): GithubAsset | undefined => {
      return release.assets.find(
        (asset) =>
          asset.name.includes(appId) &&
          (asset.name.endsWith('.zip') || asset.name.endsWith('.tar.gz'))
      )
    }

    // Step 5: Create mainRelease from the latest release containing this app
    const jsonAsset = findAppJsonAsset(latestAppRelease, appLatestServer.id)
    const zipAsset = findAppZipAsset(latestAppRelease, appLatestServer.id)

    if (zipAsset) {
      try {
        let appMetadata: AppLatestJSONLatest = appLatestServer.mainRelease

        // Try to get JSON metadata if available
        if (jsonAsset) {
          try {
            const jsonContent =
              await githubStore.fetchJSONAssetContent<AppLatestJSONLatest>(jsonAsset)
            if (jsonContent) {
              // Replace with the migrated data
              appMetadata = await migrateAppLatestJSON(jsonContent, appLatestServer.mainRelease)
            }
          } catch (error) {
            logger.warn(
              `Failed to fetch JSON stats for ${appLatestServer.id}: ${handleError(error)}`
            )
          }
        }

        // Now update the mainRelease with the data we have
        appLatestServer.mainRelease = {
          // JSON metadata (if available)
          ...appMetadata,

          // ZIP download data (always use this for actual download stats)
          downloads: zipAsset.download_count ?? 0,
          size: zipAsset.size,
          updateUrl: zipAsset.browser_download_url,

          // Release info
          createdAt: new Date(latestAppRelease.published_at).getTime(),
          updatedAt: new Date().getTime()
        }

        // Add to total downloads
        appLatestServer.totalDownloads += zipAsset.download_count ?? 0
      } catch (error) {
        console.error(`Failed to process latest release for ${appLatestServer.id}:`, error)
      }
    }

    // inc to 75%
    progressBus.incrementProgress(
      ProgressChannel.FN_RELEASE_APP_STATS,
      `Collecting ${pastAppReleases.length} past installations`,
      25 * percentTotal
    )

    appLatestServer.pastReleases = [] // clear it first before adding the new past releases to it

    // Step 6: Process past releases containing this app
    pastAppReleases.forEach((release) => {
      release.assets.forEach((asset) => {
        // Only process ZIP/TAR.GZ assets for this specific app
        if (!asset.name.includes(appLatestServer.id)) return
        if (!asset.name.endsWith('.zip') && !asset.name.endsWith('.tar.gz')) return

        // Add to total downloads
        appLatestServer.totalDownloads += asset.download_count ?? 0

        // Add to past releases
        appLatestServer.pastReleases?.push({
          tag: release.tag_name,
          created_at: release.published_at,
          downloads: asset.download_count ?? 0,
          size: asset.size,
          download_url: asset.browser_download_url,
          name: asset.name
        })
      })
    })

    // inc to 100%
    progressBus.incrementProgress(
      ProgressChannel.FN_RELEASE_APP_STATS,
      `Got App Stats`,
      25 * percentTotal
    )

    return appLatestServer
  } catch (error) {
    progressBus.warn(
      ProgressChannel.FN_RELEASE_APP_STATS,
      `Failed to get ${appLatestServer.id} Stats`,
      handleError(error)
    )
    return appLatestServer
  }
}
