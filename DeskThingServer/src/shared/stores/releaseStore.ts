import { AppLatestJSONLatest, ClientLatestJSONLatest } from '@deskthing/types'
import { StoreInterface } from '@shared/interfaces/storeInterface'
import { AppLatestServer, ClientLatestServer } from '@shared/types'
import EventEmitter from 'node:events'

export type AssetAppCacheEntry = {
  timestamp: number
  data: AppLatestJSONLatest
}

export type AssetClientCacheEntry = {
  timestamp: number
  data: ClientLatestJSONLatest
}

export type GithubListenerEvents = {
  app: [AppLatestServer[]]
  appRepos: [string[]]
  clientRepos: [string[]]
  client: [ClientLatestServer[]]
}

/**
 * Interface representing the public methods of releaseStore
 */
export interface ReleaseStoreClass extends StoreInterface, EventEmitter<GithubListenerEvents> {
  /**
   * Clears all cached data
   */
  clearCache(): Promise<void>

  /**
   * Saves the app and client release data to files
   */
  saveToFile(): Promise<void>

  /**
   * Refreshes all GitHub data
   * @param force If true, bypasses cache validation
   * @channel - {@link ProgressChannel.REFRESH_RELEASES}
   */
  refreshData(force?: boolean): Promise<void>

  /**
   * Gets the list of community app URLs
   * @returns Promise resolving to array of app community references
   */
  getCommunityApps(): Promise<string[] | undefined>

  /**
   * Gets the list of community client URLs
   * @returns Promise resolving to array of client community references
   */
  getCommunityClients(): Promise<string[] | undefined>

  /**
   * Gets the list of app releases
   * @returns Promise resolving to array of app releases
   */
  getAppReleases(): Promise<AppLatestServer[] | undefined>

  /**
   * Gets the list of client releases
   * @returns Promise resolving to array of client releases
   */
  getClientReleases(): Promise<ClientLatestServer[] | undefined>

  /**
   * Gets a specific app release by ID
   * @param appId ID of the app to retrieve
   * @returns Promise resolving to the app release or undefined
   */
  getAppRelease(appId: string): Promise<AppLatestServer | undefined>

  /**
   * Gets a specific client release by ID
   * @param clientId ID of the client to retrieve
   * @returns Promise resolving to the client release or undefined
   */
  getClientRelease(clientId: string): Promise<ClientLatestServer | undefined>

  /**
   * Adds a new app repository
   * @param repoUrl GitHub repository URL
   * @returns Promise resolving to the added app release or undefined
   */
  addAppRepository(repoUrl: string): Promise<AppLatestServer | undefined>

  /**
   * Adds a new client repository
   * @param repoUrl GitHub repository URL
   * @returns Promise resolving to the added client release or undefined
   */
  addClientRepository(repoUrl: string): Promise<ClientLatestServer | undefined>

  /**
   * Removes an app release by repository URL
   * @param repoUrl GitHub repository URL
   */
  removeAppRelease(repoUrl: string): Promise<void>

  /**
   * Removes a client release by repository URL
   * @param repoUrl GitHub repository URL
   */
  removeClientRelease(repoUrl: string): Promise<void>

  /**
   * Downloads the latest of a specific app from the release files
   */
  downloadLatestApp(appId: string): Promise<void>

  /**
   * Downloads the latest of a specific client from the release files
   */
  downloadLatestClient(clientId: string): Promise<void>
}
