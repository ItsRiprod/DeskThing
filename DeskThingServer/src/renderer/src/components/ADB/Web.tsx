import { useEffect, useState } from 'react'
import { IconLogoLoading } from '../icons'
import githubStore, { GithubRelease, GithubAsset } from '../../store/githubStore'
import ReleaseList from '../ReleaseList'

const Web = (): JSX.Element => {
  const [releases, setReleases] = useState<GithubRelease[]>([])
  const [openReleaseId, setOpenReleaseId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      const data = await githubStore.fetchReleases('https://github.com/ItsRiprod/DeskThing')
      setReleases(data)
    }

    fetchData()
  }, [])

  const toggleDropdown = (releaseId: number): void => {
    setOpenReleaseId(openReleaseId === releaseId ? null : releaseId)
  }

  const filterAssets = (assets: GithubAsset[]): GithubAsset[] => {
    return assets.filter((asset) => asset.name.includes('deskthing-client-build'))
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

  return (
    <div className="pt-5 flex flex-col justify-around items-center">
      <div className="w-full max-w-2xl">
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
          <ReleaseList
            releases={releases}
            openReleaseId={openReleaseId}
            toggleDropdown={toggleDropdown}
            filterAssets={filterAssets}
            handleAssetClick={handleAssetClick}
          />
        )}
      </div>
    </div>
  )
}

export default Web
