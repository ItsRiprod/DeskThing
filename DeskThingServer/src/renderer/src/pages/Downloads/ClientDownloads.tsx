import React, { useEffect, useState } from 'react'
import Sidebar from '@renderer/components/Sidebar'
import Button from '@renderer/components/Button'
import { IconGear, IconLink, IconUpload } from '@renderer/assets/icons'
import { useClientStore, useGithubStore, usePageStore, useSettingsStore } from '@renderer/stores'
import MainElement from '@renderer/components/MainElement'
import { GithubAsset, GithubRelease, RepoReleases } from '@shared/types'
import ReleaseComponent from '@renderer/components/ReleaseComponent'
import DownloadNotification from '@renderer/overlays/DownloadNotification'
import ClientSettingsOverlay from '@renderer/overlays/ClientSettingsOverlay'

const ClientDownloads: React.FC = () => {
  const [repoReleases, setRepoReleases] = useState<RepoReleases[]>([])
  const fetchReleases = useGithubStore((githubStore) => githubStore.fetchReleases)
  const clientRepos = useSettingsStore((settingsStore) => settingsStore.settings.clientRepos)
  const loadClient = useClientStore((clientStore) => clientStore.loadClientUrl)
  const loadClientZip = useClientStore((clientStore) => clientStore.loadClientZip)
  const logging = useClientStore((clientStore) => clientStore.logging)
  const [showLogging, setShowLogging] = useState(false)
  const setPage = usePageStore((pageStore) => pageStore.setPage)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [showClientSettings, setShowClientSettings] = useState(false)

  const [currentVersion, setCurrentVersion] = useState<GithubRelease | null | undefined>(undefined)
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number | null>(null)

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

  const gotoAppDownloads = (): void => {
    setPage('Downloads/App')
  }

  const handleUploadClick = async (): Promise<void> => {
    const file = await window.electron.selectZipFile()
    setShowLogging(true)

    if (file) {
      await loadClientZip(file)
      setTimeout(() => {
        setShowLogging(false)
      }, 5000)
    }
  }

  useEffect(() => {
    const fetchSettings = async (): Promise<void> => {
      try {
        if (clientRepos.length === 0) {
          return
        }

        const allReleases: RepoReleases[] = []
        for (const repoUrl of clientRepos) {
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
    return assets.filter((asset) => asset.name.includes('-client'))
  }

  const handleAssetClick = async (asset: GithubAsset): Promise<void> => {
    // Send the selected asset to Electron backend for extraction
    setShowLogging(true)
    try {
      await loadClient(asset.browser_download_url)
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

  return (
    <div className="flex h-full w-full">
      {showClientSettings && <ClientSettingsOverlay onClose={() => setShowClientSettings(false)} />}
      {logging && showLogging && (
        <DownloadNotification
          title="Loading Client..."
          loggingData={logging}
          onClose={handleDownloadFinalized}
        />
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
            <Button
              className="border-gray-500 hover:bg-gray-500"
              onClick={() => setShowClientSettings(true)}
            >
              <IconGear strokeWidth={1.5} />
              <p className="md:block hidden text-center flex-grow">Client Settings</p>
            </Button>
            <Button onClick={handleUploadClick} className="border-gray-500 hover:bg-gray-500">
              <IconUpload strokeWidth={1.5} />
              <p className="md:block hidden text-center flex-grow">Upload Client</p>
            </Button>
            <Button onClick={gotoAppDownloads} className="border-gray-500 hover:bg-gray-500">
              <IconLink strokeWidth={1.5} />
              <p className="md:block hidden text-center flex-grow">Apps</p>
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
                {filterAssets(currentVersion.assets)
                  .reverse()
                  .map((asset, index) => (
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
                <h1 className="text-xl mb-5 font-semibold">Client Downloads</h1>
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

export default ClientDownloads
