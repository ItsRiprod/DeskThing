import { StoreInterface } from '@shared/interfaces/storeInterface'
import { GithubAsset, GithubRelease } from '@shared/types'

export interface GithubStoreClass extends StoreInterface {
  getLatestRelease(repoUrl: string, force?: boolean): Promise<GithubRelease | undefined>
  getAllReleases(repoUrl: string, force?: boolean): Promise<GithubRelease[]>
  checkUrlValidity(url: string): Promise<boolean>
  fetchJSONAssetContent<T extends object>(asset: GithubAsset | undefined): Promise<T | undefined>
  clearCache(): Promise<void>
  saveToFile(): Promise<void>
}