import {
  AppLatestJSONLatest,
  AppReleaseMeta,
  AppReleaseSingleMeta,
  ClientLatestJSONLatest,
  ClientReleaseMeta,
  MultiReleaseJSONLatest
} from '@deskthing/types'
import { AppReleaseFile, AppReleaseFile0118 } from '@shared/types'

/**
 * Handles the migration of any old file to the current file
 */
export const handleReleaseJSONFileMigration = async (
  appReleases: AppReleaseFile
): Promise<AppReleaseFile0118> => {
  // Check if the AppReleaseFile version is current - return it

  // Migrate past versions of the file to 0118
  throw new Error('Not implemented yet!')
}

/**
 * Handles the migration of any release type to the latest
 * Can optionally pass an "prevRelease" that needs to use information from this new, potentially outdated releaase to update it
 * @param newRelease - the new release to be migrated
 * @param pastRelease - the past release to use to fill in missing information
 */
export const handleReleaseJSONMigration = async <
  T extends ClientLatestJSONLatest | AppLatestJSONLatest | MultiReleaseJSONLatest =
    | ClientLatestJSONLatest
    | AppLatestJSONLatest
    | MultiReleaseJSONLatest
>(
  newRelease: T | AppReleaseMeta | ClientReleaseMeta | AppReleaseSingleMeta,
  pastReleases?: T,
  appId?: string
): Promise<T> => {
  // Handle when the version is up to date

  // - Handle filling in the information
  // - Handle sanitization
  // - Ensure the URLs are all valid (download + repo urls)

  // Handle when the version is outdated

  // - Handle AppReleaseMeta -> AppLatestJSON | MultiReleaseJSON conversion
  // - Handle ClientReleaseMeta -> AppLatestJSON conversion
  // - Handle AppReleaseSingleMeta -> AppLatestJSON conversion

  // Handle when the version is from the future (try not to cry)

  throw new Error('Something went horribly wrong')
}

/**
 * Handles the migration from the potentially outdated AppReleaseMeta to the AppLatestJSONLatest
 */
export const handleReleaseMetaToAppJSONMigration = async (releaseMeta: AppReleaseMeta | AppLatestJSONLatest, pastRelease?: AppLatestJSONLatest): Promise<AppLatestJSONLatest> => {
  throw new Error('Not implemented yet!')
}

/**
 * Handles the migration from the potentially outdated AppReleaseMeta to the AppLatestJSONLatest
 */
export const handleReleaseMetaMultiToMultiJSONMigration = async (releaseMeta: AppReleaseMeta | MultiReleaseJSONLatest, pastRelease?: MultiReleaseJSONLatest): Promise<MultiReleaseJSONLatest> => {
  throw new Error('Not implemented yet!')
}

/**
 * Handles the migration from the potentially outdated AppReleaseMeta to the AppLatestJSONLatest
 */
export const handleReleaseMultiToAppJSONMigration = async (releaseMeta: AppReleaseMeta | MultiReleaseJSONLatest, pastRelease?: AppLatestJSONLatest, appId?: string): Promise<AppLatestJSONLatest> => {
  throw new Error('Not implemented yet!')
}

export const handleReleaseMetaClientToClientJSONMigration = async (releaseMeta: ClientReleaseMeta | ClientLatestJSONLatest, pastRelease?: ClientLatestJSONLatest): Promise<ClientLatestJSONLatest> => {
  throw new Error('Not implemented yet!')
}

/**
 * Handles data validation of the latest version of the release files
 * @param release - the release to validate
 * @returns the validated release
 */
export const handleLatestValidation = async <
  T extends ClientLatestJSONLatest | AppLatestJSONLatest | MultiReleaseJSONLatest =
    | ClientLatestJSONLatest
    | AppLatestJSONLatest
    | MultiReleaseJSONLatest
>(
  newRelease: T,
  pastReleases?: T,
  force?: boolean
): Promise<T> => {
  // Switch between Client, App, and Multi
  // Throw error if pastRelease and newRelease are different types
  // Handle App -> App Migration
  // Handle Client -> Client Migration
  // Handle Multi -> Multi Migration
  throw new Error('Not implemented yet!')
}

export const handleLatestAppValidation = async (
  newRelease: Partial<AppLatestJSONLatest>,
  pastReleases?: AppLatestJSONLatest,
  force?: boolean
): Promise<AppLatestJSONLatest> => {
  throw new Error('Not implemented yet!')
}

export const handleLatestClientValidation = async (
  newRelease: Partial<AppLatestJSONLatest>,
  pastReleases?: AppLatestJSONLatest,
  force?: boolean
): Promise<AppLatestJSONLatest> => {
  throw new Error('Not implemented yet!')
}

export const handleLatestMultiValidation = async (
  newRelease: Partial<AppLatestJSONLatest>,
  pastReleases?: AppLatestJSONLatest,
  force?: boolean
): Promise<AppLatestJSONLatest> => {
  throw new Error('Not implemented yet!')
}

export const 