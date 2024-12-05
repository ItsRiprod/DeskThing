import React, { useState } from 'react'
import Sidebar from '@renderer/nav/Sidebar'
import Button from '@renderer/components/Button'
import {
  IconGear,
  IconLink,
  IconUpload,
  IconDownload,
  IconLogs,
  IconLoading,
  IconRefresh
} from '@renderer/assets/icons'
import { useClientStore, useGithubStore, usePageStore } from '@renderer/stores'
import MainElement from '@renderer/nav/MainElement'
import DownloadNotification from '@renderer/overlays/DownloadNotification'
import Overlay from '@renderer/overlays/Overlay'
import { useSearchParams } from 'react-router-dom'

const ClientDownloads: React.FC = () => {
  const clientReleases = useGithubStore((githubStore) => githubStore.clientReleases)
  const extractReleaseDetails = useGithubStore((githubStore) => githubStore.extractReleaseDetails)
  const installedClient = useClientStore((clientStore) => clientStore.clientManifest)
  const refreshClient = useClientStore((clientStore) => clientStore.requestClientManifest)
  const [clientRefreshing, setClientRefreshing] = useState(false)
  // Running clients
  const loadClientUrl = useClientStore((clientStore) => clientStore.loadClientUrl)
  const loadClientZip = useClientStore((clientStore) => clientStore.loadClientZip)
  const logging = useClientStore((clientStore) => clientStore.logging)

  const [searchParams, setSearchParams] = useSearchParams()
  // Displaying overlays
  const [showLogging, setShowLogging] = useState(false)
  const [selectingFile, setSelectingFile] = useState(false)
  const [loading, setLoading] = useState(false)

  // Displaying available downloads
  const [clientDownloads, setClientDownloads] = useState<string | null>(null)

  // Navigation
  const setPage = usePageStore((pageStore) => pageStore.setPage)

  const gotoAppDownloads = (): void => {
    setPage('Downloads/App')
  }

  const handleUploadClick = async (): Promise<void> => {
    setSelectingFile(true)
    setLoading(true)
    const file = await window.electron.selectZipFile()
    setLoading(false)
    setSelectingFile(false)
    if (file) {
      setLoading(true)
      setShowLogging(true)
      try {
        await loadClientZip(file)
      } catch (error) {
        // Handle error
      } finally {
        setTimeout(() => {
          setLoading(false)
          setShowLogging(false)
        }, 5000)
      }
    }
  }

  const handleDownloadFinalized = (): void => {
    setShowLogging(false)
  }

  const handleDownloadClick = async (url: string): Promise<void> => {
    setShowLogging(true)
    setLoading(true)
    setClientDownloads(null)
    try {
      await loadClientUrl(url)
      await setTimeout(() => {
        setLoading(false)
      }, 2000)
    } catch (error) {
      await setTimeout(() => {
        setLoading(false)
        setShowLogging(false)
      }, 2000)
    }
  }

  const handleDownloadLatestClick = async (name: string): Promise<void> => {
    if (clientReleases[name] && clientReleases[name].length > 0) {
      const latest = clientReleases[name].reduce((latest, current) =>
        new Date(current.updated_at) > new Date(latest.updated_at) ? current : latest
      )
      handleDownloadClick(latest.browser_download_url)
    }
  }

  const handleMoreDownloadsClick = (name: string): void => {
    setClientDownloads(name)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const onRefreshClick = async (): Promise<void> => {
    refreshClient()
    setClientRefreshing(true)
    setTimeout(() => setClientRefreshing(false), Math.random() * 1500 + 500)
  }

  const openClientSettings = (): void => {
    searchParams.set('settings', 'true')
    searchParams.set('page', 'client')
    setSearchParams(searchParams)
  }

  return (
    <div className="flex h-full w-full">
      {logging && showLogging && (
        <DownloadNotification
          title="Loading Client..."
          loggingData={logging}
          onClose={handleDownloadFinalized}
        />
      )}
      {clientDownloads && (
        <Overlay
          onClose={() => setClientDownloads(null)}
          className="border border-gray-500 w-4/5 lg:w-[960px] h-5/6 p-5 flex flex-col"
        >
          <div className="text-2xl py-5">
            {clientDownloads.charAt(0).toUpperCase() + clientDownloads.slice(1).toLowerCase()}{' '}
            Client Downloads
          </div>
          <div className="w-full h-full overflow-y-auto">
            <div className="w-full h-full flex flex-col gap-2">
              {clientReleases[clientDownloads] &&
                clientReleases[clientDownloads].map((release, index) => {
                  const clientDetails = extractReleaseDetails(release.name)
                  const fileSize = formatFileSize(release.size)

                  return (
                    <div
                      className="flex flex-row justify-between items-center bg-zinc-900 px-3 p-2 rounded"
                      key={index}
                    >
                      <div className="">
                        <div className="flex items-center">
                          <h1 className="text-2xl font-semibold">
                            {clientDetails.name.charAt(0).toUpperCase() +
                              clientDetails.name.slice(1).toLowerCase()}
                          </h1>
                          <p className="italic text-gray-500">
                            {clientDetails.version.replace('.zip', '')}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">{release.download_count} Downloads</p>
                        <p className="text-xs text-gray-500">
                          Uploaded {new Date(release.created_at).toDateString()}
                        </p>
                      </div>
                      <div>
                        <Button
                          className="group gap-2"
                          onClick={() => handleDownloadClick(release.browser_download_url)}
                        >
                          <p className="group-hover:block hidden text-center flex-grow">
                            Download {fileSize}
                          </p>
                          <IconDownload className="group-hover:stroke-2 stroke-1" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </Overlay>
      )}
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
                <p>{installedClient.version_code}</p>
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
            {Object.keys(clientReleases).length > 0 ? (
              Object.keys(clientReleases).map((name) => (
                <div
                  key={name}
                  className="flex bg-zinc-900 rounded-lg justify-between items-center p-2"
                >
                  <div>
                    <h1 className="text-xl">
                      {name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()} Client
                    </h1>
                    <p className="text-sm text-gray-500">
                      {clientReleases[name].length} available downloads
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="group gap-2"
                      onClick={() => handleDownloadLatestClick(name)}
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
                    <Button
                      className="group gap-2"
                      onClick={() => handleMoreDownloadsClick(name)}
                      disabled={loading}
                    >
                      <p className="group-hover:block hidden text-center flex-grow">
                        More Downloads
                      </p>
                      <IconLogs className="group-hover:stroke-2 stroke-1" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex flex-col justify-center items-center">
                <h1 className="text-2xl font-semibold">Uh oh-</h1>
                <p>Unable to find or fetch releases</p>
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
