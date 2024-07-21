import { useEffect, useState } from 'react'
import { IconLogoGearLoading } from '../icons'
import githubStore, { GithubRelease, GithubAsset } from '../../store/githubStore'
import ReleaseList from '../ReleaseList'
import RunPreppedApp from './RunPreppedApp'
interface returnData {
  appId: string
  appName: string
  appVersion: string
  author: string
  platforms: string[]
  requirements: string[]
}

const Web = (): JSX.Element => {
  const [releases, setReleases] = useState<GithubRelease[]>([])
  const [openReleaseId, setOpenReleaseId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [appData, setAppData] = useState<returnData | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    return assets.filter((asset) => asset.name.includes('-app'))
  }

  const handleAssetClick = async (asset: GithubAsset): Promise<void> => {
    // Send the selected asset to Electron backend for extraction
    setLoading(true)
    try {
      window.electron.ipcRenderer.send('extract-app-zip-url', asset.browser_download_url)
      window.electron.ipcRenderer.on('zip-name', (_event, data: returnData) => {
        setLoading(false)
        setAppData(data)
        console.log(data)
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
            <div className="w-full px-4 py-2 flex justify-center">
              <div className="">
                <IconLogoGearLoading iconSize={256} />
              </div>
            </div>
          ) : error ? (
            <div className="mb-4">
              <div className="w-full px-4 py-5 text-left border rounded-xl bg-red-600 hover:bg-red-700 focus:outline-none">
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
      ) : (
        <RunPreppedApp appData={appData} handleAddAndRunApp={handleAddAndRunApp} />
      )}
    </div>
  )
}

export default Web
