import React, { useState } from 'react'
import Sidebar from '@renderer/nav/Sidebar'
import Button from '@renderer/components/Button'
import {
  IconDownload,
  IconLink,
  IconLoading,
  IconLogs,
  IconPlay,
  IconUpload
} from '@renderer/assets/icons'
import { useAppStore, useGithubStore, usePageStore } from '@renderer/stores'
import MainElement from '@renderer/nav/MainElement'
import { AppReturnData } from '@shared/types'
import DownloadNotification from '@renderer/overlays/DownloadNotification'
import Overlay from '@renderer/overlays/Overlay'

const AppDownloads: React.FC = () => {
  // Getting releases to show
  const appReleases = useGithubStore((githubStore) => githubStore.appReleases)
  const extractNameDetails = useGithubStore((githubStore) => githubStore.extractReleaseDetails)

  // Running apps
  const loadAppUrl = useAppStore((appStore) => appStore.loadAppUrl)
  const loadAppZip = useAppStore((appStore) => appStore.loadAppZip)
  const runApp = useAppStore((appStore) => appStore.runApp)
  const logging = useAppStore((appStore) => appStore.logging)

  // Displaying overlays
  const [showLogging, setShowLogging] = useState(false)
  const [appReturnData, setAppReturnData] = useState<AppReturnData | null>(null)
  const [selectingFile, setSelectingFile] = useState(false)

  // Displaying available downloads
  const [appDownloads, setAppDownloads] = useState<string | null>(null)

  // Navigation
  const setPage = usePageStore((pageStore) => pageStore.setPage)

  const gotoClientDownloads = (): void => {
    setPage('Downloads/Client')
  }

  const handleDownloadFinalized = (): void => {
    setShowLogging(false)
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDownloadClick = async (url: string): Promise<void> => {
    setShowLogging(true)
    setAppDownloads(null)
    try {
      const returnData = await loadAppUrl(url)
      setAppReturnData(returnData)
    } catch (error) {
      await setTimeout(() => setShowLogging(false), 2000)
    }
  }

  const handleDownloadLatestClick = async (name: string): Promise<void> => {
    const latest = appReleases[name].reduce((latest, current) =>
      new Date(current.updated_at) > new Date(latest.updated_at) ? current : latest
    )

    handleDownloadClick(latest.browser_download_url)
  }

  const handleMoreDownloadsClick = (App: string): void => {
    setAppDownloads(App)
  }

  return (
    <div className="flex h-full w-full">
      {logging && showLogging && (
        <DownloadNotification loggingData={logging} onClose={handleDownloadFinalized} />
      )}
      {appDownloads && (
        <Overlay
          onClose={() => setAppDownloads(null)}
          className="border border-gray-500 lg:w-[960px] w-4/5 h-5/6 p-5 flex flex-col"
        >
          <div className="text-2xl py-5">
            {appDownloads.charAt(0).toUpperCase() + appDownloads.slice(1).toLowerCase()} App
            Downloads
          </div>
          <div className="w-full h-full overflow-y-auto">
            <div className="w-full h-full flex flex-col gap-2">
              {appReleases[appDownloads] &&
                appReleases[appDownloads].map((release, index) => {
                  const appDetails = extractNameDetails(release.name)
                  const fileSize = formatFileSize(release.size)

                  return (
                    <div
                      className="flex flex-row justify-between items-center bg-zinc-900 px-3 p-2 rounded"
                      key={index}
                    >
                      <div className="">
                        <div className="flex items-center">
                          <h1 className="text-2xl font-semibold">
                            {appDetails.name.charAt(0).toUpperCase() +
                              appDetails.name.slice(1).toLowerCase()}
                          </h1>
                          <p className="italic text-gray-500">
                            {appDetails.version.replace('.zip', '')}
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
      <Sidebar className="flex justify-end flex-col h-full max-h-full md:items-stretch items-center">
        <div>
          <div className="flex flex-col gap-2">
            <Button onClick={handleUploadClick} className="hover:bg-zinc-900">
              {selectingFile ? <IconLoading strokeWidth={1.5} /> : <IconUpload strokeWidth={1.5} />}
              <p className="md:block hidden text-center flex-grow">Upload App</p>
            </Button>
            <Button onClick={gotoClientDownloads} className="hover:bg-zinc-900">
              <IconLink strokeWidth={1.5} />
              <p className="md:block hidden text-center flex-grow">Clients</p>
            </Button>
          </div>
        </div>
      </Sidebar>
      <MainElement className="p-4">
        <div className="w-full h-full relative overflow-y-auto flex flex-col">
          <div className="absolute inset w-full h-full flex flex-col gap-2">
            {Object.keys(appReleases).map((name) => (
              <div
                key={name}
                className="flex bg-zinc-900 rounded-lg justify-between items-center p-2"
              >
                <div>
                  <h1 className="text-xl">
                    {name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()} App
                  </h1>
                  <p className="text-sm text-gray-500">
                    {appReleases[name].length} available downloads
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button className="group gap-2" onClick={() => handleDownloadLatestClick(name)}>
                    <p className="group-hover:block hidden text-center flex-grow">
                      Download Latest
                    </p>
                    <IconDownload className="group-hover:stroke-2 stroke-1" />
                  </Button>
                  <Button className="group gap-2" onClick={() => handleMoreDownloadsClick(name)}>
                    <p className="group-hover:block hidden text-center flex-grow">More Downloads</p>
                    <IconLogs className="group-hover:stroke-2 stroke-1" />
                  </Button>
                </div>
              </div>
            ))}{' '}
          </div>
        </div>
      </MainElement>
    </div>
  )
}

export default AppDownloads
