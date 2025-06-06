/**
 * @file releaseStore.ts
 * @description This file contains the releaseStore class, which is responsible for managing the github requests of the application.
 * @author Riprod
 * @version 0.10.4
 */
import { create } from 'zustand'
import { AppLatestServer, ClientLatestServer, IpcRendererCallback } from '@shared/types'

interface releaseStoreState {
  appReleases: AppLatestServer[]
  clientReleases: ClientLatestServer[]
  initialized: boolean

  initialize: () => Promise<void>
  refreshApp: (repoUrl: string) => Promise<void>
  refreshData: () => Promise<void>
  getApps: () => Promise<AppLatestServer[]>
  getAppReferences: () => Promise<string[]>
  addAppRepo: (repoUrl: string) => Promise<AppLatestServer | void>
  removeAppRepo: (repoUrl: string) => Promise<void>
  setAppReleases: (releases: AppLatestServer[]) => void

  getClients: () => Promise<ClientLatestServer[]>
  getClientRepo: (repoUrl: string) => Promise<ClientLatestServer | void>
  removeClientRepo: (repoUrl: string) => Promise<void>
  setClientReleases: (releases: ClientLatestServer[]) => void
}

const useReleaseStore = create<releaseStoreState>((set, get) => ({
  appReleases: [],
  clientReleases: [],
  initialized: false,

  initialize: async () => {
    if (get().initialized) return

    const handleAppsUpdate: IpcRendererCallback<'github-apps'> = (_event, data) => {
      set({ appReleases: Array.isArray(data) ? data : [data] })
    }

    const handleClientUpdate: IpcRendererCallback<'github-client'> = (_event, data) => {
      set({ clientReleases: data })
    }

    window.electron.ipcRenderer.on('github-apps', handleAppsUpdate)
    window.electron.ipcRenderer.on('github-client', handleClientUpdate)

    const clients = await window.electron.releases.getClients()
    const apps = await window.electron.releases.getApps()

    set({
      clientReleases: clients,
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

  getApps: async (): Promise<AppLatestServer[]> => {
    const apps = await window.electron.releases.getApps()
    const appsArray = Array.isArray(apps) ? apps : [apps]
    set({ appReleases: appsArray })
    return appsArray
  },

  getAppReferences: async (): Promise<string[]> => {
    const references = await window.electron.releases.getAppReferences()
    return references
  },

  addAppRepo: async (repoUrl: string): Promise<AppLatestServer | void> => {
    const app = await window.electron.releases.addAppRepo(repoUrl)
    return app
  },

  removeAppRepo: async (repoUrl: string): Promise<void> => {
    await window.electron.releases.removeAppRepo(repoUrl)
  },

  getClients: async (): Promise<ClientLatestServer[]> => {
    const clients = await window.electron.releases.getClients()
    set({ clientReleases: clients })
    return clients
  },

  getClientRepo: async (repoUrl: string): Promise<ClientLatestServer | void> => {
    const client = await window.electron.releases.getClientRepo(repoUrl)
    return client
  },

  removeClientRepo: async (repoUrl: string): Promise<void> => {
    await window.electron.releases.removeClientRepo(repoUrl)
  },

  setAppReleases: (releases: AppLatestServer[]): void => {
    set({ appReleases: releases })
  },

  setClientReleases: (releases: ClientLatestServer[]): void => {
    set({ clientReleases: releases })
  }
}))

export default useReleaseStore