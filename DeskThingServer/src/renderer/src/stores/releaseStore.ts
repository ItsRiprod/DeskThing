/**
 * @file releaseStore.ts
 * @description This file contains the releaseStore class, which is responsible for managing the github requests of the application.
 * @author Riprod
 * @version 0.10.4
 */
import { create } from 'zustand'
import { AppReleaseCommunity, AppReleaseMeta, ClientReleaseMeta } from '@DeskThing/types'
import { IpcRendererCallback } from '@shared/types'

interface releaseStoreState {
  appReleases: AppReleaseMeta[]
  communityApps: AppReleaseCommunity[]
  clientReleases: ClientReleaseMeta[]
  initialized: boolean

  initialize: () => Promise<void>
  refreshApp: (repoUrl: string) => Promise<void>
  refreshData: () => Promise<void>
  getApps: () => Promise<AppReleaseMeta[]>
  getAppReferences: () => Promise<AppReleaseCommunity[]>
  addAppRepo: (repoUrl: string) => Promise<AppReleaseMeta | void>
  removeAppRepo: (repoUrl: string) => Promise<void>
  getClients: () => Promise<ClientReleaseMeta[]>
  setAppReleases: (releases: AppReleaseMeta[]) => void
  setClientReleases: (releases: ClientReleaseMeta[]) => void
  setCommunityApps: (apps: AppReleaseCommunity[]) => void
}

const useReleaseStore = create<releaseStoreState>((set, get) => ({
  appReleases: [],
  clientReleases: [],
  communityApps: [],
  initialized: false,

  initialize: async () => {
    if (get().initialized) return

    const handleAppsUpdate: IpcRendererCallback<'github-apps'> = (_event, data) => {
      set({ appReleases: Array.isArray(data) ? data : [data] })
    }

    const handleCommunityUpdate: IpcRendererCallback<'github-community'> = (_event, data) => {
      set({ communityApps: data })
    }

    const handleClientUpdate: IpcRendererCallback<'github-client'> = (_event, data) => {
      set({ clientReleases: data })
    }

    window.electron.ipcRenderer.on('github-apps', handleAppsUpdate)
    window.electron.ipcRenderer.on('github-community', handleCommunityUpdate)
    window.electron.ipcRenderer.on('github-client', handleClientUpdate)

    const clients = await window.electron.releases.getClients()
    const refs = await window.electron.releases.getAppReferences()
    const apps = await window.electron.releases.getApps()

    set({
      clientReleases: clients,
      communityApps: refs,
      appReleases: Array.isArray(apps) ? apps : [apps],
      initialized: true
    })
  },

  refreshApp: async (repoUrl: string): Promise<void> => {
    await window.electron.releases.refreshApp(repoUrl)
  },

  refreshData: async (): Promise<void> => {
    await window.electron.releases.refreshApps()
  },

  getApps: async (): Promise<AppReleaseMeta[]> => {
    const apps = await window.electron.releases.getApps()
    const appsArray = Array.isArray(apps) ? apps : [apps]
    set({ appReleases: appsArray })
    return appsArray
  },

  getAppReferences: async (): Promise<AppReleaseCommunity[]> => {
    const references = await window.electron.releases.getAppReferences()
    set({ communityApps: references })
    return references
  },

  addAppRepo: async (repoUrl: string): Promise<AppReleaseMeta | void> => {
    const app = await window.electron.releases.addAppRepo(repoUrl)
    return app
  },

  removeAppRepo: async (repoUrl: string): Promise<void> => {
    await window.electron.releases.removeAppRepo(repoUrl)
  },

  getClients: async (): Promise<ClientReleaseMeta[]> => {
    const clients = await window.electron.releases.getClients()
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
}))

export default useReleaseStore
