import React, { useEffect, useState } from 'react'
import Sidebar from '@renderer/components/SideBar'
import Button from '@renderer/components/Button'
import { IconLink } from '@renderer/assets/icons'
import { useAppStore, useGithubStore, usePageStore, useSettingsStore } from '@renderer/stores'
import MainElement from '@renderer/components/MainElement'
import { GithubAsset, GithubRelease, RepoReleases } from '@shared/types'
import ReleaseComponent from '@renderer/components/ReleaseComponent'

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

const AppDownloads: React.FC = () => {
  const [repoReleases, setRepoReleases] = useState<RepoReleases[]>([])
  const fetchReleases = useGithubStore((githubStore) => githubStore.fetchReleases)
  const appRepos = useSettingsStore((settingsStore) => settingsStore.settings.appRepos)
  const loadApp = useAppStore((appStore) => appStore.loadAppUrl)
  const [error, setError] = useState<string | null>(null)
  const setPage = usePageStore((pageStore) => pageStore.setPage)
  const [currentIndex, setCurrentIndex] = useState<number>(0)

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

  const gotoClientDownloads = (): void => {
    setPage('downloads/client')
  }

  useEffect(() => {
    const fetchSettings = async (): Promise<void> => {
      try {
        if (appRepos.length === 0) {
          setError('No app repositories configured')
          return
        }

        const allReleases: RepoReleases[] = []
        for (const repoUrl of appRepos) {
          const releases = await fetchReleases(repoUrl)
          allReleases.push({ repoUrl, releases })
        }
        setRepoReleases(allReleases)
      } catch {
        setError('No app repositories configured')
        return
      }
    }

    fetchSettings()
  }, [])

  const filterAssets = (assets: GithubAsset[]): GithubAsset[] => {
    return assets.filter((asset) => asset.name.includes('-app'))
  }

  const getNameFromRepoUrl = (repoUrl: string): string => {
    const url = new URL(repoUrl)
    const pathParts = url.pathname.split('/')
    const appName = pathParts[pathParts.length - 1]
    return appName
  }

  return (
    <div className="flex h-full w-full">
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
            <Button onClick={gotoClientDownloads}>
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
                  className={`p-3 w-fit hover:bg-zinc-700 ${currentVersionIndex == index ? 'bg-zinc-800' : ''}`}
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
        <div className="p-5 w-full h-full overflow-y-auto">
          {currentVersion ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {currentVersion.assets.map((asset, index) => (
                <ReleaseComponent key={index} asset={asset} onClick={loadApp} />
              ))}
            </div>
          ) : currentVersion === undefined ? (
            <p>Select a release to see downloads</p>
          ) : (
            <p>Release has no versions available</p>
          )}
        </div>
      </MainElement>
    </div>
  )
}

export default AppDownloads
