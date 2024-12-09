import { useEffect } from 'react'
import { useGithubStore } from '../stores'
import { Settings } from '@shared/types'

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
