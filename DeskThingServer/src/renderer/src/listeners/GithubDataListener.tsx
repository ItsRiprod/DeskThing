import { useEffect } from 'react'
import { useGithubStore } from '../stores'
import { AppReleaseCommunity, AppReleaseMeta, ClientReleaseMeta } from '@DeskThing/types'

/**
 * A React component that listens for updates to the application's settings and fetches and caches GitHub repository data accordingly.
 *
 * This component is responsible for:
 * - Fetching and caching GitHub repository data for the application's configured app and client repositories.
 * - Listening for updates to the application's settings and fetching and caching new repository data as needed.
 * - Handling errors that occur during the fetching of repository data.
 */
const GithubDataListener = (): null => {
  const setAppReleases = useGithubStore((state) => state.setAppReleases)
  const setClientReleases = useGithubStore((state) => state.setClientReleases)
  const setCommunityApps = useGithubStore((state) => state.setCommunityApps)

  useEffect(() => {
    const handleAppsUpdate = (_event, data: AppReleaseMeta[]): void => {
      setAppReleases(data)
    }
    const handleCommunityUpdate = (_event, data: AppReleaseCommunity[]): void => {
      setCommunityApps(data)
    }
    const handleClientUpdate = (_event, data: ClientReleaseMeta[]): void => {
      setClientReleases(data)
    }

    window.electron.ipcRenderer.on('github-apps', handleAppsUpdate)
    window.electron.ipcRenderer.on('github-community', handleCommunityUpdate)
    window.electron.ipcRenderer.on('github-client', handleClientUpdate)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('github-apps')
      window.electron.ipcRenderer.removeAllListeners('github-community')
      window.electron.ipcRenderer.removeAllListeners('github-client')
    }
  }, [setAppReleases, setClientReleases, setCommunityApps])

  return null
}

export default GithubDataListener
