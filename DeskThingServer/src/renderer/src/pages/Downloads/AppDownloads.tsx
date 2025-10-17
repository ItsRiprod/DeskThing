import React, { useState } from 'react'
import Sidebar from '@renderer/nav/Sidebar'
import Button from '@renderer/components/buttons/Button'
import { IconLink, IconPlus, IconRefresh } from '@renderer/assets/icons'
import { useAppStore, useReleaseStore, usePageStore } from '@renderer/stores'
import MainElement from '@renderer/nav/MainElement'
import { SuccessNotification } from '@renderer/overlays/SuccessNotification'
import AddRepoOverlay from '@renderer/overlays/releases/AddRepoOverlay'
import { ProgressChannel } from '@shared/types'
import { AppReleaseCard } from './AppDownloadCard'
import { useChannelProgress } from '@renderer/hooks/useProgress'
import { DownloadErrorOverlay } from '@renderer/overlays/DownloadErrorOverlay'
import { AddCard } from './AddCard'

// Defined outside scope so it persists between being unmounted and not
let initialRender = true

/**
 * The `AppDownloads` component is responsible for rendering the downloads page of the application. It displays a list of available app downloads, allows users to upload their own app, and provides a link to the client downloads page.
 *
 * The component uses various hooks from the `useAppStore`, `useReleaseStore`, and `usePageStore` stores to manage the state and functionality of the page. It also uses several custom components, such as `Sidebar`, `Button`, and various overlay components.
 *
 * The main features of the `AppDownloads` component include:
 * - Displaying a list of available app downloads, with the ability to download the latest version of each app
 * - Allowing users to upload their own app by selecting a ZIP file
 * - Providing a link to the client downloads page
 * - Displaying download progress and success notifications
 * - Handling errors and edge cases, such as when the GitHub API limit is reached
 */
const AppDownloads: React.FC = () => {
  const appReleases = useReleaseStore((releaseStore) => releaseStore.appReleases)
  const getApps = useReleaseStore((releaseStore) => releaseStore.getApps)
  const refreshReleases = useReleaseStore((releaseStore) => releaseStore.refreshReleases)
  const stagedAppManifest = useAppStore((appStore) => appStore.stagedManifest)
  const addApp = useAppStore((appStore) => appStore.addApp)

  const [addAppError, setAddAppError] = useState<string | null>(null)

  useChannelProgress(ProgressChannel.IPC_APPS)
  useChannelProgress(ProgressChannel.IPC_RELEASES)

  const [uiState, setUiState] = useState({
    showCommunity: false,
    refreshingApps: false
  })

  // Because of how React works, this will only run once due to the global initialRender function only ever being loaded once and then persisting
  if (initialRender) {
    getApps()
    initialRender = false
  }

  const [addAppRepoOverlay, setAddAppRepoOverlay] = useState(false)

  const setPage = usePageStore((pageStore) => pageStore.setPage)

  const gotoClientDownloads = (): void => {
    setPage('Downloads/Client')
  }

  const fetchApps = async (): Promise<void> => {
    setUiState((prev) => ({
      ...prev,
      refreshingApps: true
    }))
    await getApps()
    setUiState((prev) => ({
      ...prev,
      refreshingApps: false
    }))
  }

  const handleRefreshData = async (): Promise<void> => {
    if (!uiState.refreshingApps) {
      setUiState((prev) => ({
        ...prev,
        refreshingApps: true
      }))
      await refreshReleases(true)
      setTimeout(
        () => {
          setUiState((prev) => ({
            ...prev,
            refreshingApps: false
          }))
        },
        Math.random() * 2000 + 1500
      )
    }
  }

  const onZipAdd = async (fileUrl: string): Promise<void> => {
    const downloadResult = await addApp({ appPath: fileUrl })
    if (!downloadResult.success) {
      setAddAppError(downloadResult.message || 'Failed to add app from ZIP file.')
    }
  }

  const handleToggleAddRepo = (): void => {
    setAddAppRepoOverlay((state) => !state)
  }

  return (
    <div className="flex h-full w-full">
      {addAppRepoOverlay && <AddRepoOverlay onClose={handleToggleAddRepo} onZipUpload={onZipAdd} />}
      {stagedAppManifest && <SuccessNotification stagedManifest={stagedAppManifest} />}
      <Sidebar className="flex justify-end flex-col h-full max-h-full md:items-stretch xs:items-center">
        <div>
          <div className="flex flex-col gap-2">
            <Button
              disabled={uiState.refreshingApps}
              onClick={handleRefreshData}
              className="hover:bg-zinc-900"
            >
              <IconRefresh
                className={`${uiState.refreshingApps ? 'animate-spin-smooth' : ''}`}
                strokeWidth={1.5}
              />
              <p className="md:block xs:hidden flex flex-grow xs:text-center">
                Refresh<span className="hidden group-disabled:inline">ing</span>
              </p>
            </Button>
            <Button onClick={handleToggleAddRepo} className="hover:bg-zinc-900">
              <IconPlus strokeWidth={1.5} />
              <p className="md:block xs:hidden xs:text-center flex-grow">Add App</p>
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
          <div className="absolute inset w-full h-fit grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-4">
            {appReleases?.length > 0 ? (
              <>
                {appReleases.map((appRelease, index) => (
                  <AppReleaseCard appReleaseServer={appRelease} key={appRelease.id || index} />
                ))}
                <AddCard />
              </>
            ) : (
              <div className="w-full h-full flex flex-col justify-center items-center col-span-full">
                <h1 className="text-2xl font-semibold">Uh oh-</h1>
                <p>Unable to find or fetch releases</p>
                <p className="text-sm text-gray-500 italic text-center">
                  Check the logs for a potential reason. You might have hit the Github API limit.
                  Try again later or add a repo in settings!
                </p>
                <Button
                  onClick={fetchApps}
                  className="mt-4 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-400 text-white font-semibold flex items-center gap-2 shadow transition-all duration-200"
                >
                  <IconRefresh
                    strokeWidth={1.5}
                    className={`${uiState.refreshingApps ? 'animate-spin-smooth' : ''}`}
                  />
                  <span className="md:block xs:hidden xs:text-center flex-grow">Retry</span>
                </Button>
              </div>
            )}
          </div>
        </div>
        {addAppError && (
          <DownloadErrorOverlay
            error={addAppError}
            onAcknowledge={() => setAddAppError(null)}
            title="There was an error loading the zip file"
          />
        )}
      </MainElement>
    </div>
  )
}

export default AppDownloads
