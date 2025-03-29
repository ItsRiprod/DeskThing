import { useEffect } from 'react'
import { usereleaseStore } from '../stores'
import { IpcRendererCallback } from '@shared/types'

/**
 * A React component that listens for updates to the application's settings and fetches and caches GitHub repository data accordingly.
 *
 * This component is responsible for:
 * - Fetching and caching GitHub repository data for the application's configured app and client repositories.
 * - Listening for updates to the application's settings and fetching and caching new repository data as needed.
 * - Handling errors that occur during the fetching of repository data.
 */
const GithubDataListener = (): null => {
  const setAppReleases = usereleaseStore((state) => state.setAppReleases)
  const setClientReleases = usereleaseStore((state) => state.setClientReleases)
  const setCommunityApps = usereleaseStore((state) => state.setCommunityApps)
  useEffect(() => {
    let isInvalid = false
    const handleAppsUpdate: IpcRendererCallback<'github-apps'> = (_event, data): void => {
      setAppReleases(data)
    }
    const handleCommunityUpdate: IpcRendererCallback<'github-community'> = (_event, data): void => {
      setCommunityApps(data)
    }
    const handleClientUpdate: IpcRendererCallback<'github-client'> = (_event, data): void => {
      setClientReleases(data)
    }
    const getInitialData = async (): Promise<void> => {
      const clients = await window.electron.releases.getClients()
      const refs = await window.electron.releases.getAppReferences()
      const apps = await window.electron.releases.getApps()

      if (isInvalid) return // cancel on a re-render
      setClientReleases(clients)
      setCommunityApps(refs)
      setAppReleases(Array.isArray(apps) ? apps : [apps])
    }

    getInitialData()

    window.electron.ipcRenderer.on('github-apps', handleAppsUpdate)
    window.electron.ipcRenderer.on('github-community', handleCommunityUpdate)
    window.electron.ipcRenderer.on('github-client', handleClientUpdate)

    return () => {
      isInvalid = true
      window.electron.ipcRenderer.removeAllListeners('github-apps')
      window.electron.ipcRenderer.removeAllListeners('github-community')
      window.electron.ipcRenderer.removeAllListeners('github-client')
    }
  }, [setAppReleases, setClientReleases, setCommunityApps])

  return null
}

export default GithubDataListener
