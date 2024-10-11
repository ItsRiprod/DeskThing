/**
 * @file githubStore.ts
 * @description This file contains the GithubStore class, which is responsible for managing the github requests of the application.
 * @author Riprod
 * @version 0.9.0
 */
import { create } from 'zustand'
import { GithubRelease } from '@shared/types'

interface CacheEntry {
  timestamp: number
  data: GithubRelease[]
}

interface GithubStoreState {
  cache: Map<string, CacheEntry>
  fetchReleases: (repoUrl: string) => Promise<GithubRelease[]>
}

const useGithubStore = create<GithubStoreState>((set, get) => ({
  cache: new Map(),

  fetchReleases: async (repoUrl: string): Promise<GithubRelease[]> => {
    const cache = get().cache
    const cacheEntry = cache.get(repoUrl)

    if (cacheEntry && isCacheValid(cacheEntry)) {
      console.log('Returning cached data')
      return cacheEntry.data
    }

    const releases = await window.electron.fetchGithub(repoUrl)

    set((state) => ({
      cache: new Map(state.cache).set(repoUrl, { timestamp: Date.now(), data: releases })
    }))

    return releases
  }
}))

function isCacheValid(cacheEntry: CacheEntry): boolean {
  const currentTime = Date.now()
  const cacheTime = cacheEntry.timestamp
  const twoHours = 2 * 60 * 60 * 1000

  return currentTime - cacheTime < twoHours
}

export default useGithubStore
