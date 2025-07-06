import {
  AppLatestJSONLatest,
  AppManifest,
  AppReleaseMeta,
  AppReleaseSingleMeta,
  ClientConnectionMethod,
  ClientLatestJSONLatest,
  ClientManifest,
  ClientPlatformIDs,
  ClientReleaseMeta,
  GitRepoUrl,
  LOGGING_LEVELS,
  MultiReleaseJSONLatest,
  ReleaseMETAJson
} from '@deskthing/types'
import logger from '@server/utils/logger'
import {
  AppLatestServer,
  AppReleaseFile,
  AppReleaseFile0108,
  AppReleaseFile01111,
  AppReleaseFile0118,
  ClientLatestServer,
  ClientReleaseFile,
  ClientReleaseFile0108,
  ClientReleaseFile01111,
  ClientReleaseFile0118,
  GithubAsset,
  PastReleaseInfo
} from '@shared/types'
import { satisfies } from 'semver'
import {
  determineValidUpdateUrl,
  determineValidUrl,
  handleLatestMultiValidation,
  handleLatestValidation
} from './releaseValidation'
import { storeProvider } from '@server/stores/storeProvider'
import { handleError } from '@server/utils/errorHandler'
import {
  collectPastReleases,
  convertIdToReleaseServer,
  createAppReleaseFile,
  createClientReleaseFile,
  findFirstZipAsset
} from './releaseUtils'
import path from 'node:path'
import { app } from 'electron'
import { unlink, writeFile } from 'node:fs/promises'

/**
 * Handles the migration of any old file to the current file
 */
export async function handleReleaseJSONFileMigration(
  releaseFile: AppReleaseFile
): Promise<AppReleaseFile01111>
export async function handleReleaseJSONFileMigration(
  releaseFile: ClientReleaseFile
): Promise<ClientReleaseFile01111>
export async function handleReleaseJSONFileMigration(
  releaseFile: AppReleaseFile | ClientReleaseFile
): Promise<AppReleaseFile01111 | ClientReleaseFile01111> {
  // Migrating from older release files is not supported.
  if (releaseFile.version == '0.11.11') {
    // Type assertion because ts is a bit confused
    return releaseFile
  }

  if (releaseFile.version == '0.11.8') {
    // Type narrowing based on the 'type' property
    if (releaseFile.type === 'app') {
      return handleReleaseJSONFileMigration0118(releaseFile)
    } else {
      return handleReleaseJSONFileMigration0118(releaseFile)
    }
  }

  if (releaseFile.version == '0.10.0') {
    // Type narrowing based on the 'references' existence
    if ('references' in releaseFile) {
      return handleReleaseJSONFileMigration0108(releaseFile)
    } else {
      return handleReleaseJSONFileMigration0108(releaseFile)
    }
  }

  console.debug(releaseFile)
  throw new Error('Unsupported release file version!')
}

/**
 * Handles the migration of any old file to the current file
 * @param releaseFile - The release file to migrate
 * @returns The migrated release file
 */
export async function handleReleaseJSONFileMigration0118(
  releaseFile: AppReleaseFile0118
): Promise<AppReleaseFile01111>
export async function handleReleaseJSONFileMigration0118(
  releaseFile: ClientReleaseFile0118
): Promise<ClientReleaseFile01111>
export async function handleReleaseJSONFileMigration0118(
  releaseFile: AppReleaseFile0118 | ClientReleaseFile0118
): Promise<AppReleaseFile01111 | ClientReleaseFile01111> {
  // version is outdated (oops)

  const allRepositories = [
    ...releaseFile.releases.map(
      (release: AppLatestServer | ClientLatestServer) => release.mainRelease?.repository
    ),
    ...releaseFile.repositories
  ]
    .filter((repo): repo is string => Boolean(repo))
    .map((repo) => repo.toLowerCase())

  const uniqueRepositories = [...new Set(allRepositories)]

  if (releaseFile.type == 'app') {
    // This only works because the release file should ALAWYS be up to date
    const newReleaseFile = await createAppReleaseFile(true)
    newReleaseFile.repositories = uniqueRepositories
    return newReleaseFile
  } else {
    // This only works because the release file should ALAWYS be up to date
    const newReleaseFile = await createClientReleaseFile(true)
    newReleaseFile.repositories = uniqueRepositories
    return newReleaseFile
  }
}

export async function handleReleaseJSONFileMigration0108(
  releaseFile: ClientReleaseFile0108
): Promise<ClientReleaseFile01111>
export async function handleReleaseJSONFileMigration0108(
  releaseFile: AppReleaseFile0108
): Promise<AppReleaseFile01111>
export async function handleReleaseJSONFileMigration0108(
  releaseFile: AppReleaseFile0108 | ClientReleaseFile0108
): Promise<AppReleaseFile01111 | ClientReleaseFile01111> {
  // version is outdated (oops)

  const type = 'references' in releaseFile ? 'app' : 'client'

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

          // Update the URL
          const latestRelease = findFirstZipAsset(githubReleases, updatedRelease.appManifest.id)
          if (latestRelease) {
            logger.debug(
              `Updating URL for ${updatedRelease.appManifest.id} to ${latestRelease.browser_download_url}`
            )
            updatedRelease.updateUrl = latestRelease.browser_download_url
          } else {
            logger.debug(`No release found for ${updatedRelease.appManifest.id}`)
          }

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

          // Update the URL
          const latestRelease = findFirstZipAsset(githubReleases, updatedRelease.clientManifest.id)
          if (latestRelease) {
            updatedRelease.updateUrl = latestRelease.browser_download_url
          }

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
    version: '0.11.11',
    repositories: validRepositories,
    releases: filteredReleases,
    timestamp: Date.now()
  } as AppReleaseFile01111 | ClientReleaseFile01111
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
  pastRelease?: T,
  appId?: string
): Promise<T> => {
  // Handle when the version is up to date

  try {
    if ('meta_version' in newRelease) {
      if (pastRelease && newRelease.meta_type != pastRelease?.meta_type)
        throw new Error('meta_type does not match pastReleases')

      // the version is up to date
      if (satisfies(newRelease.meta_version, '=0.11.8')) return newRelease as T

      if (satisfies(newRelease.meta_version, '>=0.11.8')) {
        logger.warn(
          `Release ${newRelease.meta_type} is from the future and will be attempted to be migrated to the current version: ${newRelease.meta_version}`
        )
      }

      // automatically sanitizes the release and updates any urls as needed
      const sanitizedRelease = await handleLatestValidation(newRelease, pastRelease)

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
            pastRelease?.meta_type == 'multi' ? pastRelease : undefined
          )) as T
        case 'multi':
          if (appId) {
            return (await handleReleaseMultiToAppJSONMigration(
              newRelease,
              pastRelease?.meta_type == 'multi' || pastRelease?.meta_type == 'app'
                ? pastRelease
                : undefined,
              appId
            )) as T
          } else {
            return (await handleReleaseMultiToAppMultiMigration(
              newRelease,
              pastRelease?.meta_type == 'multi' ? pastRelease : undefined
            )) as T
          }
        case 'single':
          return (await handleReleaseMetaToAppJSONMigration(
            newRelease,
            pastRelease?.meta_type == 'app' ? pastRelease : undefined
          )) as T
      }
    } else {
      // Client Release Meta
      return (await handleReleaseMetaClientToClientJSONMigration(
        newRelease,
        pastRelease?.meta_type == 'client' ? pastRelease : undefined
      )) as T
    }

    // - Handle AppReleaseMeta -> AppLatestJSON | AppLatestJSON[] conversion depending on if there is an ID
    // - Handle ClientReleaseMeta -> AppLatestJSON conversion
    // - Handle AppReleaseSingleMeta -> AppLatestJSON conversion

    // Handle when the version is from the future (try not to cry)
  } catch (error) {
    if (pastRelease) {
      logger.error(
        `Failed to migrate release ${pastRelease?.meta_type || 'unknown'} because ${handleError(error)}`,
        {
          function: 'handleReleaseMetaToAppJSONMigration',
          source: 'migrationUtils'
        }
      )
      return pastRelease
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
        requiredVersions:
          releaseMeta.requiredVersions || pastRelease?.appManifest?.requiredVersions,
        author: releaseMeta.author,
        description: releaseMeta.description,
        label: releaseMeta.label
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

  const validatedRepoUrl = await determineValidUrl([
    releaseMeta.repository,
    pastRelease?.repository || ''
  ])

  const releases = await githubStore.getAllReleases(validatedRepoUrl)

  const latestJson: AppLatestJSONLatest[] = await Promise.all(
    releaseMeta.releases.map(async (release) => {
      const appRelease = findFirstZipAsset(releases, release.id)
      return {
        meta_version: '0.11.8',
        meta_type: 'app',
        appManifest: {
          id: release.id,
          name: release.id,
          version: release.version,
          requires: [],
          tags: release.tags || '',
          requiredVersions: release.requiredVersions || '',
          author: release.author || appRelease?.uploader.login || '',
          description: release.description || '',
          homepage: release.homepage || validatedRepoUrl || '',
          repository: validatedRepoUrl || release.repository || '',
          updateUrl:
            appRelease?.browser_download_url ||
            (await determineValidUpdateUrl(
              [
                validatedRepoUrl,
                release.updateUrl,
                release.repository,
                releaseMeta.repository,
                pastRelease?.repository || ''
              ],
              release.id
            ))
        },
        icon: release.icon,
        hash: release.hash,
        hashAlgorithm: release.hashAlgorithm,
        repository:
          validatedRepoUrl ||
          (await determineValidUrl([
            release.repository,
            releaseMeta.repository,
            pastRelease?.repository || ''
          ])),
        updateUrl:
          appRelease?.browser_download_url ||
          (await determineValidUpdateUrl(
            [
              release.updateUrl,
              release.repository,
              releaseMeta.repository,
              pastRelease?.repository || ''
            ],
            release.id
          )),
        downloads: appRelease?.download_count || release.downloads || 0,
        size: release.size || appRelease?.size || 0,
        createdAt: appRelease?.created_at
          ? new Date(appRelease.created_at).getTime()
          : release.createdAt || 0,
        updatedAt: appRelease?.updated_at
          ? new Date(appRelease.updated_at).getTime()
          : release.updatedAt || 0
      }
    })
  )

  if (appId) {
    return latestJson.filter((json) => json.appManifest.id === appId)[0]
  } else {
    return latestJson
  }
}

/**
 * Handles the migration from the potentially outdated AppReleaseMeta to the AppLatestJSONLatest
 */
export const handleReleaseMultiToAppMultiMigration = async (
  releaseMeta: AppReleaseMeta | MultiReleaseJSONLatest,
  pastRelease?: MultiReleaseJSONLatest
): Promise<MultiReleaseJSONLatest> => {
  if ('meta_version' in releaseMeta) {
    return await handleLatestMultiValidation(releaseMeta, pastRelease)
  }

  // Handle migration from appReleaseMeta to AppLatestJSON

  if (releaseMeta.type == 'single')
    throw new Error('Single type not supported in ReleaseMultitoMultiJson migration!')

  if (releaseMeta.type == 'external') {
    throw new Error(
      `Unable to handle type 'external' when migrating - this is generally a community release`
    )
  }

  const latestJson: MultiReleaseJSONLatest = {
    meta_version: '0.11.8',
    meta_type: 'multi',
    fileIds: releaseMeta.releases.map((release) => release.id),
    repository: await determineValidUrl([releaseMeta.repository])
  }
  return latestJson
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

/**
 * Handles the migration of a legacy release
 * @param repoUrl The repository URL
 * @param appId The app ID
 * @throws if there is any error. There is no recovery from this gracefully
 */
export const handleAddingLegacyRepo = async (
  repoUrl: GitRepoUrl,
  appId?: string
): Promise<AppLatestServer | ClientLatestServer> => {
  const githubStore = await storeProvider.getStore('githubStore')

  const debug = logger.createLogger(LOGGING_LEVELS.DEBUG, {
    function: 'handleAddingLegacyRepo',
    source: 'migrationUtils'
  })

  debug('Fetching all releases')
  const allReleases = await githubStore.getAllReleases(repoUrl)
  debug(`Found ${allReleases.length} releases`)
  const latestRelease = allReleases[0]

  debug(`Found ${latestRelease.assets.length} asset(s) in the latest release`)
  const zipFiles = latestRelease.assets.filter(
    (asset) =>
      asset.content_type.includes('zip') &&
      (!appId || asset.name.toLowerCase().includes(appId.toLowerCase()))
  )
  debug(`Found ${zipFiles.length} zip in the latest release`)

  const appFiles = zipFiles.filter((asset) => asset.name.toLowerCase().includes('-app'))
  const clientFiles = zipFiles.filter((asset) => asset.name.toLowerCase().includes('-client'))

  debug(
    `Found ${appFiles.length} app assets and ${clientFiles.length} client assets in the latest release`
  )

  // Splits off into recovery mode
  if (appFiles.length === 0 && clientFiles.length === 0) {
    // Full send - assuming that the zip file is one or the other - do this by downloading the zip and unzipping its file

    // This will throw if it cannot accomplish this feat
    return reconstructReleaseBasedOnZipAsset(zipFiles[0], repoUrl, appId)
  }

  // Try and find which one is "priority" in this case
  const appPriority = appFiles.length
  const clientPriority = clientFiles.length

  const type = appPriority > clientPriority ? 'app' : 'client'

  const releaseFile = type === 'app' ? appFiles[0] : clientFiles[0]

  debug(`Chose ${releaseFile} ${type} out of ${appPriority} apps and ${clientPriority} clients`)

  // now try reconstructing as much as we can about the release file

  const fileId = appId || (releaseFile.name.split('-')[0] as string)

  const pastReleases = collectPastReleases(allReleases, fileId)
  const totalDownloads = pastReleases.reduce((acc, release) => acc + release.downloads, 0)

  const latestJSON: ReleaseMETAJson = {
    repository: repoUrl,
    updateUrl: releaseFile.browser_download_url,
    downloads: releaseFile.download_count,
    size: releaseFile.size,
    updatedAt: new Date(releaseFile.updated_at).getTime(),
    createdAt: new Date(releaseFile.created_at).getTime()
  }

  const releaseServer: Partial<AppLatestServer | ClientLatestServer> = {
    id: fileId,
    type: type,
    lastUpdated: Date.now(),
    totalDownloads: totalDownloads,
    pastReleases: pastReleases
  }

  // Now try and get any additional information
  try {
    const releaseManifest = await fetchAndUnzipFileToGetManifest(releaseFile)
    if (type == 'app' && 'label' in releaseManifest) {
      const latestAppJSON: AppLatestJSONLatest = {
        ...latestJSON,
        meta_type: 'app',
        meta_version: '0.11.8',
        appManifest: releaseManifest
      }
      releaseServer.type = type
      releaseServer.mainRelease = latestAppJSON
      return releaseServer as AppLatestServer
    } else if (type == 'client' && 'name' in releaseManifest) {
      const latestAppJSON: ClientLatestJSONLatest = {
        ...latestJSON,
        meta_type: 'client',
        meta_version: '0.11.8',
        clientManifest: releaseManifest
      }
      // add the last two values
      releaseServer.type = type
      releaseServer.mainRelease = latestAppJSON
      return releaseServer as ClientLatestServer
    } else {
      throw new Error(`Failed to find the correct manifest.json. found ${releaseManifest.id}`)
    }
  } catch (error) {
    logger.warn(`(Expected Error) Error fetching and unzipping file: ${handleError(error)}`)
  }

  const author = releaseFile?.uploader?.login || latestRelease.author.login || 'Unknown'
  const version = latestRelease.tag_name || 'Unknown'

  // Now try and just brute force reconstruct the release server
  if (type == 'app') {
    // handle app creation
    const appRelease: AppLatestJSONLatest = {
      ...latestJSON,
      meta_type: 'app',
      meta_version: '0.11.8',
      appManifest: {
        id: fileId,
        label: fileId,
        requires: [],
        version: version,
        description: 'Unknown Description',
        author: author,
        platforms: [],
        tags: [],
        requiredVersions: {
          server: '0.0.0',
          client: '0.0.0'
        }
      }
    }
    releaseServer.type = type
    releaseServer.mainRelease = appRelease
    return releaseServer as AppLatestServer
  } else {
    // handle client creation
    const clientRelease: ClientLatestJSONLatest = {
      ...latestJSON,
      meta_type: 'client',
      meta_version: '0.11.8',
      clientManifest: {
        id: fileId,
        name: fileId,
        short_name: fileId,
        version: version,
        description: 'Unknown',
        author: author,
        compatibility: {
          server: '0.0.0',
          app: '0.0.0'
        },
        reactive: false,
        repository: '',
        context: {
          id: ClientPlatformIDs.Unknown,
          name: '',
          ip: '',
          port: 0,
          method: ClientConnectionMethod.Unknown
        }
      }
    }
    releaseServer.type = type
    releaseServer.mainRelease = clientRelease
    return releaseServer as ClientLatestServer
  }
}

const reconstructReleaseBasedOnZipAsset = async (
  releaseAsset: GithubAsset,
  repoUrl: GitRepoUrl,
  appId?: string
): Promise<ClientLatestServer | AppLatestServer> => {
  const debug = logger.createLogger(LOGGING_LEVELS.DEBUG, {
    function: 'reconstructReleaseBasedOnZipAsset',
    source: 'migrationUtils'
  })

  debug(
    `No app or client files found in the latest release - attempting to download and unzip file ${releaseAsset.name} to try and determine type`
  )

  let manifest: AppManifest | ClientManifest

  // Attempt to get the manifest first - fail early and save resources if possible
  try {
    manifest = await fetchAndUnzipFileToGetManifest(releaseAsset)
  } catch (error) {
    throw new Error(`Failed to unzip file ${releaseAsset.name}. ${handleError(error)}`)
  }

  let type: 'client' | 'app'

  // I believe 'name' is a good indicator of what type of manifest it is? There really isn't a good way though
  if ('name' in manifest) {
    // client
    type = 'client'
  } else {
    // app
    type = 'app'
  }

  // This should still be cached - so this wont hurt the API limit
  const githubStore = await storeProvider.getStore('githubStore')
  const allReleases = await githubStore.getAllReleases(repoUrl)

  const fileId = appId || (releaseAsset.name.split('-')[0] as string)

  const pastReleases = collectPastReleases(allReleases, fileId)
  const totalDownloads = pastReleases.reduce((acc, release) => acc + release.downloads, 0)

  const latestJSON: ReleaseMETAJson = {
    repository: repoUrl,
    updateUrl: releaseAsset.browser_download_url,
    downloads: releaseAsset.download_count,
    size: releaseAsset.size,
    updatedAt: new Date(releaseAsset.updated_at).getTime(),
    createdAt: new Date(releaseAsset.created_at).getTime()
  }

  const releaseServer: Partial<AppLatestServer | ClientLatestServer> = {
    id: fileId,
    type: type,
    lastUpdated: Date.now(),
    totalDownloads: totalDownloads,
    pastReleases: pastReleases
  }

  if (type == 'app' && 'label' in manifest) {
    const latestAppJSON: AppLatestJSONLatest = {
      ...latestJSON,
      meta_type: 'app',
      meta_version: '0.11.8',
      appManifest: manifest
    }
    releaseServer.type = type
    releaseServer.mainRelease = latestAppJSON
    return releaseServer as AppLatestServer
  } else if (type == 'client' && 'name' in manifest) {
    const latestAppJSON: ClientLatestJSONLatest = {
      ...latestJSON,
      meta_type: 'client',
      meta_version: '0.11.8',
      clientManifest: manifest
    }
    // add the last two values
    releaseServer.type = type
    releaseServer.mainRelease = latestAppJSON
    return releaseServer as ClientLatestServer
  } else {
    throw new Error(`Failed to find the correct manifest.json. found ${manifest.id}`)
  }
}

/**
 * Will throw for a lot of reasons. This will fetch and unzip and return the manifest file of the client/app in the release file
 * @param releaseFile
 */
const fetchAndUnzipFileToGetManifest = async (
  releaseFile: GithubAsset
): Promise<AppManifest | ClientManifest> => {
  const debug = logger.createLogger(LOGGING_LEVELS.DEBUG, {
    function: 'handleAddingLegacyRepo',
    source: 'migrationUtils'
  })
  const tempPath = path.join(app.getPath('temp'), `release-${Date.now()}.zip`)

  debug(`Downloading file: ${releaseFile.browser_download_url}`)
  debug(`Saving to: ${tempPath}`)

  // Download the file
  const response = await fetch(releaseFile.browser_download_url)
  const buffer = await response.arrayBuffer()
  await writeFile(tempPath, Buffer.from(buffer))

  debug(`Unzipping file: ${tempPath}`)

  try {
    // Dynamically import adm-zip
    const AdmZip = (await import('adm-zip')).default
    const zip = new AdmZip(tempPath)

    // Find and parse manifest.json
    const manifestEntry = zip
      .getEntries()
      .find((entry) => entry.entryName.endsWith('manifest.json'))
    debug(`Found manifest entry: ${manifestEntry?.entryName}`)
    if (!manifestEntry) {
      throw new Error('manifest.json not found in zip file')
    }

    const manifestContent = manifestEntry.getData().toString('utf8')
    debug(`Extracting manifest entry: ${manifestEntry.entryName}`)
    const manifest = JSON.parse(manifestContent) as AppManifest | ClientManifest

    return manifest
  } finally {
    // Cleanup temp file
    await unlink(tempPath).catch(() => {})
  }
}
