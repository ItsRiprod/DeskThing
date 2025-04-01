import React, { useState } from 'react'
import Sidebar from '@renderer/nav/Sidebar'
import Button from '@renderer/components/Button'
import {
  IconGear,
  IconLink,
  IconUpload,
  IconDownload,
  IconLoading,
  IconRefresh
} from '@renderer/assets/icons'
import { useClientStore, useReleaseStore, usePageStore } from '@renderer/stores'
import MainElement from '@renderer/nav/MainElement'
import { useSearchParams } from 'react-router-dom'
import useTaskStore from '@renderer/stores/taskStore'
import { ClientReleaseMeta } from '@deskthing/types'
import { ProgressChannel } from '@shared/types'
import ProgressOverlay from '@renderer/overlays/ProgressOverlay'

const ClientDownloads: React.FC = () => {
  const clientReleases = useReleaseStore((releaseStore) => releaseStore.clientReleases)
  const refresh = useReleaseStore((releaseStore) => releaseStore.refreshData)

  const installedClient = useClientStore((clientStore) => clientStore.clientManifest)
  const refreshClient = useClientStore((clientStore) => clientStore.requestClientManifest)
  const [clientRefreshing, setClientRefreshing] = useState(false)

  // Running clients
  const loadClientUrl = useClientStore((clientStore) => clientStore.loadClientUrl)
  const loadClientZip = useClientStore((clientStore) => clientStore.loadClientZip)

  const resolveStep = useTaskStore((store) => store.resolveStep)

  const [searchParams, setSearchParams] = useSearchParams()
  // Displaying overlays
  const [selectingFile, setSelectingFile] = useState(false)
  const [loading, setLoading] = useState(false)

  // Navigation
  const setPage = usePageStore((pageStore) => pageStore.setPage)

  const gotoAppDownloads = (): void => {
    setPage('Downloads/App')
  }

  const handleUploadClick = async (): Promise<void> => {
    setSelectingFile(true)
    setLoading(true)
    const file = await window.electron.utility.selectZipFile()
    setLoading(false)
    setSelectingFile(false)
    if (file) {
      setLoading(true)
      try {
        await loadClientZip(file)
      } catch {
        // Handle error
      } finally {
        setTimeout(() => {
          setLoading(false)
        }, 5000)
      }
    }
  }

  const handleDownloadFinalized = (): void => {
    setLoading(false)
    resolveStep('client', 'download')
  }

  const handleDownloadError = (): void => {
    setLoading(false)
  }

  const handleDownloadClick = async (url: string): Promise<void> => {
    setLoading(true)
    try {
      await loadClientUrl(url)
    } catch (error) {
      setLoading(false)
      console.error('Failed to download client', error)
    }
  }

  const onRefreshClick = async (): Promise<void> => {
    refreshClient()
    resolveStep('client', 'refresh')
    setClientRefreshing(true)
    setTimeout(() => setClientRefreshing(false), Math.random() * 1500 + 500)
  }

  const openClientSettings = (): void => {
    searchParams.set('settings', 'true')
    searchParams.set('page', 'client')
    setSearchParams(searchParams)
  }

  const handleDownloadLatestClick = async (release: ClientReleaseMeta): Promise<void> => {
    handleDownloadClick(release.updateUrl)
  }

  return (
    <div className="flex h-full w-full">
      <ProgressOverlay
        channel={ProgressChannel.IPC_CLIENT}
        onError={handleDownloadError}
        onClose={handleDownloadFinalized}
      />
      <Sidebar className="flex justify-between flex-col h-full max-h-full md:items-stretch xs:items-center">
        <div className="flex flex-col gap-2 items-center justify-center">
          {installedClient ? (
            <div>
              <h1 className="font-semibold">Loaded Client:</h1>
              <div className="md:block xs:hidden border p-2 rounded-lg bg-zinc-900 border-zinc-800">
                <p>{installedClient.name}</p>
                <p>{installedClient.version}</p>
              </div>
              <div className="md:hidden xs:flex hidden flex-col items-center">
                <p>{installedClient.short_name}</p>
                <p>{installedClient.version}</p>
              </div>
            </div>
          ) : (
            <p>Client Not Found!</p>
          )}
          <Button
            onClick={onRefreshClick}
            className={`${clientRefreshing && 'text-gray-300'} gap-1 hover:bg-zinc-900`}
            disabled={clientRefreshing}
          >
            <IconRefresh className={`stroke-2 ${clientRefreshing ? 'animate-spin' : ''}`} />
            <p className="md:block xs:hidden text-center flex-grow">Refresh Client</p>
          </Button>
        </div>
        <div>
          <div className="flex flex-col md:items-stretch xs:items-center gap-2">
            <Button className="hover:bg-zinc-900" onClick={openClientSettings}>
              <IconGear strokeWidth={1.5} />
              <p className="md:block xs:hidden text-center flex-grow">Client Settings</p>
            </Button>
            <Button
              onClick={handleUploadClick}
              className="hover:bg-zinc-900"
              disabled={selectingFile}
            >
              {selectingFile ? <IconLoading /> : <IconUpload strokeWidth={1.5} />}
              <p className="md:block xs:hidden text-center flex-grow">Upload Client</p>
            </Button>
            <Button onClick={gotoAppDownloads} className="hover:bg-zinc-900">
              <IconLink strokeWidth={1.5} />
              <p className="md:block xs:hidden text-center flex-grow">Apps</p>
            </Button>
          </div>
        </div>
      </Sidebar>
      <MainElement className="p-4">
        <div className="w-full h-full relative overflow-y-auto flex flex-col">
          <div className="absolute inset w-full h-full flex flex-col gap-2">
            {clientReleases.length > 0 ? (
              clientReleases.map((release) => (
                <div
                  key={release.id}
                  className="flex bg-zinc-900 rounded-lg justify-between items-center p-2"
                >
                  <div>
                    <h1 className="text-xl">{release.label}</h1>
                    <p className="text-sm text-gray-500">{release.downloads} downloads</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="group gap-2"
                      onClick={() => handleDownloadLatestClick(release)}
                      disabled={loading}
                    >
                      <p className="group-hover:block hidden text-center flex-grow">
                        Download Latest
                      </p>
                      {loading ? (
                        <IconLoading />
                      ) : (
                        <IconDownload className="group-hover:stroke-2 stroke-1" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex flex-col justify-center items-center">
                <h1 className="text-2xl font-semibold">Uh oh-</h1>
                <p>Unable to find or fetch releases</p>
                <Button onClick={refresh} className="p-2 bg-zinc-800 hover:bg-zinc-900 gap-2">
                  <IconRefresh className="stroke-2" />
                  <p>Attempt to retrieve clients again</p>
                </Button>
                <p className="text-sm text-gray-500 italic text-center">
                  Check the logs for a potential reason. You might have hit the Github API limit.
                  Try again later or add a repo in settings!
                </p>
              </div>
            )}
          </div>
        </div>
      </MainElement>
    </div>
  )
}

export default ClientDownloads
