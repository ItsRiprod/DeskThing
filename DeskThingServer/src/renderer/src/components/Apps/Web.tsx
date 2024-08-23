import { useEffect, useState } from 'react'
import { IconArrowDown, IconArrowRight, IconLogoLoading } from '../icons'
import githubStore, { GithubRelease, GithubAsset } from '../../store/githubStore'
import ReleaseList from '../ReleaseList'
import RunPreppedApp from './RunPreppedApp'
import SettingsStoreInstance from '@renderer/store/settingsStore'
import Loading from '../Loading'
interface responseData {
  status: boolean
  data: returnData
  final: boolean
  error?: string
}
interface returnData {
  appId: string
  appName: string
  appVersion: string
  author: string
  platforms: string[]
  requirements: string[]
}

interface RepoReleases {
  repoUrl: string
  releases: GithubRelease[]
}

const Web = (): JSX.Element => {
  const [repoReleases, setRepoReleases] = useState<RepoReleases[]>([])
  const [openRepoUrl, setOpenRepoUrl] = useState<string | null>(null)
  const [openReleaseId, setOpenReleaseId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [appData, setAppData] = useState<returnData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const settings = await SettingsStoreInstance.getSettings()

        const appRepos = settings.appRepos

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

  const toggleRepoDropdown = (repoUrl: string): void => {
    setOpenRepoUrl(openRepoUrl === repoUrl ? null : repoUrl)
    setOpenReleaseId(null) // Close any open release when toggling repo
  }

  const toggleReleaseDropdown = (releaseId: number): void => {
    setOpenReleaseId(openReleaseId === releaseId ? null : releaseId)
  }

  const filterAssets = (assets: GithubAsset[]): GithubAsset[] => {
    return assets.filter((asset) => asset.name.includes('-app'))
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
      window.electron.ipcRenderer.send('extract-app-zip-url', asset.browser_download_url)
      handleLogging()
      window.electron.ipcRenderer.on('zip-name', (_event, response: responseData) => {
        setLoading(false)
        if (response.status) {
          setAppData(response.data)
        }
        console.log(response)
      })
    } catch (error) {
      setLoading(false)
      if (error) {
        setError(JSON.stringify(error))
      }
    }
  }

  const handleAddAndRunApp = async (): Promise<void> => {
    window.electron.ipcRenderer.send('add-app', appData?.appId)
    window.electron.ipcRenderer.send('get-apps')
    setAppData(null)
  }

  return (
    <div className="pt-5 flex flex-col justify-around items-center">
      {!appData?.appId ? (
        <div className="w-full max-w-2xl">
          {loading ? (
            <div className="w-full px-4 py-2 flex flex-col items-center justify-center">
              <IconLogoLoading iconSize={256} />
              {status && <p className="logo text-white">{status.trim()}</p>}
            </div>
          ) : error ? (
            <div className="mb-4">
              <div className="w-full px-4 py-5 text-left border rounded-xl bg-red-600 hover:bg-red-700 focus:outline-none">
                {error}
              </div>
            </div>
          ) : repoReleases.length > 0 ? (
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
      ) : (
        <RunPreppedApp appData={appData} handleAddAndRunApp={handleAddAndRunApp} />
      )}
    </div>
  )
}

export default Web
