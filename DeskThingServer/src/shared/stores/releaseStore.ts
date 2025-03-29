import {
  AppReleaseMeta,
  ClientReleaseMeta,
  AppReleaseCommunity,
  AppReleaseSingleMeta
} from '@deskthing/types'
import { GithubRelease } from '../types/types'
import { StoreInterface } from '@shared/interfaces/storeInterface'

export type CacheEntry = {
  timestamp: number
  data: GithubRelease[] | Promise<GithubRelease[]>
  isError?: boolean
}

export type AssetAppCacheEntry = {
  timestamp: number
  data: AppReleaseMeta
}

export type AssetClientCacheEntry = {
  timestamp: number
  data: ClientReleaseMeta
}

export type GithubListenerEvents = {
  app: AppReleaseMeta[]
  community: AppReleaseCommunity[]
  client: ClientReleaseMeta[]
}

// Create listener types automatically from event map
export type Listener<T> = (payload: T) => void
export type releaseStoreListener<K extends keyof GithubListenerEvents> = Listener<
  GithubListenerEvents[K]
>

// Create listeners collection type automatically
export type releaseStoreListeners = {
  [K in keyof GithubListenerEvents]: releaseStoreListener<K>[]
}

/**
 * Interface representing the public methods of releaseStore
 */
export interface releaseStoreClass extends StoreInterface {
  /**
   * Clears all cached data
   */
  clearCache(): Promise<void>

  /**
   * Saves the app and client release data to files
   */
  saveToFile(): Promise<void>

  /**
   * Registers an event listener
   * @param type Event type to listen for
   * @param listener Function to call when event occurs
   * @returns Function to unregister the listener
   */
  on<K extends keyof GithubListenerEvents>(type: K, listener: releaseStoreListener<K>): () => void

  /**
   * Unregisters an event listener
   * @param type Event type to stop listening for
   * @param listener Function to remove
   */
  off<K extends keyof GithubListenerEvents>(type: K, listener: releaseStoreListener<K>): void

  /**
   * Refreshes all GitHub data
   * @param force If true, bypasses cache validation
   */
  refreshData(force?: boolean): Promise<void>

  /**
   * Gets the list of community app references
   * @returns Promise resolving to array of app community references
   */
  getAppReferences(): Promise<AppReleaseCommunity[] | undefined>

  /**
   * Gets the list of app releases
   * @returns Promise resolving to array of app releases
   */
  getAppReleases(): Promise<AppReleaseMeta[] | undefined>

  /**
   * Gets a specific app release by ID
   * @param appId ID of the app to retrieve
   * @returns Promise resolving to the app release or undefined
   */
  getAppRelease(appId: string): Promise<(AppReleaseSingleMeta & { type?: string }) | undefined>

  /**
   * Adds a new app repository
   * @param repoUrl GitHub repository URL
   * @returns Promise resolving to the added app release or undefined
   */
  addAppRepository(repoUrl: string): Promise<AppReleaseMeta | undefined>

  /**
   * Removes an app release by repository URL
   * @param repoUrl GitHub repository URL
   */
  removeAppRelease(repoUrl: string): Promise<void>

  /**
   * Gets the list of client releases
   * @returns Promise resolving to array of client releases
   */
  getClientReleases(): Promise<ClientReleaseMeta[] | undefined>
}
