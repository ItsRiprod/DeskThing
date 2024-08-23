import { useEffect, useState } from 'react'
import { IconArrowDown, IconArrowRight, IconLogoLoading } from '../icons'
import githubStore, { GithubRelease, GithubAsset } from '../../store/githubStore'
import ReleaseList from '../ReleaseList'
import ClientSettings from '../ClientSettings'
import SettingsStoreInstance from '@renderer/store/settingsStore'
import Loading from '../Loading'

interface RepoReleases {
  repoUrl: string
  releases: GithubRelease[]
}

const Client = (): JSX.Element => {
  const [repoReleases, setRepoReleases] = useState<RepoReleases[]>([])
  const [openRepoUrl, setOpenRepoUrl] = useState<string | null>(null)
  const [openReleaseId, setOpenReleaseId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const settings = await SettingsStoreInstance.getSettings()

        const appRepos = settings.clientRepos

        if (appRepos.length === 0) {
          setError('No app repositories configured')
          return
        }

        const allReleases: RepoReleases[] = []
        for (const repoUrl of appRepos) {
          const releases = await githubStore.fetchReleases(repoUrl)
          allReleases.push({ repoUrl, releases })
        }
        setRepoReleases(allReleases)
      } catch (err) {
        setError(`Error fetching releases: ${err}`)
      }
    }

    fetchData()
  }, [])

  const filterAssets = (assets: GithubAsset[]): GithubAsset[] => {
    return assets.filter((asset) => asset.name.includes('-client'))
  }

  const handleLogging = async (): Promise<void> => {
    setLoading(true)
    const unsubscribe = window.electron.ipcRenderer.on('logging', (_event, reply) => {
      console.log(reply)
      if (reply.final) {
        unsubscribe()
        setLoading(false)
      } else {
        setLoading(true)
      }
      if (!reply.status) {
        setStatus(reply.error || 'Unknown error occurred')
        unsubscribe()
        setLoading(false)
      } else {
        if (reply.data) {
          setStatus(reply.data)
        }
      }
    })
  }

  const handleAssetClick = async (asset: GithubAsset): Promise<void> => {
    // Send the selected asset to Electron backend for extraction
    setLoading(true)
    try {
      window.electron.ipcRenderer.send('extract-webapp-zip', asset.browser_download_url)
      handleLogging()
    } catch (error) {
      setLoading(false)
      if (error) {
        setError(JSON.stringify(error))
      }
    }
  }

  const toggleRepoDropdown = (repoUrl: string): void => {
    setOpenRepoUrl(openRepoUrl === repoUrl ? null : repoUrl)
    setOpenReleaseId(null) // Close any open release when toggling repo
  }

  const toggleReleaseDropdown = (releaseId: number): void => {
    setOpenReleaseId(openReleaseId === releaseId ? null : releaseId)
  }

  return (
    <div className="pt-5 flex flex-col justify-around items-center">
      <div className="w-full p-3 max-w-2xl">
        {loading ? (
          <div className="mb-4 flex flex-col items-center justify-center">
            <IconLogoLoading iconSize={256} />
            {status && <p className="mt-2 logo">{status}</p>}
          </div>
        ) : error ? (
          <div className="mb-4">
            <div className="w-full px-4 py-2 text-left border rounded-xl hover:bg-zinc-900 focus:outline-none">
              {error}
            </div>
          </div>
        ) : (
          <div>
            <ClientSettings />
            {repoReleases.length > 0 ? (
              repoReleases.map((repo) => (
                <div key={repo.repoUrl} className="border-l rounded-xl">
                  <button
                    className="w-full flex justify-between px-4 py-2 text-left border-t mb-2 rounded-xl hover:font-bold focus:outline-none"
                    onClick={() => toggleRepoDropdown(repo.repoUrl)}
                  >
                    {repo.repoUrl}
                    {openRepoUrl === repo.repoUrl ? <IconArrowDown /> : <IconArrowRight />}
                  </button>
                  {openRepoUrl === repo.repoUrl && (
                    <ReleaseList
                      releases={repo.releases}
                      openReleaseId={openReleaseId}
                      toggleDropdown={toggleReleaseDropdown}
                      filterAssets={filterAssets}
                      handleAssetClick={handleAssetClick}
                    />
                  )}
                </div>
              ))
            ) : (
              <Loading message={'Fetching Releases'} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Client
