import React, { useEffect, useState } from 'react'
import Sidebar from '@renderer/components/Sidebar'
import Button from '@renderer/components/Button'
import { IconCheck, IconLink, IconLoading, IconPlay, IconUpload } from '@renderer/assets/icons'
import { useAppStore, useGithubStore, usePageStore, useSettingsStore } from '@renderer/stores'
import MainElement from '@renderer/components/MainElement'
import { AppReturnData, GithubAsset, GithubRelease, RepoReleases } from '@shared/types'
import ReleaseComponent from '@renderer/components/ReleaseComponent'
import DownloadNotification from '@renderer/overlays/DownloadNotification'
import Overlay from '@renderer/overlays/Overlay'

const AppDownloads: React.FC = () => {
  const [repoReleases, setRepoReleases] = useState<RepoReleases[]>([])
  const fetchReleases = useGithubStore((githubStore) => githubStore.fetchReleases)
  const appRepos = useSettingsStore((settingsStore) => settingsStore.settings.appRepos)
  const loadApp = useAppStore((appStore) => appStore.loadAppUrl)
  const loadAppZip = useAppStore((appStore) => appStore.loadAppZip)
  const runApp = useAppStore((appStore) => appStore.runApp)
  const logging = useAppStore((appStore) => appStore.logging)
  const [showLogging, setShowLogging] = useState(false)
  const setPage = usePageStore((pageStore) => pageStore.setPage)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [appReturnData, setAppReturnData] = useState<AppReturnData | null>(null)

  const [currentVersion, setCurrentVersion] = useState<GithubRelease | null | undefined>(undefined)
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number | null>(null)

  const [selectingFile, setSelectingFile] = useState(false)

  const handleReleaseChange = (index: number): void => {
    setCurrentVersionIndex(index)
    if (repoReleases[index]?.releases) {
      const currentRelease = repoReleases[index].releases[index]
      setCurrentVersion(currentRelease)
    } else {
      setCurrentVersion(null)
    }
  }

  const handleRepoChange = (index: number): void => {
    setCurrentIndex(index)
    setCurrentVersion(undefined)
    setCurrentVersionIndex(null)
  }

  const gotoClientDownloads = (): void => {
    setPage('Downloads/Client')
  }

  useEffect(() => {
    const fetchSettings = async (): Promise<void> => {
      try {
        if (appRepos.length === 0) {
          return
        }

        const allReleases: RepoReleases[] = []
        for (const repoUrl of appRepos) {
          const releases = await fetchReleases(repoUrl)
          allReleases.push({ repoUrl, releases })
        }
        setRepoReleases(allReleases)
      } catch {
        return
      }
    }

    fetchSettings()
  }, [])

  const filterAssets = (assets: GithubAsset[]): GithubAsset[] => {
    return assets.filter((asset) => asset.name.includes('-app'))
  }

  const handleAssetClick = async (asset: GithubAsset): Promise<void> => {
    // Send the selected asset to Electron backend for extraction
    setShowLogging(true)
    try {
      const returnData = await loadApp(asset.browser_download_url)
      setAppReturnData(returnData)
    } catch (error) {
      setShowLogging(false)
    }
  }

  const handleDownloadFinalized = (): void => {
    setShowLogging(false)
  }

  const getNameFromRepoUrl = (repoUrl: string): string => {
    const url = new URL(repoUrl)
    const pathParts = url.pathname.split('/')
    const appName = pathParts[pathParts.length - 1]
    return appName
  }

  const handleUploadClick = async (): Promise<void> => {
    setSelectingFile(true)
    const file = await window.electron.selectZipFile()
    setSelectingFile(false)
    if (file) {
      setShowLogging(true)
      try {
        const returnData = await loadAppZip(file)
        setAppReturnData(returnData)
      } catch (error) {
        setShowLogging(false)
      }
    }
  }

  return (
    <div className="flex h-full w-full">
      {logging && showLogging && (
        <DownloadNotification loggingData={logging} onClose={handleDownloadFinalized} />
      )}
      {appReturnData && (
        <Overlay onClose={() => setAppReturnData(null)} className="border border-gray-500">
          <div className="m-3">
            <h1 className="text-2xl">Successfully Downloaded App</h1>
            <p>{appReturnData.appName} is installed</p>
            <div className="font-geistMono border-l pl-2 border-gray-500 text-gray-500 my-2">
              <p>ID: {appReturnData.appId}</p>
              <p>Version: {appReturnData.appVersion}</p>
              <p>Author: {appReturnData.author}</p>
            </div>
            <Button
              className="group border-cyan-500 hover:bg-cyan-500"
              onClick={() => {
                setAppReturnData(null)
                runApp(appReturnData.appId)
              }}
            >
              <p className="group-hover:block hidden">Run App</p>
              <IconPlay />
            </Button>
          </div>
        </Overlay>
      )}
      <Sidebar className="flex justify-between flex-col h-full max-h-full md:items-stretch items-center">
        <div className="flex flex-col gap-2">
          <div className="border-b w-full text-center my-1 font-semibold">
            <p>
              <span className="md:inline hidden">Github</span> Source
            </p>
          </div>
          {repoReleases.map((repo, index) => (
            <Button
              key={repo.repoUrl}
              className={`${currentIndex == index ? 'border-gray-500 bg-gray-500' : 'border-gray-500'} `}
              onClick={() => {
                handleRepoChange(index)
              }}
            >
              <p className="text-xs md:text-sm">{getNameFromRepoUrl(repo.repoUrl)}</p>
            </Button>
          ))}
        </div>
        <div>
          <div className="flex flex-col gap-2">
            <Button onClick={handleUploadClick} className="border-gray-500 hover:bg-gray-500">
              {selectingFile ? <IconLoading strokeWidth={1.5} /> : <IconUpload strokeWidth={1.5} />}
              <p className="md:block hidden text-center flex-grow">Upload App</p>
            </Button>
            <Button onClick={gotoClientDownloads} className="border-gray-500 hover:bg-gray-500">
              <IconLink strokeWidth={1.5} />
              <p className="md:block hidden text-center flex-grow">Clients</p>
            </Button>
          </div>
        </div>
      </Sidebar>
      <MainElement>
        <div className="w-full h-20 relative overflow-x-scroll flex flex-col">
          {repoReleases[currentIndex] ? (
            <div className="flex absolute inset w-full min-w-fit border-b border-gray-500">
              {repoReleases[currentIndex].releases.map((release, index) => (
                <button
                  key={index}
                  className={`p-3 w-fit hover:bg-zinc-700 ${currentVersionIndex == index ? 'bg-zinc-800' : 'text-gray-500 hover:text-white'}`}
                  onClick={() => {
                    handleReleaseChange(index)
                  }}
                >
                  <p className="text-nowrap">{release.tag_name}</p>
                </button>
              ))}
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>
        <div className="relative w-full h-full overflow-y-auto">
          <div className="absolute inset w-full p-5">
            {currentVersion ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filterAssets(currentVersion.assets).map((asset, index) => (
                  <ReleaseComponent
                    key={index}
                    asset={asset}
                    onClick={handleAssetClick}
                    loading={showLogging}
                  />
                ))}
              </div>
            ) : (
              <div>
                <h1 className="text-xl mb-5 font-semibold">App Downloads</h1>
                {currentVersion === undefined ? (
                  <p>Select a release to see the available downloads</p>
                ) : (
                  <p>Release has no versions available</p>
                )}
              </div>
            )}
          </div>
        </div>
      </MainElement>
    </div>
  )
}

export default AppDownloads
