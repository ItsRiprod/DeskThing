/**
 * @file githubStore.ts
 * @description This file contains the GithubStore class, which is responsible for managing the github requests of the application.
 * @author Riprod
 * @version 0.9.0
 */
import { create } from 'zustand'
import { ReleaseDetails, SortedReleases, GithubRelease } from '@shared/types'

interface CacheEntry {
  timestamp: number
  data: GithubRelease[]
}

interface GithubStoreState {
  cache: Map<string, CacheEntry>
  appReleases: SortedReleases
  clientReleases: SortedReleases
  cachedRepos: string[]
  fetchReleases: (repoUrl: string) => Promise<GithubRelease[]>
  fetchAppRepo: (repoUrl: string) => Promise<void>
  fetchClientRepo: (repoUrl: string) => Promise<void>
  extractReleaseDetails: (app: string) => ReleaseDetails
}

const useGithubStore = create<GithubStoreState>((set, get) => ({
  cache: new Map(),
  appReleases: {},
  clientReleases: {},
  cachedRepos: [],

  extractReleaseDetails: (releaseName: string): ReleaseDetails => {
    const parts = releaseName.split('-')
    const appDetails = {
      name: parts[0],
      version: parts[2] + (parts[3] ? '-' + parts[3] : '')
    }
    return appDetails
  },

  fetchReleases: async (repoUrl: string): Promise<GithubRelease[]> => {
    const cache = get().cache
    const cacheEntry = cache.get(repoUrl)

    if (cacheEntry && isCacheValid(cacheEntry)) {
      console.log('Returning cached data')
      return cacheEntry.data
    }

    console.log('Fetching data from github')
    const releases = await window.electron.fetchGithub(repoUrl)

    set((state) => ({
      cache: new Map(state.cache).set(repoUrl, { timestamp: Date.now(), data: releases }),
      cachedRepos: [...state.cachedRepos, repoUrl]
    }))

    return releases
  },

  fetchClientRepo: async (repoUrl: string): Promise<void> => {
    const releases = await get().fetchReleases(repoUrl)
    // Update clientReleases with the fetched releases
    set((state) => {
      const updatedClientReleases = { ...state.clientReleases }
      releases.forEach((release) => {
        release.assets.forEach((asset) => {
          if (!asset.name.includes('-client')) return // Only include apps
          const clientDetails = get().extractReleaseDetails(asset.name)
          if (!updatedClientReleases[clientDetails.name]) {
            updatedClientReleases[clientDetails.name] = []
          }
          const assetExists = updatedClientReleases[clientDetails.name].some(
            (existingAsset) => existingAsset.updated_at === asset.updated_at
          )
          if (!assetExists) {
            updatedClientReleases[clientDetails.name].push(asset)
          }
        })
      })
      // Sort the releases by date
      Object.keys(updatedClientReleases).forEach((clientName) => {
        updatedClientReleases[clientName].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
      })
      return { clientReleases: updatedClientReleases }
    })
  },

  fetchAppRepo: async (repoUrl: string): Promise<void> => {
    const releases = await get().fetchReleases(repoUrl)

    // Update appReleases with the fetched releases
    set((state) => {
      const updatedAppReleases = { ...state.appReleases }
      releases.forEach((release) => {
        release.assets.forEach((asset) => {
          if (!asset.name.includes('-app')) return // Only include apps
          const appDetails = get().extractReleaseDetails(asset.name)
          if (!updatedAppReleases[appDetails.name]) {
            updatedAppReleases[appDetails.name] = []
          }
          const assetExists = updatedAppReleases[appDetails.name].some(
            (existingAsset) => existingAsset.id === asset.id
          )
          if (!assetExists) {
            updatedAppReleases[appDetails.name].push(asset)
          }
        })
      })
      // Sort the releases by date
      Object.keys(updatedAppReleases).forEach((appName) => {
        updatedAppReleases[appName].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
      })
      return { appReleases: updatedAppReleases }
    })
  }
}))

function isCacheValid(cacheEntry: CacheEntry): boolean {
  const currentTime = Date.now()
  const cacheTime = cacheEntry.timestamp
  const twoHours = 2 * 60 * 60 * 1000

  return currentTime - cacheTime < twoHours
}
export default useGithubStore
