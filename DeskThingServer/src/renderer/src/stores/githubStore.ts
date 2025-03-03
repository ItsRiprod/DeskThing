/**
 * @file githubStore.ts
 * @description This file contains the GithubStore class, which is responsible for managing the github requests of the application.
 * @author Riprod
 * @version 0.10.4
 */
import { create } from 'zustand'
import { AppReleaseCommunity, AppReleaseMeta, ClientReleaseMeta } from '@DeskThing/types'

interface GithubStoreState {
  appReleases: AppReleaseMeta[]
  communityApps: AppReleaseCommunity[]
  clientReleases: ClientReleaseMeta[]
  refreshApp: (repoUrl: string) => Promise<void>
  refreshData: () => Promise<void>
  getApps: () => Promise<AppReleaseMeta[]>
  getAppReferences: () => Promise<AppReleaseCommunity[]>
  addAppRepo: (repoUrl: string) => Promise<AppReleaseMeta>
  removeAppRepo: (repoUrl: string) => Promise<void>
  getClients: () => Promise<ClientReleaseMeta[]>
  setAppReleases: (releases: AppReleaseMeta[]) => void
  setClientReleases: (releases: ClientReleaseMeta[]) => void
  setCommunityApps: (apps: AppReleaseCommunity[]) => void
}

const useGithubStore = create<GithubStoreState>(
  (set): GithubStoreState => ({
    appReleases: [],
    clientReleases: [],
    communityApps: [],
    refreshApp: async (repoUrl: string): Promise<void> => {
      await window.electron.github.refreshApp(repoUrl)
    },
    refreshData: async (): Promise<void> => {
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
    getClients: async (): Promise<ClientReleaseMeta[]> => {
      const clients = await window.electron.github.getClients()
      set({ clientReleases: clients })
      return clients
    },
    setAppReleases: (releases: AppReleaseMeta[]): void => {
      set({ appReleases: releases })
    },
    setClientReleases: (releases: ClientReleaseMeta[]): void => {
      set({ clientReleases: releases })
    },
    setCommunityApps: (apps: AppReleaseCommunity[]): void => {
      set({ communityApps: apps })
    }
  })
)

export default useGithubStore
