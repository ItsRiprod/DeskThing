import { useEffect } from 'react'
import { useGithubStore } from '../stores'
import { Settings } from '@shared/types'

/**
 * A React component that listens for updates to the application's settings and fetches and caches GitHub repository data accordingly.
 *
 * This component is responsible for:
 * - Fetching and caching GitHub repository data for the application's configured app and client repositories.
 * - Listening for updates to the application's settings and fetching and caching new repository data as needed.
 * - Handling errors that occur during the fetching of repository data.
 */
const GithubDataListener = (): null => {
  const fetchAppRepo = useGithubStore((state) => state.fetchAppRepo)
  const fetchClientRepo = useGithubStore((state) => state.fetchClientRepo)
  const cachedRepos = useGithubStore((state) => state.cachedRepos)

  if (import.meta.hot) {
    import.meta.hot.invalidate('Unable to update github data')
  } else {
    console.log('Refreshing github data')
  }

  useEffect(() => {
    const handleSettingsUpdate = async (_event, settings: Settings): Promise<void> => {
      // Fetch and cache releases for new app repos
      if (settings.appRepos) {
        for (const repoUrl of settings.appRepos) {
          if (!cachedRepos.includes(repoUrl)) {
            await fetchAppRepo(repoUrl)
          }
        }
      }
      if (settings.clientRepos) {
        for (const repoUrl of settings.clientRepos) {
          if (!cachedRepos.includes(repoUrl)) {
            await fetchClientRepo(repoUrl)
          }
        }
      }
    }

    const getInitialSettings = async (): Promise<void> => {
      const settings = await window.electron.getSettings()

      // Fetch and cache releases for initial app repos
      if (settings.appRepos) {
        for (const repoUrl of settings.appRepos) {
          if (!cachedRepos.includes(repoUrl)) {
            await fetchAppRepo(repoUrl)
          }
        }
      }
      if (settings.clientRepos) {
        for (const repoUrl of settings.clientRepos) {
          if (!cachedRepos.includes(repoUrl)) {
            console.log('Fetching client repo:', repoUrl)
            await fetchClientRepo(repoUrl)
          }
        }
      }
    }

    getInitialSettings()

    window.electron.ipcRenderer.on('settings-updated', handleSettingsUpdate)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('settings-updated')
    }
  }, [])

  return null
}

export default GithubDataListener
