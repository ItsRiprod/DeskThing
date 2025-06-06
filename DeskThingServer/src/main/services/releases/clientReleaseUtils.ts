import {
  ClientLatestJSONLatest,
  ClientManifest,
  ClientReleaseMeta,
  MultiReleaseJSONLatest
} from '@deskthing/types'
import {
  ClientLatestServer,
  ClientReleaseFile,
  ClientReleaseFile0118,
  GithubAsset,
  GithubRelease,
  ProgressChannel,
  RefreshOptions
} from '@shared/types'
import { determineValidUpdateUrl, determineValidUrl, sanitizeReleaseMeta } from './releaseUtils'
import logger from '@server/utils/logger'
import { handleError } from '@server/utils/errorHandler'
import { satisfies } from 'semver'
import { progressBus } from '../events/progressBus'
import { storeProvider } from '@server/stores/storeProvider'

export const createClientReleaseFile = async (
  force: boolean = false
): Promise<ClientReleaseFile0118> => {
  const { clientRepo, defaultClientLatestJSONFallback } = await import(
    '@server/static/releaseMetadata'
  )
  try {
    progressBus.startOperation(
      ProgressChannel.FN_RELEASE_CLIENT_REFRESH,
      'Refreshing Client Releases',
      'Initializing Refresh',
      [
        {
          channel: ProgressChannel.FN_RELEASE_CLIENT_STATS,
          weight: 10
        }
      ]
    )
    const githubStore = await storeProvider.getStore('githubStore')

    logger.debug(`Fetching latest release from ${clientRepo}`)
    const latestReleaseAssets = await githubStore.getLatestRelease(clientRepo)

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
    const latestJSON = await githubStore.fetchJSONAssetContent(latestReleaseJsonAsset)

    if (!latestJSON) {
      throw new Error('Unable to fetch latest.json. (error downloading)')
    }

    // Check that latestJSON is valid
    const sanitizedJson = sanitizeReleaseMeta(latestJSON)

    if (sanitizedJson.meta_type != 'multi') {
      throw new Error('latest.json is not a multi release')
    }

    const finalClientReleaseFile: ClientReleaseFile0118 = {
      version: '0.11.8',
      repositories: sanitizedJson.repositories || [],
      releases: [],
      timestamp: Date.now()
    }

    progressBus.start(
      ProgressChannel.FN_RELEASE_CLIENT_STATS,
      'Getting Stats',
      `Getting Stats for the client`
    )

    // Handle getting all of the field IDs
    if (sanitizedJson.fileIds && sanitizedJson.fileIds.length > 0) {
      const percentPerClient = 100 / sanitizedJson.fileIds.length
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
              await githubStore.fetchJSONAssetContent<ClientLatestJSONLatest>(fileAsset)
            if (!fileContent) {
              throw new Error(
                `Unable to fetch file content from ${fileAsset?.browser_download_url}`
              )
            }

            const latestServer: ClientLatestServer = {
              id: fileId,
              mainRelease: fileContent,
              lastUpdated: Date.now(),
              totalDownloads: 0,
              pastReleases: []
            }

            const updatedLatestServer = await getUpdatedStats(latestServer, force, percentPerClient)

            return updatedLatestServer
          } catch (error) {
            logger.warn(`Error fetching file ${fileId}: ${handleError(error)}`)
            return null
          }
        })
      )

      finalClientReleaseFile.releases = releases.filter((file) => file !== null)
    }

    progressBus.complete(
      ProgressChannel.FN_RELEASE_CLIENT_STATS,
      `Got ${finalClientReleaseFile.releases.length} releases from file and updated them all`
    )

    logger.debug(
      `Successfully got ${finalClientReleaseFile.releases.length} releases from file and updated them all`
    )

    return finalClientReleaseFile
  } catch (error) {
    logger.error(
      `Encountered an unknown error initializing the release data: ${handleError(error)}`,
      {
        error: error as Error,
        function: 'createClientReleaseFile',
        domain: 'clientReleaseUtils'
      }
    )
    return defaultClientLatestJSONFallback
  }
}

/**
 * Refreshes the client release data by migrating the file and optionally updating client release statistics.
 * @param prevClientReleaseFile The previous client release file to be refreshed
 * @param options Configuration options for the refresh operation
 * @param options.force Optional flag to force refresh of stats
 * @param options.updateStates Optional flag to enable/disable stats update (default true)
 * @returns A migrated and potentially updated ClientReleaseFile
 */
export const handleRefreshClientReleaseFile = async (
  prevClientReleaseFile: ClientReleaseFile,
  { force = false, updateStates = true }: RefreshOptions
): Promise<ClientReleaseFile0118> => {
  progressBus.startOperation(
    ProgressChannel.FN_RELEASE_CLIENT_REFRESH,
    'Refreshing Client Releases',
    'Initializing Refresh',
    [
      {
        channel: ProgressChannel.FN_RELEASE_CLIENT_STATS,
        weight: 10
      }
    ]
  )

  // Step 1: Handle the migration of the FILE
  const migratedClientReleaseFile = await handleMigration(prevClientReleaseFile)

  // Step 2: Update all of the clients
  progressBus.start(ProgressChannel.FN_RELEASE_CLIENT_STATS, 'Getting Stats', 'Getting Stats')

  if (updateStates) {
    const percentPerClient = 100 / migratedClientReleaseFile.releases.length

    const updatedReleases = await Promise.all(
      migratedClientReleaseFile.releases.map(async (release) => {
        return await getUpdatedStats(release, force, percentPerClient)
      })
    )
    progressBus.complete(
      ProgressChannel.FN_RELEASE_CLIENT_STATS,
      `Successfully got ${updatedReleases.length} releases`,
      'Completed Stat Retrieval'
    )
    migratedClientReleaseFile.releases = updatedReleases
  } else {
    progressBus.complete(
      ProgressChannel.FN_RELEASE_CLIENT_STATS,
      `Stat Refresh was disabled`,
      'Completed Task'
    )
  }

  return migratedClientReleaseFile
}

/**
 * Handles the migration of any ClientReleaseFile to ClientReleaseFile0118
 */
const handleMigration = async (
  clientReleases: ClientReleaseFile
): Promise<ClientReleaseFile0118> => {
  progressBus.start(
    ProgressChannel.FN_RELEASE_CLIENT_MIGRATE,
    'Migrating ClientReleases',
    'Starting Migration'
  )
  if (clientReleases.version == '0.11.8') {
    progressBus.complete(ProgressChannel.FN_RELEASE_CLIENT_MIGRATE, 'Version up to date')
    return clientReleases
  }

  // Setup the framework of what is being added
  const newClientReleases: ClientReleaseFile0118 = {
    version: '0.11.8',
    repositories: [],
    releases: [],
    timestamp: Date.now()
  }

  // The version is older than current latest
  if (satisfies(clientReleases.version, `<0.11.8`)) {
    progressBus.update(ProgressChannel.FN_RELEASE_CLIENT_MIGRATE, 'Updating to v0.11.8', 15)
    const incAmount = 70 / clientReleases.releases.length
    await Promise.all(
      clientReleases.releases.map(async (release) => {
        // Migrate the releases to a (hopefully) usable state
        try {
          progressBus.update(
            ProgressChannel.FN_RELEASE_CLIENT_MIGRATE,
            `Migrating ${release.id} to v0.11.8`
          )
          const updatedRelease = await migrateReleaseMetaToJSON(release)

          if (updatedRelease.meta_type == 'client') {
            const latestClientServer: ClientLatestServer = {
              id: updatedRelease.clientManifest.id,
              mainRelease: updatedRelease,
              lastUpdated: Date.now(),
              totalDownloads: 0,
              pastReleases: []
            }
            newClientReleases.releases.push(latestClientServer)
          } else if (updatedRelease.meta_type == 'multi') {
            if (updatedRelease.repositories && updatedRelease.repositories.length > 0) {
              newClientReleases.repositories = [
                ...new Set([
                  ...newClientReleases.repositories,
                  ...(updatedRelease.repositories || [])
                ])
              ]
            }
            if (updatedRelease.fileIds && updatedRelease.fileIds.length > 0) {
              newClientReleases.repositories = [
                ...new Set([...newClientReleases.repositories, ...(updatedRelease.fileIds || [])])
              ]
            }
          } else if (updatedRelease.meta_type == 'translation') {
            const existingIds = newClientReleases.releases.map((release) => release.id)
            const uniqueClients = updatedRelease.releases.filter(
              (release) => !existingIds.includes(release.clientManifest.id)
            )
            const latestClientServers = uniqueClients.map((uniqueClient) => ({
              id: uniqueClient.clientManifest.id,
              mainRelease: uniqueClient,
              currentVersion: uniqueClient.clientManifest.version,
              lastUpdated: Date.now(),
              totalDownloads: 0,
              pastReleases: []
            }))
            if (latestClientServers.length > 0) {
              newClientReleases.releases.push(...latestClientServers)
            }
          }
          progressBus.incrementProgress(
            ProgressChannel.FN_RELEASE_CLIENT_MIGRATE,
            `Migrated ${release.id}`,
            incAmount
          )
        } catch (error) {
          progressBus.incrementProgress(
            ProgressChannel.FN_RELEASE_CLIENT_MIGRATE,
            `Failed ${release.id}`,
            incAmount
          )
          progressBus.warn(
            ProgressChannel.FN_RELEASE_CLIENT_MIGRATE,
            `Failed ${release.id}`,
            handleError(error)
          )
          logger.error(`Error migrating ${release.id} to latest version: ${handleError(error)}`, {
            function: 'handleMigration',
            source: 'clientReleaseUtils',
            error: error as Error
          })
        }
      })
    )
  } else if (satisfies(clientReleases.version, `>0.11.8`)) {
    logger.error(
      `Unable to migrate ${clientReleases.version} to v0.11.8 because it is of an unknown version. Try updating the server.`,
      {
        function: 'handleMigration',
        source: 'clientReleaseUtils'
      }
    )
  } else {
    logger.error('Server must be outdated or the version is not correct.', {
      function: 'handleMigration',
      source: 'clientReleaseUtils'
    })
  }
  // ends at 85%

  progressBus.complete(
    ProgressChannel.FN_RELEASE_CLIENT_MIGRATE,
    `Finished migration of ${newClientReleases?.releases?.length} clients`
  )

  return newClientReleases
}

type MultiTranslationJSON = {
  meta_type: 'translation'
  releases: ClientLatestJSONLatest[]
}

/**
 * Handles the migration of a release's metadata to the latest version.
 */
const migrateReleaseMetaToJSON = async (
  clientReleaseMeta: ClientReleaseMeta | ClientLatestJSONLatest | MultiReleaseJSONLatest
): Promise<ClientLatestJSONLatest | MultiReleaseJSONLatest | MultiTranslationJSON> => {
  // Check if it just needs to be validated to update to v0.11.8

  if ('meta_version' in clientReleaseMeta) {
    if (clientReleaseMeta.meta_version == '0.11.8') {
      return clientReleaseMeta
    }

    if (satisfies(clientReleaseMeta.meta_version, `>0.11.8`)) {
      logger.debug(
        `Unable to find out how to migrate ${clientReleaseMeta.meta_version} to v0.11.8. Sanitizing`
      )
      try {
        const sanitizedMeta = sanitizeReleaseMeta(clientReleaseMeta)
        if (sanitizedMeta.meta_type != 'client') {
          throw new Error('Sanitized meta is not an client')
        }
        return sanitizedMeta
      } catch (error) {
        logger.error(`Unable to sanitize ${clientReleaseMeta.meta_version} to v0.11.8.`, {
          function: 'migrateReleaseMetaToJSON',
          source: 'clientReleaseUtils',
          error: error as Error
        })
        return clientReleaseMeta
      }
    }

    return clientReleaseMeta
  }

  // Check if it is ClientReleaseMeta (needs to be manually migrated)

  // ensure it is outdated
  try {
    logger.debug(
      `Migrating single release meta from ${clientReleaseMeta.version} to JSON: ${clientReleaseMeta.id}`,
      {
        function: 'migrateReleaseMetaToJSON',
        source: 'clientReleaseUtils'
      }
    )
    const clientReleaseJSON = await migrateClientLatestJSON(clientReleaseMeta)
    return clientReleaseJSON
  } catch (error) {
    throw new Error(
      `Error migrating release meta to JSON: ${clientReleaseMeta.id} ${handleError(error)}`
    )
  }
}

/**
 * Migrates a release.json to a ClientLatestJSONLatest
 */
const migrateClientLatestJSON = async (
  clientRelease: ClientReleaseMeta | ClientLatestJSONLatest,
  oldRelease?: ClientLatestJSONLatest
): Promise<ClientLatestJSONLatest> => {
  if ('meta_version' in clientRelease) {
    if (clientRelease.meta_version == '0.11.8') return { ...oldRelease, ...clientRelease } // combine the two - prioritizing the clientRelease

    // handle other migration here - as of right now there are no prior versions to have to migrate from
    return { ...oldRelease, ...clientRelease } // combine the two - prioritizing the clientRelease
  }

  return {
    meta_version: '0.11.8',
    meta_type: 'client',
    clientManifest: {
      ...oldRelease?.clientManifest,
      name: clientRelease.id || oldRelease?.clientManifest?.name || '',
      short_name: clientRelease.short_name || oldRelease?.clientManifest?.short_name || '',
      description: clientRelease.description || oldRelease?.clientManifest?.description || '',
      reactive: oldRelease?.clientManifest?.reactive || false,
      repository: clientRelease.repository || oldRelease?.clientManifest?.repository || '',
      author: clientRelease.author || oldRelease?.clientManifest?.author || '',
      compatibility: oldRelease?.clientManifest?.compatibility || {
        server: '0.11.0',
        app: '0.11.0'
      },
      id: clientRelease.id || oldRelease?.clientManifest?.id || '',
      version: clientRelease.version
    } as ClientManifest,
    repository: await determineValidUrl([clientRelease.repository, oldRelease?.repository || '']),
    updateUrl: await determineValidUpdateUrl(
      [
        clientRelease.updateUrl,
        oldRelease?.updateUrl || '',
        clientRelease.repository,
        oldRelease?.repository || ''
      ],
      clientRelease.id || oldRelease?.clientManifest?.id || ''
    ),
    size: clientRelease.size || oldRelease?.size || 0,
    createdAt: clientRelease.createdAt || oldRelease?.createdAt || 0,
    updatedAt: clientRelease.updatedAt || oldRelease?.updatedAt || 0,
    downloads: clientRelease.downloads || oldRelease?.downloads || 0,
    icon: clientRelease.icon || oldRelease?.icon,
    hash: clientRelease.hash,
    hashAlgorithm: clientRelease.hashAlgorithm
  }
}

/**
 * Uses the server wrclienter and updates all of the stats if available
 * @param clientLatestServer
 * @param force
 * @param percentTotal
 * @returns
 */
const getUpdatedStats = async (
  clientLatestServer: ClientLatestServer,
  force = false,
  percentTotal: number = 1
): Promise<ClientLatestServer> => {
  try {
    progressBus.update(
      ProgressChannel.FN_RELEASE_CLIENT_STATS,
      `Fetching stats for ${clientLatestServer.id}`
    )

    const githubStore = await storeProvider.getStore('githubStore')

    const releaseData = await githubStore.getAllReleases(
      clientLatestServer.mainRelease.repository,
      force
    )

    if (!releaseData)
      throw new Error(`No releases found at ${clientLatestServer.mainRelease.repository}`)

    // inc to 25%
    progressBus.incrementProgress(
      ProgressChannel.FN_RELEASE_CLIENT_STATS,
      `Fetched releases for ${clientLatestServer.id}`,
      25 * percentTotal
    )

    logger.debug(`Got ${releaseData.length} releases`)

    // Set the last updated time to now
    clientLatestServer.lastUpdated = Date.now()

    const releasesWithClient = releaseData.filter((release) => {
      return release.assets.some(
        (asset) =>
          asset.name.includes(clientLatestServer.id) &&
          (asset.name.endsWith('.zip') ||
            asset.name.endsWith('.tar.gz') ||
            asset.name === `${clientLatestServer.id}.json` ||
            asset.name === 'latest.json')
      )
    })

    // Step 2: If no releases contain this client, skip processing
    if (releasesWithClient.length === 0) {
      throw new Error(`No releases were found containing client ${clientLatestServer.id}`)
    }

    // Step 3: Sort by date (newest first) and separate latest from past
    const sortedClientReleases = releasesWithClient.sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    )

    const latestClientRelease = sortedClientReleases[0]
    const pastClientReleases = sortedClientReleases.slice(1)

    // inc to 50%
    progressBus.incrementProgress(
      ProgressChannel.FN_RELEASE_CLIENT_STATS,
      `Finding latest JSON and ZIP files`,
      25 * percentTotal
    )

    // Step 4: Process the latest release containing this client
    const findClientJsonAsset = (
      release: GithubRelease,
      clientId: string
    ): GithubAsset | undefined => {
      // Priority: clientId.json > latest.json
      const clientIdJson = release.assets.find((asset) => asset.name === `${clientId}.json`)
      if (clientIdJson) return clientIdJson

      const latestJson = release.assets.find((asset) => asset.name === 'latest.json')
      return latestJson
    }

    const findClientZipAsset = (
      release: GithubRelease,
      clientId: string
    ): GithubAsset | undefined => {
      return release.assets.find(
        (asset) =>
          asset.name.includes(clientId) &&
          (asset.name.endsWith('.zip') || asset.name.endsWith('.tar.gz'))
      )
    }

    // Step 5: Create mainRelease from the latest release containing this client
    const jsonAsset = findClientJsonAsset(latestClientRelease, clientLatestServer.id)
    const zipAsset = findClientZipAsset(latestClientRelease, clientLatestServer.id)

    if (zipAsset) {
      try {
        let clientMetadata: ClientLatestJSONLatest = clientLatestServer.mainRelease

        // Try to get JSON metadata if available
        if (jsonAsset) {
          try {
            const jsonContent =
              await githubStore.fetchJSONAssetContent<ClientLatestJSONLatest>(jsonAsset)
            if (jsonContent) {
              // Replace with the migrated data
              clientMetadata = await migrateClientLatestJSON(
                jsonContent,
                clientLatestServer.mainRelease
              )
            }
          } catch (error) {
            console.warn(`Failed to fetch JSON for ${clientLatestServer.id}:`, error)
          }
        }

        // Now update the mainRelease with the data we have
        clientLatestServer.mainRelease = {
          // JSON metadata (if available)
          ...clientMetadata,

          // ZIP download data (always use this for actual download stats)
          downloads: zipAsset.download_count ?? 0,
          size: zipAsset.size,
          updateUrl: zipAsset.browser_download_url,

          // Release info
          createdAt: new Date(latestClientRelease.published_at).getTime(),
          updatedAt: new Date().getTime()
        }

        // Add to total downloads
        clientLatestServer.totalDownloads += zipAsset.download_count ?? 0
      } catch (error) {
        console.error(`Failed to process latest release for ${clientLatestServer.id}:`, error)
      }
    }

    // inc to 75%
    progressBus.incrementProgress(
      ProgressChannel.FN_RELEASE_CLIENT_STATS,
      `Collecting ${pastClientReleases.length} past installations`,
      25 * percentTotal
    )

    // Step 6: Process past releases containing this client
    pastClientReleases.forEach((release) => {
      release.assets.forEach((asset) => {
        // Only process ZIP/TAR.GZ assets for this specific client
        if (!asset.name.includes(clientLatestServer.id)) return
        if (!asset.name.endsWith('.zip') && !asset.name.endsWith('.tar.gz')) return

        // Add to total downloads
        clientLatestServer.totalDownloads += asset.download_count ?? 0

        // Add to past releases
        clientLatestServer.pastReleases?.push({
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
      ProgressChannel.FN_RELEASE_CLIENT_STATS,
      `Got Client Stats`,
      25 * percentTotal
    )

    return clientLatestServer
  } catch (error) {
    progressBus.warn(
      ProgressChannel.FN_RELEASE_CLIENT_STATS,
      'Failed to get Client Stats',
      handleError(error)
    )
    return clientLatestServer
  }
}
