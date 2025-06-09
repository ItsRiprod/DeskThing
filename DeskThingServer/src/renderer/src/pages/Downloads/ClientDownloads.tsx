import React, { useState } from 'react'
import Sidebar from '@renderer/nav/Sidebar'
import Button from '@renderer/components/Button'
import {
  IconGear,
  IconLink,
  IconUpload,
  IconLoading,
  IconRefresh,
} from '@renderer/assets/icons'
import { useClientStore, useReleaseStore, usePageStore } from '@renderer/stores'
import MainElement from '@renderer/nav/MainElement'
import { useSearchParams } from 'react-router-dom'
import useTaskStore from '@renderer/stores/taskStore'
import { ProgressChannel } from '@shared/types'
import ProgressOverlay from '@renderer/overlays/ProgressOverlay'
import { ClientDownloadCard } from './ClientDownloadCard'

let initialRender = true

const ClientDownloads: React.FC = () => {
  const clientReleases = useReleaseStore((releaseStore) => releaseStore.clientReleases)
  const refresh = useReleaseStore((releaseStore) => releaseStore.refreshReleases)
  const getClients = useReleaseStore((releaseStore) => releaseStore.getClients)

  const installedClient = useClientStore((clientStore) => clientStore.clientManifest)
  const refreshClient = useClientStore((clientStore) => clientStore.requestClientManifest)
  const loadClientZip = useClientStore((clientStore) => clientStore.loadClientZip)

  const resolveStep = useTaskStore((store) => store.resolveStep)

  const [searchParams, setSearchParams] = useSearchParams()
  const [selectingFile, setSelectingFile] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uiState, setUiState] = useState({
    refreshingClients: false
  })

  if (initialRender) {
    getClients()
    initialRender = false
  }

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

  const handleRefreshData = async (): Promise<void> => {
    if (!uiState.refreshingClients) {
      setUiState((prev) => ({
        ...prev,
        refreshingClients: true
      }))
      await refresh(false)
      setTimeout(
        () => {
          setUiState((prev) => ({
            ...prev,
            refreshingClients: false
          }))
        },
        Math.random() * 2000 + 1500
      )
    }
  }

  const openClientSettings = (): void => {
    searchParams.set('settings', 'true')
    searchParams.set('page', 'client')
    setSearchParams(searchParams)
  }

  return (
    <div className="flex h-full w-full">
      <ProgressOverlay
        channel={ProgressChannel.IPC_CLIENT}
        onError={() => setLoading(false)}
        onClose={() => {
          setLoading(false)
          resolveStep('client', 'download')
        }}
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
            onClick={handleRefreshData}
            className="hover:bg-zinc-900"
            disabled={uiState.refreshingClients}
          >
            <IconRefresh className={`${uiState.refreshingClients ? 'animate-spin-smooth' : ''}`} strokeWidth={1.5} />
            <p className="md:block xs:hidden flex-grow xs:text-center">
              Refresh<span className="hidden group-disabled:block">ing</span>
            </p>
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
          <div className="absolute inset w-full h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-4">
            {clientReleases.length > 0 ? (
              clientReleases.map((release) => (
                <ClientDownloadCard 
                  key={release.id}
                  clientRelease={release}
                  loading={loading}
                  setLoading={setLoading}
                />
              ))
            ) : (
              <div className="w-full h-full flex flex-col justify-center items-center col-span-full">
                <h1 className="text-2xl font-semibold">Uh oh-</h1>
                <p>Unable to find or fetch releases</p>
                <Button onClick={() => refresh(false)} className="p-2 bg-zinc-800 hover:bg-zinc-900 gap-2">
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