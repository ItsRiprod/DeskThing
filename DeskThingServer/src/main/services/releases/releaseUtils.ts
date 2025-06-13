/**
 * Top-level functions for doing simple IO and business-layer operations on release files
 */
import {
  AppLatestServer,
  AppReleaseFile,
  AppReleaseFile0118,
  ClientLatestServer,
  ClientReleaseFile,
  ClientReleaseFile0118,
  GithubAsset,
  GithubRelease,
  PastReleaseInfo,
  ProgressChannel,
  RefreshOptions
} from '@shared/types'
import { progressBus } from '../events/progressBus'
import { storeProvider } from '@server/stores/storeProvider'
import logger from '@server/utils/logger'
import {
  AppLatestJSONLatest,
  AppReleaseMeta,
  ClientLatestJSONLatest,
  GitRepoUrl,
  MultiReleaseJSONLatest
} from '@deskthing/types'
import { handleError } from '@server/utils/errorHandler'
import {
  handleAddingLegacyRepo,
  handleReleaseJSONFileMigration,
  handleReleaseJSONMigration
} from './migrationUtils'
import { determineValidUrl } from './releaseValidation'

/** Handles the creation of the release file */
export async function createReleaseFile(type: 'app', force?: boolean): Promise<AppReleaseFile0118>
export async function createReleaseFile(
  type: 'client',
  force?: boolean
): Promise<ClientReleaseFile0118>
export async function createReleaseFile(
  type: 'client' | 'app',
  force = false
): Promise<AppReleaseFile0118 | ClientReleaseFile0118> {
  if (type === 'app') {
    return createAppReleaseFile(force)
  } else {
    return createClientReleaseFile(force)
  }
}

const createClientReleaseFile = async (force = false): Promise<ClientReleaseFile0118> => {
  const { clientRepo, defaultClientLatestJSONFallback } = await import(
    '@server/static/releaseMetadata'
  )
  try {
    progressBus.startOperation(
      ProgressChannel.FN_RELEASE_CLIENT_REFRESH,
      'Creating Client Releases File',
      'Initializing Refresh'
    )
    const githubStore = await storeProvider.getStore('githubStore')

    progressBus.update(
      ProgressChannel.FN_RELEASE_CLIENT_REFRESH,
      `Fetching latest release from ${clientRepo}`,
      20
    )
    logger.debug(`Fetching latest release from ${clientRepo}`)
    const latestReleaseAssets = await githubStore.getLatestRelease(clientRepo, force)

    if (!latestReleaseAssets) {
      throw new Error('Unable to find latest release assets')
    }

    progressBus.update(
      ProgressChannel.FN_RELEASE_CLIENT_REFRESH,
      'Searching for latest.json asset',
      30
    )
    const latestReleaseJsonAsset = latestReleaseAssets.assets.find(
      (asset) => asset.name == 'latest.json'
    )

    if (!latestReleaseJsonAsset) {
      throw new Error('Unable to find latest.json asset in releases')
    }

    progressBus.update(
      ProgressChannel.FN_RELEASE_CLIENT_REFRESH,
      'Fetching latest.json content',
      40
    )
    const latestJSON = await githubStore.fetchJSONAssetContent<
      ClientLatestJSONLatest | MultiReleaseJSONLatest | AppLatestJSONLatest
    >(latestReleaseJsonAsset)

    if (!latestJSON) {
      throw new Error('Unable to fetch latest.json')
    }

    // Migration - as it could either be a Multi or a Client or an App

    const adaptedRelease = await handleReleaseJSONMigration(latestJSON)

    if (adaptedRelease.meta_type == 'app')
      throw new Error(`Received meta type 'app' when expecting Multi or Client`)

    if (adaptedRelease.meta_type == 'multi') {
      const result = await convertMultiToReleaseServer(adaptedRelease)

      if (result.type == 'converted-repos')
        return {
          version: '0.11.8',
          type: 'client',
          repositories: result.repos,
          releases: [],
          timestamp: Date.now()
        }

      if (result.type == 'converted-apps')
        throw new Error('Received "app" type when expecting multi or client')

      const clientReleaseFile: ClientReleaseFile0118 = {
        version: '0.11.8',
        type: 'client',
        repositories: result.repos,
        releases: result.releases,
        timestamp: Date.now()
      }

      return clientReleaseFile
    }

    const latestServer: ClientLatestServer = {
      id: adaptedRelease.clientManifest.id,
      type: 'client',
      mainRelease: adaptedRelease,
      lastUpdated: Date.now(),
      totalDownloads: 0,
      pastReleases: []
    }

    const finalClientReleaseFile: ClientReleaseFile0118 = {
      version: '0.11.8',
      type: 'client',
      repositories: adaptedRelease.repository ? [latestJSON.repository] : [],
      releases: [latestServer],
      timestamp: Date.now()
    }

    return finalClientReleaseFile
  } catch (error) {
    progressBus.error(
      ProgressChannel.FN_RELEASE_CLIENT_REFRESH,
      'Unable to create client release file',
      handleError(error)
    )
    return defaultClientLatestJSONFallback
  }
}

const createAppReleaseFile = async (force = false): Promise<AppReleaseFile0118> => {
  const { appsRepo, defaultAppLatestJSONFallback } = await import('@server/static/releaseMetadata')
  try {
    progressBus.startOperation(
      ProgressChannel.FN_RELEASE_APP_REFRESH,
      'Creating App Releases File',
      'Initializing Refresh'
    )
    const githubStore = await storeProvider.getStore('githubStore')

    progressBus.update(
      ProgressChannel.FN_RELEASE_APP_REFRESH,
      `Fetching latest release from ${appsRepo}`,
      20
    )
    logger.debug(`Fetching latest release from ${appsRepo}`)
    const latestReleaseAssets = await githubStore.getLatestRelease(appsRepo, force)

    if (!latestReleaseAssets) {
      throw new Error('Unable to find latest release assets')
    }

    progressBus.update(
      ProgressChannel.FN_RELEASE_APP_REFRESH,
      'Searching for latest.json asset',
      30
    )
    const latestReleaseJsonAsset = latestReleaseAssets.assets.find(
      (asset) => asset.name == 'latest.json'
    )

    if (!latestReleaseJsonAsset) {
      throw new Error('Unable to find latest.json asset in releases')
    }

    progressBus.update(ProgressChannel.FN_RELEASE_APP_REFRESH, 'Fetching latest.json content', 40)
    const latestJSON = await githubStore.fetchJSONAssetContent<
      ClientLatestJSONLatest | MultiReleaseJSONLatest | AppLatestJSONLatest
    >(latestReleaseJsonAsset)

    if (!latestJSON) {
      throw new Error('Unable to fetch latest.json')
    }

    progressBus.update(ProgressChannel.FN_RELEASE_APP_REFRESH, 'Validating latest.json content', 50)
    const adaptedRelease = await handleReleaseJSONMigration(latestJSON)

    if (adaptedRelease.meta_type == 'client')
      throw new Error(`Received meta type 'app' when expecting Multi or Client`)

    if (adaptedRelease.meta_type == 'multi') {
      progressBus.update(
        ProgressChannel.FN_RELEASE_APP_REFRESH,
        'Converting multi-release to release server format',
        60
      )
      const result = await convertMultiToReleaseServer(adaptedRelease)

      if (result.type == 'converted-repos') {
        progressBus.update(
          ProgressChannel.FN_RELEASE_APP_REFRESH,
          'Creating empty release file',
          80
        )
        return {
          version: '0.11.8',
          type: 'app',
          repositories: result.repos,
          releases: [],
          timestamp: Date.now()
        }
      }

      if (result.type == 'converted-clients')
        throw new Error('Received "client" type when expecting multi or client')

      progressBus.update(
        ProgressChannel.FN_RELEASE_APP_REFRESH,
        'Creating app release file from multi-release',
        90
      )
      const appReleaseFile: AppReleaseFile0118 = {
        version: '0.11.8',
        type: 'app',
        repositories: result.repos,
        releases: result.releases,
        timestamp: Date.now()
      }

      return appReleaseFile
    }

    progressBus.update(
      ProgressChannel.FN_RELEASE_APP_REFRESH,
      'Creating app server configuration',
      70
    )
    const latestServer: AppLatestServer = {
      id: adaptedRelease.appManifest.id,
      type: 'app',
      mainRelease: adaptedRelease,
      lastUpdated: Date.now(),
      totalDownloads: 0,
      pastReleases: []
    }

    progressBus.update(ProgressChannel.FN_RELEASE_APP_REFRESH, 'Finalizing app release file', 90)
    const finalAppReleaseFile: AppReleaseFile0118 = {
      version: '0.11.8',
      type: 'app',
      repositories: adaptedRelease.repository ? [latestJSON.repository] : [],
      releases: [latestServer],
      timestamp: Date.now()
    }

    progressBus.complete(
      ProgressChannel.FN_RELEASE_APP_REFRESH,
      'Successfully created app release file'
    )

    return finalAppReleaseFile
  } catch (error) {
    progressBus.error(
      ProgressChannel.FN_RELEASE_APP_REFRESH,
      'Unable to create app release file',
      handleError(error)
    )
    return defaultAppLatestJSONFallback
  }
}

/**
 * From a URL - it returns all of the apps at the end of that url as well as updated if needed
 * @param url
 * @param appId - if you want a specific app ID instead of just whatever is found
 * @throws an error if the repo is wrong
 */
export const addRepositoryUrl = async (
  repoUrl: string,
  appId?: string
): Promise<AppLatestServer | ClientLatestServer | ConversionReturnData> => {
  try {
    const updateProgress = progressBus.start(
      ProgressChannel.FN_RELEASE_ADD_REPO,
      `Adding Repository${appId ? ` for ${appId}` : ''}`,
      `Adding ${repoUrl}`
    )

    const validatedUrl = await determineValidUrl([repoUrl])

    const githubStore = await storeProvider.getStore('githubStore')

    updateProgress(`Getting GitHub Releases for ${repoUrl}`, 10)

    const githubReleases = await githubStore.getAllReleases(validatedUrl)

    const latestGithubRelease = githubReleases[0]

    const latestJson = findJsonAsset(latestGithubRelease, appId || 'latest')

    // Handle the recovery with the file
    if (!latestJson) {
      updateProgress(`Release JSON not found! Attemting to migrate`, 75)
      const releaseServer = await handleAddingLegacyRepo(validatedUrl, appId)
      progressBus.complete(
        ProgressChannel.FN_RELEASE_ADD_REPO,
        `Found ${releaseServer.id} in releases`
      )
      return releaseServer
    }

    updateProgress(`Found ${latestJson.label} in releases`, 50)
    updateProgress('Fetching JSON content', 60)
    const jsonContent = await githubStore.fetchJSONAssetContent<
      AppLatestJSONLatest | ClientLatestJSONLatest | MultiReleaseJSONLatest | AppReleaseMeta
    >(latestJson)

    if (!jsonContent) {
      throw new Error('Unable to fetch JSON content from release asset')
    }

    updateProgress('Migrating and validating JSON content', 70)

    // Handle migration to latest version
    const migratedRelease = await handleReleaseJSONMigration(jsonContent, undefined, appId)

    updateProgress('Processing migrated release', 80)

    // Handle different meta types
    if (migratedRelease.meta_type === 'multi') {
      updateProgress('Converting multi-release to server format', 85)
      const conversionResult = await convertMultiToReleaseServer(migratedRelease)

      progressBus.complete(
        ProgressChannel.FN_RELEASE_ADD_REPO,
        `Successfully processed multi-release with ${conversionResult.releases.length} items`
      )
      return conversionResult
    }

    if (migratedRelease.meta_type === 'app') {
      updateProgress('Creating app server configuration', 85)

      // Collect past releases for statistics
      const pastReleases = collectPastReleases(githubReleases, migratedRelease.appManifest.id)
      const totalDownloads = pastReleases.reduce((sum, release) => sum + release.downloads, 0)

      const appServer: AppLatestServer = {
        id: migratedRelease.appManifest.id,
        type: 'app',
        mainRelease: migratedRelease,
        lastUpdated: Date.now(),
        totalDownloads,
        pastReleases
      }

      progressBus.complete(
        ProgressChannel.FN_RELEASE_ADD_REPO,
        `Successfully added app: ${appServer.id}`
      )
      return appServer
    }

    if (migratedRelease.meta_type === 'client') {
      updateProgress('Creating client server configuration', 85)

      // Collect past releases for statistics
      const pastReleases = collectPastReleases(githubReleases, migratedRelease.clientManifest.id)
      const totalDownloads = pastReleases.reduce((sum, release) => sum + release.downloads, 0)

      const clientServer: ClientLatestServer = {
        id: migratedRelease.clientManifest.id,
        type: 'client',
        mainRelease: migratedRelease,
        lastUpdated: Date.now(),
        totalDownloads,
        pastReleases
      }

      progressBus.complete(
        ProgressChannel.FN_RELEASE_ADD_REPO,
        `Successfully added client: ${clientServer.id}`
      )
      return clientServer
    }

    throw new Error(`Unsupported meta_type: ${(migratedRelease as AppLatestJSONLatest).meta_type}`)
  } catch (error) {
    progressBus.error(
      ProgressChannel.FN_RELEASE_ADD_REPO,
      'Unable to add repository',
      handleError(error)
    )
    throw error
  }
}

/**
 * Goes through and updates all of the apps with the latest from github and also updates the available repositories from and multis
 */
export async function handleRefreshReleaseFile(
  type: 'app',
  prevReleaseFile: AppReleaseFile,
  params: RefreshOptions
): Promise<AppReleaseFile0118>
export async function handleRefreshReleaseFile(
  type: 'client',
  prevReleaseFile: ClientReleaseFile,
  params: RefreshOptions
): Promise<ClientReleaseFile0118>
export async function handleRefreshReleaseFile<T extends 'app' | 'client'>(
  type: T,
  prevReleaseFile: T extends 'app' ? AppReleaseFile : ClientReleaseFile,
  { force = false }: RefreshOptions
): Promise<AppReleaseFile0118 | ClientReleaseFile0118 | ClientReleaseFile | AppReleaseFile> {
  try {
    // migrate to 0.11.8
    const releaseFile = await handleReleaseJSONFileMigration(type, prevReleaseFile)

    // Handle migrating any old releases to the latest
    const migratedReleases = await Promise.all(
      releaseFile.releases.map((release: ClientLatestServer | AppLatestServer) =>
        updateLatestServer(release, force)
      )
    )

    if (type == 'app') {
      const finalReleaseFile: AppReleaseFile0118 = {
        version: '0.11.8',
        type: 'app',
        repositories: releaseFile.repositories,
        releases: migratedReleases as AppLatestServer[],
        timestamp: Date.now()
      }

      return finalReleaseFile
    } else {
      const finalReleaseFile: ClientReleaseFile0118 = {
        version: '0.11.8',
        type: 'client',
        repositories: releaseFile.repositories,
        releases: migratedReleases as ClientLatestServer[],
        timestamp: Date.now()
      }

      return finalReleaseFile
    }
  } catch (error) {
    logger.warn(`Unable to migrate ${type} release file because: ${handleError(error)}`, {
      function: 'handleRefreshReleaseFile'
    })

    return prevReleaseFile
  }
}

/**
 * Updates the release file to the latest version
 * @param releaseLatest - the release file to update
 * @returns the updated release file
 */
export const updateLatestServer = async <T extends AppLatestServer | ClientLatestServer>(
  releaseLatest: T,
  force = false
): Promise<T> => {
  // Handle iterating through all of the releases to generate
  try {
    logger.debug(`Updating release for ${releaseLatest.id}`, {
      function: 'updateReleaseFile'
    })
    const githubStore = await storeProvider.getStore('githubStore')

    const allReleases = await githubStore.getAllReleases(
      releaseLatest.mainRelease.repository,
      force
    )

    // Find the first release
    const firstReleaseAsset =
      findFirstJsonAsset(allReleases, releaseLatest.id) ||
      findJsonAsset(allReleases[0], releaseLatest.id, false)

    // Fetch the JSON
    const releaseJSON = firstReleaseAsset
      ? await githubStore.fetchJSONAssetContent<
          AppReleaseMeta | AppLatestJSONLatest | ClientLatestJSONLatest | MultiReleaseJSONLatest
        >(firstReleaseAsset)
      : undefined

    if (!releaseJSON) {
      logger.debug(`Handling release for ${releaseLatest.id}`)
      const releaseServer = await handleAddingLegacyRepo(
        releaseLatest.mainRelease.repository,
        releaseLatest.id
      )
      return releaseServer as T
    }

    // Handle migrating any old releases to the latest
    const migratedRelease = await handleReleaseJSONMigration(
      releaseJSON,
      releaseLatest.mainRelease,
      releaseLatest.id
    )

    if (migratedRelease.meta_type == 'multi') {
      throw new Error(
        `Error with file! Incoming type '${migratedRelease.meta_type}' does not equal expected '${releaseLatest.type}' type`
      )
    }

    if (migratedRelease.meta_type != releaseLatest.type)
      throw new Error(
        `Type Mismatch! Incoming type '${migratedRelease.meta_type}' does not equal expected '${releaseLatest.type}' type`
      )

    // Get the past releases
    const pastReleases = collectPastReleases(allReleases, releaseLatest.id)

    const totalDownloads = pastReleases.reduce((sum, release) => sum + release.downloads, 0)

    // Update the download count
    migratedRelease.downloads = firstReleaseAsset?.download_count || 0

    // return the updated server

    return {
      id: releaseLatest.id,
      type: releaseLatest.type,
      mainRelease: migratedRelease,
      lastUpdated: Date.now(),
      totalDownloads: totalDownloads,
      pastReleases: pastReleases
    } as T
  } catch (error) {
    logger.warn(
      `Failed to update ${releaseLatest.id} because ${handleError(error)}. Reverting back to old version.`,
      {
        function: 'convertMultiToReleaseServer'
      }
    )

    return releaseLatest
  }
}

const findJsonAsset = (
  release: GithubRelease,
  appId: string,
  strict = false
): GithubAsset | undefined => {
  // Priority: appId.json > latest.json
  const appIdJson = release.assets.find((asset) => asset.name === `${appId}.json`)
  if (appIdJson) return appIdJson

  if (strict) return // return early if strict is enabled

  const latestJson = release.assets.find((asset) => asset.name === 'latest.json')
  return latestJson
}

const findZipAsset = (release: GithubRelease, appId: string): GithubAsset | undefined => {
  return release.assets.find(
    (asset) =>
      asset.name.includes(appId) && (asset.name.endsWith('.zip') || asset.name.endsWith('.tar.gz'))
  )
}

type ConversionReturnData =
  | { repos: string[]; type: 'converted-clients'; releases: ClientLatestServer[] }
  | { repos: string[]; type: 'converted-apps'; releases: AppLatestServer[] }
  | { repos: string[]; type: 'converted-repos'; releases: [] }

export const convertMultiToReleaseServer = async (
  releaseMulti: MultiReleaseJSONLatest
): Promise<ConversionReturnData> => {
  // Handle iterating through all of the releases to generate
  const githubStore = await storeProvider.getStore('githubStore')

  const ghReleases = await githubStore.getAllReleases(releaseMulti.repository)

  if (!ghReleases) throw new Error(`Releases at the end of ${releaseMulti.repository} were empty!`)

  if (releaseMulti.fileIds && releaseMulti.fileIds.length > 0) {
    // Convert all of the IDs to releases
    const results = await Promise.allSettled(
      releaseMulti.fileIds?.map(async (fileId) =>
        convertIdToReleaseServer(fileId, releaseMulti.repository, ghReleases)
      ) ?? []
    )

    // Get the successful results
    const apps = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value) as AppLatestServer[] | ClientLatestServer[]

    // Handle logging the errors
    results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .forEach((result, index) => {
        const fileId = releaseMulti.fileIds?.[index]
        logger.warn(
          `Unable to convert ${fileId} to a full release using ${releaseMulti.repository} because ${handleError(result.reason)}`,
          { function: 'releaseUtils', source: 'convertIdToReleaseServer' }
        )
      })

    const type = apps[0].type

    return {
      repos: releaseMulti.repositories || [],
      type: `converted-${type}s`,
      releases: apps
    } as ConversionReturnData
  }

  return {
    repos: releaseMulti.repositories || [],
    type: 'converted-repos',
    releases: []
  }
}

const findFirstJsonAsset = (
  ghReleases: GithubRelease[],
  appId: string
): GithubAsset | undefined => {
  for (const release of ghReleases) {
    const jsonAsset = findJsonAsset(release, appId, true)
    if (jsonAsset) {
      return jsonAsset
    }
  }
  return undefined
}

export const convertIdToReleaseServer = async (
  appId: string,
  repository: GitRepoUrl,
  ghReleases?: GithubRelease[]
): Promise<ClientLatestServer | AppLatestServer> => {
  const githubStore = await storeProvider.getStore('githubStore')

  if (!ghReleases) {
    ghReleases = await githubStore.getAllReleases(repository)
  }

  if (!ghReleases) throw new Error('No releases found')

  // Find first release containing the app ID

  const firstJsonAsset = findFirstJsonAsset(ghReleases, appId)

  let mainRelease: AppLatestJSONLatest | ClientLatestJSONLatest | MultiReleaseJSONLatest

  // This will split the logic between migration logic and up-to-date logic

  if (!firstJsonAsset && ghReleases.length > 0) {
    // Handle the migration attempt - this is relatively likely to fail but an attempt is worth more than nothing

    // check if the latest.json in the most recent release has it
    const latestJson = findJsonAsset(ghReleases[0], appId, false)

    // Assume it is outdated and is just the appReleaseMeta
    const jsonContent = await githubStore.fetchJSONAssetContent<AppReleaseMeta>(latestJson)

    if (!jsonContent) throw new Error(`No release found containing app ID: ${appId}`)

    // Finally assign mainRelease
    mainRelease = await handleReleaseJSONMigration(jsonContent, undefined, appId)
  } else {
    if (!firstJsonAsset) {
      throw new Error(`No release found containing app ID: ${appId}`)
    }

    // We are relatively confident that this jsonAsset is up-to-date because it is name.json and not latest.json - which is the newer way of doing it

    // Download and parse the JSON content
    const preMainRelease = await githubStore.fetchJSONAssetContent<
      AppLatestJSONLatest | ClientLatestJSONLatest | MultiReleaseJSONLatest
    >(firstJsonAsset)

    if (!preMainRelease) throw new Error(`No release found containing app ID: ${appId}`)

    // Finally assign mainRelease - this will migrate it as well if need be
    mainRelease = await handleReleaseJSONMigration(preMainRelease)
  }

  if (mainRelease.meta_type == 'multi') throw new Error('Unable to hande meta_type equaling multi')

  // Collect past releases
  const pastReleases: PastReleaseInfo[] = collectPastReleases(ghReleases, appId)

  // Calculate total downloads
  const totalDownloads = pastReleases.reduce((sum, release) => sum + release.downloads, 0)

  // This is the way it must be done for type-safety despite the fact that it is the same as just a single return - oh well
  if (mainRelease.meta_type === 'app') {
    return {
      type: mainRelease.meta_type,
      id: appId,
      mainRelease: mainRelease,
      lastUpdated: Date.now(),
      totalDownloads: totalDownloads,
      pastReleases: pastReleases
    }
  } else {
    return {
      type: mainRelease.meta_type,
      id: appId,
      mainRelease: mainRelease,
      lastUpdated: Date.now(),
      totalDownloads: totalDownloads,
      pastReleases: pastReleases
    }
  }
}

export const collectPastReleases = (
  ghReleases: GithubRelease[],
  appId: string
): PastReleaseInfo[] => {
  return ghReleases.flatMap((release) => {
    const zipAsset = findZipAsset(release, appId)
    if (!zipAsset) return []

    return [
      {
        tag: release.tag_name,
        downloads: zipAsset.download_count,
        size: zipAsset.size,
        name: zipAsset.name,
        download_url: zipAsset.browser_download_url,
        created_at: release.created_at
      }
    ]
  })
}
