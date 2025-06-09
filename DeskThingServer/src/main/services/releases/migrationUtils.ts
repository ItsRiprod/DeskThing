import {
  AppLatestJSONLatest,
  AppReleaseMeta,
  AppReleaseSingleMeta,
  ClientConnectionMethod,
  ClientLatestJSONLatest,
  ClientPlatformIDs,
  ClientReleaseMeta,
  GitRepoUrl,
  MultiReleaseJSONLatest
} from '@deskthing/types'
import logger from '@server/utils/logger'
import {
  AppLatestServer,
  AppReleaseFile,
  AppReleaseFile0118,
  ClientLatestServer,
  ClientReleaseFile,
  ClientReleaseFile0118,
  PastReleaseInfo
} from '@shared/types'
import { satisfies } from 'semver'
import {
  determineValidUpdateUrl,
  determineValidUrl,
  handleLatestValidation
} from './releaseValidation'
import { storeProvider } from '@server/stores/storeProvider'
import { handleError } from '@server/utils/errorHandler'
import { collectPastReleases, convertIdToReleaseServer } from './releaseUtils'

/**
 * Handles the migration of any old file to the current file
 */
export const handleReleaseJSONFileMigration = async <T extends 'app' | 'client'>(
  type: T,
  releaseFile: T extends 'app' ? AppReleaseFile : ClientReleaseFile
): Promise<T extends 'app' ? AppReleaseFile0118 : ClientReleaseFile0118> => {
  if (releaseFile.version == '0.11.8') {
    // Type assertion because ts is a bit confused
    return releaseFile as T extends 'app' ? AppReleaseFile0118 : ClientReleaseFile0118
  }

  const validRepositories: string[] = []

  const githubStore = await storeProvider.getStore('githubStore')

  const updatedReleases = await Promise.all(
    releaseFile.releases.map(async (release: AppReleaseMeta | ClientReleaseMeta) => {
      const updatedRelease = await handleReleaseJSONMigration(release)

      if (updatedRelease.meta_type == 'multi') {
        if (updatedRelease.repositories) {
          const updatedRepositories = await Promise.all(
            updatedRelease.repositories.map(async (repo) => {
              return await determineValidUrl([repo])
            })
          )
          validRepositories.push(...updatedRepositories)
        }
        return
      } else if (updatedRelease.meta_type == 'app') {
        let pastReleases: PastReleaseInfo[] = []
        let totalDownloads = 0
        try {
          const githubReleases = await githubStore.getAllReleases(updatedRelease.repository)

          pastReleases = collectPastReleases(githubReleases, updatedRelease.appManifest.id)
          totalDownloads = pastReleases.reduce((acc, release) => acc + release.downloads, 0)
        } catch (error) {
          logger.warn(
            `There was an error collecting past releases for ${updatedRelease.appManifest.id}: ${handleError(error)}`
          )
        }
        const latest = {
          id: updatedRelease.appManifest.id,
          mainRelease: updatedRelease,
          lastUpdated: Date.now(),
          totalDownloads: totalDownloads,
          pastReleases: pastReleases
        } as AppLatestServer

        return latest
      } else if (updatedRelease.meta_type == 'client') {
        let pastReleases: PastReleaseInfo[] = []
        let totalDownloads = 0
        try {
          const githubReleases = await githubStore.getAllReleases(updatedRelease.repository)

          pastReleases = collectPastReleases(githubReleases, updatedRelease.clientManifest.id)
          totalDownloads = pastReleases.reduce((acc, release) => acc + release.downloads, 0)
        } catch (error) {
          logger.warn(
            `There was an error collecting past releases for ${updatedRelease.clientManifest.id}: ${handleError(error)}`
          )
        }
        const latest = {
          id: updatedRelease.clientManifest.id,
          mainRelease: updatedRelease,
          lastUpdated: Date.now(),
          totalDownloads: totalDownloads,
          pastReleases: pastReleases
        } as ClientLatestServer

        return latest
      } else {
        logger.debug(`Release ${release.id} is not supported`, {
          function: 'handleReleaseJSONMigration',
          source: 'migrationUtils'
        })
        return
      }
    })
  )

  const filteredReleases = updatedReleases.filter(
    (release): release is AppLatestServer | ClientLatestServer =>
      release != undefined && release.type == type
  )

  return {
    type: type,
    version: '0.11.8',
    repositories: validRepositories,
    releases: filteredReleases,
    timestamp: Date.now()
  } as T extends 'app' ? AppReleaseFile0118 : ClientReleaseFile0118
}
/**
 * Handles the migration of any release type to the latest
 * Can optionally pass an "prevRelease" that needs to use information from this new, potentially outdated releaase to update it
 * @param newRelease - the new release to be migrated
 * @param pastRelease - the past release to use to fill in missing information
 * @param appId - the ID of the app to use to fill in missing information
 *
 */
export const handleReleaseJSONMigration = async <
  T extends ClientLatestJSONLatest | AppLatestJSONLatest | MultiReleaseJSONLatest
>(
  newRelease: T | AppReleaseMeta | ClientReleaseMeta | AppReleaseSingleMeta,
  pastReleases?: T,
  appId?: string
): Promise<T> => {
  // Handle when the version is up to date

  try {
    if ('meta_version' in newRelease) {
      if (newRelease.meta_type != pastReleases?.meta_type)
        throw new Error('meta_type does not match pastReleases')

      // the version is up to date
      if (satisfies(newRelease.meta_version, '=0.11.8')) return newRelease as T

      if (satisfies(newRelease.meta_version, '>=0.11.8')) {
        logger.warn(
          `Release ${newRelease.meta_type} is from the future and will be attempted to be migrated to the current version: ${newRelease.meta_version}`
        )
      }

      // automatically sanitizes the release and updates any urls as needed
      const sanitizedRelease = await handleLatestValidation(newRelease, pastReleases)

      return sanitizedRelease
    }

    // - Handle filling in the information
    // - Handle sanitization
    // - Ensure the URLs are all valid (download + repo urls)

    // Handle when the version is outdated

    // version is outdated (oops)

    if ('type' in newRelease) {
      // App Release Meta
      switch (newRelease.type) {
        case 'external':
          return (await handleReleaseExternalToMultiJSONMigration(
            newRelease,
            pastReleases?.meta_type == 'multi' ? pastReleases : undefined
          )) as T
        case 'multi':
          return (await handleReleaseMultiToAppJSONMigration(
            newRelease,
            pastReleases?.meta_type == 'multi' || pastReleases?.meta_type == 'app'
              ? pastReleases
              : undefined,
            appId
          )) as T
        case 'single':
          return (await handleReleaseMetaToAppJSONMigration(
            newRelease,
            pastReleases?.meta_type == 'app' ? pastReleases : undefined
          )) as T
      }
    } else {
      // Client Release Meta
      return (await handleReleaseMetaClientToClientJSONMigration(
        newRelease,
        pastReleases?.meta_type == 'client' ? pastReleases : undefined
      )) as T
    }

    // - Handle AppReleaseMeta -> AppLatestJSON | AppLatestJSON[] conversion depending on if there is an ID
    // - Handle ClientReleaseMeta -> AppLatestJSON conversion
    // - Handle AppReleaseSingleMeta -> AppLatestJSON conversion

    // Handle when the version is from the future (try not to cry)
  } catch (error) {
    if (pastReleases) {
      logger.error(
        `Failed to migrate release ${pastReleases?.meta_type || 'unknown'} because ${handleError(error)}`,
        {
          function: 'handleReleaseMetaToAppJSONMigration',
          source: 'migrationUtils'
        }
      )
      return pastReleases
    } else {
      try {
        logger.debug(
          `Failed to migrate release ${handleError(error)} ${JSON.stringify(newRelease)}`,
          {
            function: 'handleReleaseMetaToAppJSONMigration',
            source: 'migrationUtils'
          }
        )
        throw error
      } catch {
        // Catch a potential serialization error with the json
        throw error
      }
    }
  }
}

/**
 * Handles the migration from the potentially outdated AppReleaseMeta to the AppLatestJSONLatest
 */
export const handleReleaseMetaToAppJSONMigration = async (
  releaseMeta: AppReleaseMeta | AppLatestJSONLatest,
  pastRelease?: AppLatestJSONLatest
): Promise<AppLatestJSONLatest> => {
  if ('meta_version' in releaseMeta) {
    if (releaseMeta.meta_type !== 'app') {
      throw new Error(`Invalid meta_type: ${releaseMeta.meta_type}! It's not 'app'`)
    }
    if (releaseMeta.meta_version === '0.11.8') {
      return { ...pastRelease, ...releaseMeta }
    }
    return { ...pastRelease, ...releaseMeta }
  }

  if (releaseMeta.type === 'single') {
    const appId = releaseMeta.id || pastRelease?.appManifest?.id || ''

    const validatedRepository = await determineValidUrl([
      releaseMeta.repository,
      pastRelease?.repository || ''
    ])
    const validatedUpdateUrl = await determineValidUpdateUrl(
      [
        releaseMeta.updateUrl,
        pastRelease?.updateUrl || '',
        releaseMeta.repository,
        pastRelease?.repository || ''
      ],
      appId
    )

    // Get latest stats if possible
    let downloads = releaseMeta.downloads || pastRelease?.downloads || 0
    let size = releaseMeta.size || pastRelease?.size || 0

    try {
      const githubStore = await storeProvider.getStore('githubStore')
      const releaseData = await githubStore.getLatestRelease(validatedRepository)

      if (releaseData) {
        const appAsset = releaseData.assets.find(
          (asset) =>
            asset.name.includes(appId) &&
            (asset.name.endsWith('.zip') || asset.name.endsWith('.tar.gz'))
        )

        if (appAsset) {
          downloads = appAsset.download_count || downloads
          size = appAsset.size || size
        }
      }
    } catch (error) {
      logger.warn(`Failed to fetch latest stats for ${appId}: ${handleError(error)}`)
    }

    return {
      meta_version: '0.11.8',
      meta_type: 'app',
      appManifest: {
        ...pastRelease?.appManifest,
        id: appId,
        version: releaseMeta.version,
        requires: pastRelease?.appManifest?.requires || [],
        tags: releaseMeta.tags || pastRelease?.appManifest?.tags || [],
        requiredVersions: releaseMeta.requiredVersions || pastRelease?.appManifest?.requiredVersions
      },
      repository: validatedRepository,
      updateUrl: validatedUpdateUrl,
      size,
      createdAt: releaseMeta.createdAt || pastRelease?.createdAt || 0,
      updatedAt: releaseMeta.updatedAt || pastRelease?.updatedAt || Date.now(),
      downloads,
      icon: releaseMeta.icon || pastRelease?.icon,
      hash: releaseMeta.hash,
      hashAlgorithm: releaseMeta.hashAlgorithm
    }
  }

  throw new Error(`Unable to update app of type ${releaseMeta.type}!`)
}

/**
 * Handles the migration from the potentially outdated AppReleaseMeta to the AppLatestJSONLatest
 */
export const handleReleaseExternalToMultiJSONMigration = async (
  releaseMeta: AppReleaseMeta | MultiReleaseJSONLatest,
  pastRelease?: MultiReleaseJSONLatest
): Promise<MultiReleaseJSONLatest> => {
  if ('meta_version' in releaseMeta) {
    if (satisfies(releaseMeta.meta_version, '=0.11.8')) {
      return releaseMeta
    } else {
      logger.warn(`Unable to handle translation between ${releaseMeta.meta_version} and 0.11.8`)
      return { ...pastRelease, ...releaseMeta }
    }
  }

  throw new Error('Not implemented yet!')
}

/**
 * Handles the migration from the potentially outdated AppReleaseMeta to the AppLatestJSONLatest
 */
export const handleReleaseMultiToAppJSONMigration = async (
  releaseMeta: AppReleaseMeta | MultiReleaseJSONLatest,
  pastRelease?: AppLatestJSONLatest | MultiReleaseJSONLatest,
  appId?: string
): Promise<AppLatestJSONLatest | AppLatestJSONLatest[]> => {
  const githubStore = await storeProvider.getStore('githubStore')

  if ('meta_version' in releaseMeta) {
    const validatedRepoUrl = await determineValidUrl([
      releaseMeta.repository,
      pastRelease?.repository || ''
    ])
    if (releaseMeta.fileIds) {
      const releases = await githubStore.getAllReleases(validatedRepoUrl)

      const serverReleases = await Promise.all(
        releaseMeta.fileIds.map(async (id) => {
          return convertIdToReleaseServer(id, validatedRepoUrl, releases).catch((error) => {
            logger.error(`Failed to convert ID ${id} to release server: ${handleError(error)}`)
            return undefined
          })
        })
      )

      const appReleases = serverReleases.filter(
        (release) => release != undefined && release.type === 'app'
      )

      if (appId) {
        // return just the app with that id
        const app = appReleases.filter((app) => app.id === appId)[0]
        return app.mainRelease
      } else {
        // return all apps
        const apps = appReleases.map((app) => app.mainRelease)
        return apps
      }
    }

    throw new Error('Release Multi didnt have fileIds available.')
  }

  // Handle migration from appReleaseMeta to AppLatestJSON

  if (releaseMeta.type == 'single')
    return await handleReleaseMetaToAppJSONMigration(
      releaseMeta,
      pastRelease?.meta_type == 'app' ? pastRelease : undefined
    )

  if (releaseMeta.type == 'external') {
    throw new Error(
      `Unable to handle type 'external' when migrating - this is generally a community release`
    )
  }

  const latestJson: AppLatestJSONLatest[] = releaseMeta.releases.map((release) => {
    return {
      meta_version: '0.11.8',
      meta_type: 'app',
      appManifest: {
        id: release.id,
        name: release.id,
        version: release.version,
        short_name: release.id,
        requires: [],
        tags: release.tags || '',
        requiredVersions: release.requiredVersions || ''
      },
      icon: release.icon,
      hash: release.hash,
      hashAlgorithm: release.hashAlgorithm,
      repository: release.repository as GitRepoUrl,
      updateUrl: release.updateUrl,
      downloads: release.downloads || 0,
      size: release.size || 0,
      createdAt: release.createdAt || 0,
      updatedAt: release.updatedAt || 0
    }
  })

  if (appId) {
    return latestJson.filter((json) => json.appManifest.id === appId)[0]
  } else {
    return latestJson
  }
}

export const handleReleaseMetaClientToClientJSONMigration = async (
  releaseMeta: ClientReleaseMeta | ClientLatestJSONLatest,
  pastRelease?: ClientLatestJSONLatest
): Promise<ClientLatestJSONLatest> => {
  if ('meta_version' in releaseMeta) {
    return releaseMeta as ClientLatestJSONLatest
  }

  const validatedRepository = await determineValidUrl([
    releaseMeta.repository,
    pastRelease?.repository || ''
  ])
  const validatedUpdateUrl = await determineValidUpdateUrl(
    [
      releaseMeta.updateUrl,
      pastRelease?.updateUrl || '',
      releaseMeta.repository,
      pastRelease?.repository || ''
    ],
    releaseMeta.id
  )
  let downloads = 0
  let size = releaseMeta.size || 0
  try {
    const githubStore = await storeProvider.getStore('githubStore')
    const releaseData = await githubStore.getLatestRelease(validatedRepository)

    if (releaseData) {
      const appAsset = releaseData.assets.find(
        (asset) =>
          asset.name.includes(releaseMeta.id) &&
          (asset.name.endsWith('.zip') || asset.name.endsWith('.tar.gz'))
      )

      if (appAsset) {
        downloads = appAsset.download_count || downloads
        size = appAsset.size || size
      }
    }
  } catch (error) {
    logger.warn(`Failed to fetch latest stats for ${releaseMeta.id}: ${handleError(error)}`)
  }

  return {
    meta_version: '0.11.8',
    meta_type: 'client',
    clientManifest: {
      ...pastRelease?.clientManifest,
      id: releaseMeta.id,
      name: releaseMeta.id,
      version: releaseMeta.version,
      short_name:
        releaseMeta.short_name || pastRelease?.clientManifest.short_name || releaseMeta.id,
      description: releaseMeta.description || pastRelease?.clientManifest.description || '',
      reactive: pastRelease?.clientManifest.reactive || false,
      repository: validatedRepository,
      author: releaseMeta.author || pastRelease?.clientManifest.author || '',
      compatibility: pastRelease?.clientManifest.compatibility || {
        server: '0.11.0',
        app: '0.11.8'
      },
      context: {
        id: ClientPlatformIDs.Unknown,
        name: '',
        ip: '',
        port: 0,
        method: ClientConnectionMethod.Unknown
      }
    },
    repository: validatedRepository,
    updateUrl: validatedUpdateUrl,
    size,
    createdAt: releaseMeta.createdAt || pastRelease?.createdAt || 0,
    updatedAt: releaseMeta.updatedAt || pastRelease?.updatedAt || Date.now(),
    downloads,
    icon: releaseMeta.icon || pastRelease?.icon,
    hash: releaseMeta.hash,
    hashAlgorithm: releaseMeta.hashAlgorithm
  }
}
