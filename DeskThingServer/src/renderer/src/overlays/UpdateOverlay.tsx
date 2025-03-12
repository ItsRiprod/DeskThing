import { IconArrowRight, IconLink, IconLoading, IconX } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import useUpdateStore from '@renderer/stores/updateStore'
import { UpdateProgressType } from '@shared/types'
import DOMPurify from 'dompurify'
import React, { useEffect, useState } from 'react'

const UpdateOverlay: React.FC = () => {
  const update = useUpdateStore((state) => state.update)
  const download = useUpdateStore((state) => state.downloadUpdate)
  const install = useUpdateStore((state) => state.quitAndInstall)
  const check = useUpdateStore((state) => state.checkForUpdates)
  const updateStatus = useUpdateStore((state) => state.updateStatus)
  const [expanded, setExpanded] = useState(false)
  const [progress, setProgress] = useState<UpdateProgressType | undefined>()

  const handleCheckClick = (): void => {
    check()
  }

  const handleDownloadClick = (): void => {
    download()
    if (progress == undefined) {
      setProgress({
        total: 0,
        transferred: 0,
        percent: 0,
        speed: 0
      })
    }
  }

  useEffect(() => {
    if (update.failed) {
      setProgress(undefined)
    }
  }, [update.failed])

  const handleInstallClick = (): void => {
    install()
  }

  useEffect(() => {
    const handleUpdateProgress = (_event, data: UpdateProgressType): void => {
      setProgress(data)
    }

    window.electron.ipcRenderer.on('update-progress', handleUpdateProgress)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('update-progress')
    }
  }, [])

  const handleClose = (): void => {
    updateStatus({
      updateAvailable: false,
      updateDownloaded: false
    })
  }

  return (
    <div className="fixed border gap-2 bottom-5 right-5 bg-black p-5 flex flex-col text-white rounded-md shadow-md z-50 max-h-screen">
      <div className="absolute top-1 right-1 hover:text-red-500">
        <Button onClick={handleClose}>
          <IconX />
        </Button>
      </div>
      <h2 className={`text-3xl mr-10 ${update.failed ? 'text-red-500' : 'text-green-500'}`}>
        {update.failed ? 'Update Failed :(' : `Release ${update.releaseName} is available`}
      </h2>
      <div className="flex w-full justify-between">
        {(update.releaseDate || update.version) && (
          <div>
            <p className="italic text-gray-600">Released: {update.releaseDate}</p>
            <p className="italic text-gray-600">Version: {update.version}</p>
          </div>
        )}
        <div>
          {progress !== undefined && !update.failed && (
            <div className="italic text-gray-500 text-xs font-geistMono">
              <p>Downloading... {progress.percent.toFixed(2)}%</p>
              <p>{(progress.speed / 1048576).toFixed(2)} Mbps</p>
              <p>
                {(progress.transferred / 1048576).toFixed(2)}MB /{' '}
                {(progress.total / 1048576).toFixed(2)}MB
              </p>
            </div>
          )}
          {update.failed ? (
            <div className="flex gap-2 justify-between">
              <Button
                className="rounded-lg border border-green-500 gap-2 hover:bg-green-500 hover:text-white"
                href="https://deskthing.app/releases"
                target="_blank"
              >
                <p>Download From Site</p>
                <IconLink />
              </Button>
            </div>
          ) : update.updateDownloaded ? (
            <Button
              className="rounded-lg border border-green-500 hover:bg-green-500 hover:text-white"
              onClick={handleInstallClick}
            >
              <p>Install Now</p>
              <IconArrowRight />
            </Button>
          ) : update.updateAvailable ? (
            <Button
              className={`rounded-lg gap-2 border border-green-500 ${progress == undefined && 'hover:bg-green-500 hover:text-white'}`}
              onClick={handleDownloadClick}
              disabled={progress !== undefined}
            >
              <p className={progress != undefined ? 'text-gray-500' : ''}>Download Now</p>
              {progress !== undefined ? <IconLoading /> : <IconArrowRight />}
            </Button>
          ) : (
            <Button
              className="rounded-lg border border-green-500 hover:bg-green-500 hover:text-white"
              onClick={handleCheckClick}
            >
              <p>Check for Updates</p>
              <IconArrowRight />
            </Button>
          )}
        </div>
      </div>
      <div className="relative flex flex-col max-h-full overflow-auto">
        <p>{update.failed ? 'Fail Reason:' : `Release Notes:`}</p>
        {(update.releaseNotes || update.failed) && (
          <div className="relative text-gray-500 flex flex-col">
            {update.failed ? (
              <div
                className={`prose prose-invert prose-sm max-w-lg break-words ${!expanded ? 'max-h-[50px] overflow-hidden' : 'overflow-y-auto max-h-full'}`}
              >
                {update.error}
              </div>
            ) : (
              update.releaseNotes && (
                <div
                  className={`prose prose-invert prose-sm max-w-none ${!expanded ? 'max-h-[50px] overflow-hidden' : 'overflow-y-auto max-h-full'}`}
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(update.releaseNotes)
                  }}
                />
              )
            )}
            {!expanded && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black to-transparent" />
            )}
            <Button
              className="text-blue-400 hover:text-blue-300 mt-2"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show less' : 'Show more'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
export default UpdateOverlay
