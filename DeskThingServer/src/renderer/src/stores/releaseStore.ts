/**
 * @file releaseStore.ts
 * @description This file contains the releaseStore class, which is responsible for managing the github requests of the application.
 * @author Riprod
 * @version 0.10.4
 */
import { create } from 'zustand'
import {
  AppLatestServer,
  ClientLatestServer,
  IpcRendererCallback,
  StagedAppManifest
} from '@shared/types'
import { ClientManifest } from '@deskthing/types'

interface releaseStoreState {
  appReleases: AppLatestServer[]
  clientReleases: ClientLatestServer[]
  initialized: boolean

  initialize: () => Promise<void>
  refreshReleases: (force?: boolean) => Promise<void>
  addRepositoryUrl: (
    repoUrl: string
  ) => Promise<AppLatestServer[] | ClientLatestServer[] | undefined>

  getApps: () => Promise<AppLatestServer[]>
  getAppReferences: () => Promise<string[]>
  removeAppRelease: (appID: string) => Promise<void>
  downloadApp: (appId: string) => Promise<StagedAppManifest | undefined>

  getClients: () => Promise<ClientLatestServer[]>
  getClientRepos: () => Promise<string[]>
  removeClientRelease: (clientId: string) => Promise<void>
  downloadClient: (clientId: string) => Promise<ClientManifest | undefined>
}

const useReleaseStore = create<releaseStoreState>((set, get) => ({
  appReleases: [],
  clientReleases: [],
  initialized: false,

  initialize: async () => {
    if (get().initialized) return

    const handleAppsUpdate: IpcRendererCallback<'github-apps'> = (_event, data) => {
      set({ appReleases: data })
    }

    const handleClientUpdate: IpcRendererCallback<'github-client'> = (_event, data) => {
      set({ clientReleases: data })
    }

    window.electron.ipcRenderer.on('github-apps', handleAppsUpdate)
    window.electron.ipcRenderer.on('github-client', handleClientUpdate)

    set({
      clientReleases: [],
      appReleases: [],
      initialized: true
    })
  },

  refreshReleases: async (force?: boolean): Promise<void> => {
    await window.electron.releases.refreshReleases({ force })
  },

  addRepositoryUrl: async (
    repoUrl: string
  ): Promise<AppLatestServer[] | ClientLatestServer[] | undefined> => {
    const latestServer = await window.electron.releases.addRepositoryUrl(repoUrl)
    return latestServer
  },

  getApps: async (): Promise<AppLatestServer[]> => {
    const apps = await window.electron.releases.getApps()
    set({ appReleases: apps })
    return apps
  },

  getAppReferences: async (): Promise<string[]> => {
    const references = await window.electron.releases.getAppRepositories()
    return references
  },

  removeAppRelease: async (repoUrl: string): Promise<void> => {
    await window.electron.releases.removeAppRepo(repoUrl)
  },

  downloadApp: async (appId: string): Promise<StagedAppManifest | undefined> => {
    const app = await window.electron.releases.downloadApp(appId)
    return app
  },

  getClients: async (): Promise<ClientLatestServer[]> => {
    const clients = await window.electron.releases.getClients()
    set({ clientReleases: clients })
    return clients
  },

  getClientRepos: async (): Promise<string[]> => {
    const client = await window.electron.releases.getClientRepositories()
    return client
  },

  removeClientRelease: async (repoUrl: string): Promise<void> => {
    await window.electron.releases.removeClientRepo(repoUrl)
  },

  downloadClient: async (clientId: string): Promise<ClientManifest | undefined> => {
    const client = await window.electron.releases.downloadClient(clientId)
    return client
  }
}))

export default useReleaseStore
