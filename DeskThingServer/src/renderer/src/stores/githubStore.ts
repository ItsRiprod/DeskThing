/**
 * @file githubStore.ts
 * @description This file contains the GithubStore class, which is responsible for managing the github requests of the application.
 * @author Riprod
 * @version 0.10.4
 */
import { create } from 'zustand'
import { SortedReleases } from '@shared/types'
import { AppReleaseCommunity, AppReleaseMeta } from '@DeskThing/types'

interface GithubStoreState {
  appReleases: AppReleaseMeta[]
  communityApps: AppReleaseCommunity[]
  clientReleases: SortedReleases
  refreshApp: (repoUrl: string) => Promise<void>
  refreshApps: () => Promise<void>
  getApps: () => Promise<AppReleaseMeta[]>
  getAppReferences: () => Promise<AppReleaseCommunity[]>
  addAppRepo: (repoUrl: string) => Promise<AppReleaseMeta>
  removeAppRepo: (repoUrl: string) => Promise<void>
  getClients: () => Promise<SortedReleases>
  setAppReleases: (releases: AppReleaseMeta[]) => void
  setClientReleases: (releases: SortedReleases) => void
  setCommunityApps: (apps: AppReleaseCommunity[]) => void
}

const useGithubStore = create<GithubStoreState>(
  (set): GithubStoreState => ({
    appReleases: [],
    clientReleases: {},
    communityApps: [],
    refreshApp: async (repoUrl: string): Promise<void> => {
      await window.electron.github.refreshApp(repoUrl)
    },
    refreshApps: async (): Promise<void> => {
      await window.electron.github.refreshApps()
    },
    getApps: async (): Promise<AppReleaseMeta[]> => {
      const apps = await window.electron.github.getApps()
      set({ appReleases: apps })
      return apps
    },
    getAppReferences: async (): Promise<AppReleaseCommunity[]> => {
      const references = await window.electron.github.getAppReferences()
      set({ communityApps: references })
      return references
    },
    addAppRepo: async (repoUrl: string): Promise<AppReleaseMeta> => {
      const app = await window.electron.github.addAppRepo(repoUrl)
      return app
    },
    removeAppRepo: async (repoUrl: string): Promise<void> => {
      await window.electron.github.removeAppRepo(repoUrl)
    },
    getClients: async (): Promise<SortedReleases> => {
      const clients = await window.electron.github.getClients()
      set({ clientReleases: clients })
      return clients
    },
    setAppReleases: (releases: AppReleaseMeta[]): void => {
      set({ appReleases: releases })
    },
    setClientReleases: (releases: SortedReleases): void => {
      set({ clientReleases: releases })
    },
    setCommunityApps: (apps: AppReleaseCommunity[]): void => {
      set({ communityApps: apps })
    }
  })
)

export default useGithubStore
