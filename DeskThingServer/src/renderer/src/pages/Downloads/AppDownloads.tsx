import React, { useEffect, useState } from 'react'
import Sidebar from '@renderer/nav/Sidebar'
import Button from '@renderer/components/Button'
import {
  IconArrowDown,
  IconArrowUp,
  IconDownload,
  IconLink,
  IconLoading,
  IconLogoGear,
  IconPlus,
  IconStop,
  IconUpload
} from '@renderer/assets/icons'
import { useAppStore, useGithubStore, usePageStore } from '@renderer/stores'
import MainElement from '@renderer/nav/MainElement'
import DownloadNotification from '@renderer/overlays/DownloadNotification'
import { SuccessNotification } from '@renderer/overlays/SuccessNotification'
import { AppReleaseCommunity, AppReleaseMeta, AppReleaseSingleMeta } from '@DeskThing/types'

/**
 * The `AppDownloads` component is responsible for rendering the downloads page of the application. It displays a list of available app downloads, allows users to upload their own app, and provides a link to the client downloads page.
 *
 * The component uses various hooks from the `useAppStore`, `useGithubStore`, and `usePageStore` stores to manage the state and functionality of the page. It also uses several custom components, such as `Sidebar`, `Button`, and various overlay components.
 *
 * The main features of the `AppDownloads` component include:
 * - Displaying a list of available app downloads, with the ability to download the latest version of each app
 * - Allowing users to upload their own app by selecting a ZIP file
 * - Providing a link to the client downloads page
 * - Displaying download progress and success notifications
 * - Handling errors and edge cases, such as when the GitHub API limit is reached
 */
const AppDownloads: React.FC = () => {
  const appReleases = useGithubStore((githubStore) => githubStore.appReleases)
  const communityApps = useGithubStore((githubStore) => githubStore.communityApps)
  const getApps = useGithubStore((githubStore) => githubStore.getApps)
  const getAppReferences = useGithubStore((githubStore) => githubStore.getAppReferences)
  const addRepo = useGithubStore((githubStore) => githubStore.addAppRepo)
  const removeRepo = useGithubStore((githubStore) => githubStore.removeAppRepo)
  const refresh = useGithubStore((githubStore) => githubStore.refreshApps)
  const addApp = useAppStore((appStore) => appStore.addApp)
  const stagedAppManifest = useAppStore((appStore) => appStore.stagedManifest)
  const logging = useAppStore((appStore) => appStore.logging)

  const [uiState, setUiState] = useState({
    showCommunity: false
  })

  const [showLogging, setShowLogging] = useState(false)
  const [selectingFile, setSelectingFile] = useState(false)
  const [loading, setLoading] = useState(false)

  const setPage = usePageStore((pageStore) => pageStore.setPage)

  useEffect(() => {
    getApps()
    getAppReferences()
  }, [getApps])

  const gotoClientDownloads = (): void => {
    setPage('Downloads/Client')
  }

  const handleDownloadFinalized = (): void => {
    setShowLogging(false)
    setLoading(false)
  }

  const handleUploadClick = async (): Promise<void> => {
    setSelectingFile(true)
    setLoading(true)
    const file = await window.electron.selectZipFile()
    setSelectingFile(false)
    setLoading(false)
    if (file) {
      setShowLogging(true)
      setLoading(true)
      try {
        await addApp(file)
      } catch (error) {
        setShowLogging(false)
        setLoading(false)
      }
    }
  }

  const handleDownloadClick = async (url: string): Promise<void> => {
    setShowLogging(true)
    setLoading(true)
    try {
      await addApp(url)
    } catch (error) {
      await setTimeout(() => {
        setShowLogging(false)
        setLoading(false)
      }, 2000)
    }
  }

  const handleAddClick = (appRelease: AppReleaseCommunity): void => {
    if (appRelease.added) {
      removeRepo(appRelease.repository)
    } else {
      addRepo(appRelease.repository)
    }
  }

  const handleDownloadLatestClick = async (app: AppReleaseSingleMeta): Promise<void> => {
    handleDownloadClick(app.updateUrl)
  }

  const handleToggleCommunityApps = (): void => {
    setUiState((prev) => ({
      ...prev,
      showCommunity: !prev.showCommunity
    }))
  }

  return (
    <div className="flex h-full w-full">
      {logging && showLogging && (
        <DownloadNotification loggingData={logging} onClose={handleDownloadFinalized} />
      )}
      {stagedAppManifest && <SuccessNotification />}
      <Sidebar className="flex justify-end flex-col h-full max-h-full md:items-stretch xs:items-center">
        <div>
          <div className="flex flex-col gap-2">
            <Button onClick={handleUploadClick} className="hover:bg-zinc-900">
              {selectingFile ? <IconLoading strokeWidth={1.5} /> : <IconUpload strokeWidth={1.5} />}
              <p className="md:block xs:hidden xs:text-center flex-grow">Upload App</p>
            </Button>
            <Button onClick={gotoClientDownloads} className="hover:bg-zinc-900">
              <IconLink strokeWidth={1.5} />
              <p className="md:block xs:hidden xs:text-center flex-grow">Clients</p>
            </Button>
          </div>
        </div>
      </Sidebar>
      <MainElement className="p-4">
        <div className="w-full h-full relative overflow-y-auto flex flex-col">
          <div className="absolute inset w-full h-full flex flex-col gap-2">
            {appReleases.length > 0 ? (
              appReleases.map((appRelease: AppReleaseMeta) =>
                appRelease.type === 'single' ? (
                  <AppDownloadComponent
                    key={appRelease.id}
                    appRelease={appRelease}
                    loading={loading}
                    onDownoadLatestClick={handleDownloadLatestClick}
                  />
                ) : appRelease.type === 'multi' ? (
                  <div
                    className="border-l flex flex-col px-5 border-gray-500 gap-2"
                    key={appRelease.id}
                  >
                    <div className="w-full flex justify-between items-center">
                      <p>{appRelease.id}</p>
                      <p>{appRelease.version}</p>
                    </div>
                    {appRelease.releases.map((release) => (
                      <AppDownloadComponent
                        key={release.id}
                        appRelease={release}
                        loading={loading}
                        onDownoadLatestClick={handleDownloadLatestClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div></div>
                )
              )
            ) : (
              <div className="w-full h-full flex flex-col justify-center items-center">
                <h1 className="text-2xl font-semibold">Uh oh-</h1>
                <p>Unable to find or fetch releases</p>
                <p className="text-sm text-gray-500 italic text-center">
                  Check the logs for a potential reason. You might have hit the Github API limit.
                  Try again later or add a repo in settings!
                </p>
                <Button onClick={refresh} className="mt-2">
                  <p>Refresh</p>
                </Button>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleToggleCommunityApps}
                className="hover:bg-zinc-900 flex justify-between items-center"
              >
                <p className="text-xl">Additional Apps</p>
                {uiState.showCommunity ? <IconArrowDown /> : <IconArrowUp />}
              </Button>

              {uiState.showCommunity &&
                (communityApps.length > 0 ? (
                  communityApps.map((appRelease, index) => (
                    <AppDownloadCommunityComponent
                      key={index}
                      appRelease={appRelease}
                      loading={loading}
                      onAddClick={handleAddClick}
                    />
                  ))
                ) : (
                  <div className="w-full h-full flex flex-col justify-center items-center">
                    <h1 className="text-2xl font-semibold">Uh oh-</h1>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </MainElement>
    </div>
  )
}

const AppDownloadCommunityComponent: React.FC<{
  appRelease: AppReleaseCommunity
  onAddClick: (appRelease: AppReleaseCommunity) => void
  loading: boolean
}> = ({ appRelease, onAddClick, loading }) => {
  return (
    <div className="flex hover:bg-zinc-800 bg-zinc-900 rounded-lg justify-between items-center p-2">
      <div className="flex gap-4 items-center">
        {appRelease.icon ? (
          <img src={appRelease.icon} alt={appRelease.label} className="w-12 h-12 rounded" />
        ) : (
          <div className="w-12 h-12 rounded items-center flex justify-center">
            <IconLogoGear className="text-black w-12 h-12" />
          </div>
        )}
        <div>
          <h1 className="text-xl">{appRelease.label}</h1>
          <div className="flex gap-2 text-sm text-gray-500">
            <p>v{appRelease.version}</p>
            <p>•</p>
            <p>By {appRelease.author}</p>
          </div>
          <p className="text-sm text-gray-400">{appRelease.description}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          className={`${loading ? 'text-gray-600' : 'group'} gap-2`}
          disabled={loading}
          onClick={() => onAddClick(appRelease)}
        >
          <p className="group-hover:block hidden text-center flex-grow">
            {appRelease.added ? 'Remove' : 'Add'}
          </p>
          {appRelease.added ? (
            <IconStop className="group-hover:stroke-2 stroke-1" />
          ) : (
            <IconPlus className="group-hover:stroke-2 stroke-1" />
          )}
        </Button>
      </div>
    </div>
  )
}

const AppDownloadComponent: React.FC<{
  appRelease: AppReleaseSingleMeta
  onDownoadLatestClick: (appRelease: AppReleaseSingleMeta) => void
  loading: boolean
}> = ({ appRelease, onDownoadLatestClick, loading }) => {
  return (
    <div
      key={appRelease.id}
      className="flex hover:bg-zinc-800 bg-zinc-900 rounded-lg justify-between items-center p-2"
    >
      <div className="flex gap-4 items-center">
        {appRelease.icon ? (
          <img src={appRelease.icon} alt={appRelease.label} className="w-12 h-12 rounded" />
        ) : (
          <div className="w-12 h-12 rounded items-center flex justify-center">
            <IconLogoGear className="text-black w-12 h-12" />
          </div>
        )}
        <div>
          <h1 className="text-xl">{appRelease.label}</h1>
          <div className="flex gap-2 text-sm text-gray-500">
            <p>v{appRelease.version}</p>
            <p>•</p>
            <p>By {appRelease.author}</p>
            <p>•</p>
            <p>{appRelease.downloads || 0} downloads</p>
          </div>
          <p className="text-sm text-gray-400">{appRelease.description}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          className={`${loading ? 'text-gray-600' : 'group'} gap-2`}
          disabled={loading}
          onClick={() => onDownoadLatestClick(appRelease)}
        >
          <p className="group-hover:block hidden text-center flex-grow">Download Latest</p>
          <IconDownload className="group-hover:stroke-2 stroke-1" />
        </Button>
      </div>
    </div>
  )
}

export default AppDownloads
