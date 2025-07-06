import React, { useState } from 'react'
import { AppLatestServer, PastReleaseInfo } from '@shared/types'
import Button from '@renderer/components/Button'
import { IconDownload, IconLogoGear, IconTrash } from '@renderer/assets/icons'
import { AppLatestJSONLatest } from '@deskthing/types'
import Overlay from '../Overlay'

interface ReleaseHistoryModalProps {
  appReleaseServer: AppLatestServer
  onClose: () => void
  onRemove: () => Promise<void>
  onDownload: (release: AppLatestJSONLatest | PastReleaseInfo) => Promise<void>
}

export const AppReleaseHistoryModal: React.FC<ReleaseHistoryModalProps> = ({
  appReleaseServer,
  onClose,
  onRemove,
  onDownload
}) => {
  const [confirmDownload, setConfirmDownload] = useState<
    AppLatestJSONLatest | PastReleaseInfo | null
  >(null)

  const formatSize = (size: number): string => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
    return `${(size / (1024 * 1024)).toFixed(2)} MB`
  }

  const handleDownload = async (release: AppLatestJSONLatest | PastReleaseInfo): Promise<void> => {
    if (release === appReleaseServer.mainRelease) {
      onClose()
      await onDownload(release)
    } else {
      setConfirmDownload(release)
    }
  }

  const handleRemoveApp = async (): Promise<void> => {
    await onRemove()
    onClose()
  }

  return (
    <Overlay
      onClose={onClose}
      className="w-5/6 min-w-fit flex bg-neutral-900 flex-col max-h-[75vh] overflow-y-hidden max-w-[400px]"
    >
      {confirmDownload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Download Older Version?</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to download an older version of this application?
            </p>
            <div className="flex justify-end gap-4">
              <Button onClick={() => setConfirmDownload(null)} className="hover:bg-zinc-800">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onClose()
                  onDownload(confirmDownload)
                  setConfirmDownload(null)
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Confirm Download
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex p-4 justify-between shadow-xl items-center">
        <div className="flex items-center gap-4">
          {appReleaseServer.mainRelease?.icon ? (
            <img
              src={appReleaseServer.mainRelease.icon}
              alt="App icon"
              className="w-12 h-12 rounded-lg object-cover invert"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center">
              <IconLogoGear />
            </div>
          )}
          <div>
            <h2 className="text-3xl font-semibold">
              {appReleaseServer.mainRelease?.appManifest?.label ||
                appReleaseServer.mainRelease?.appManifest?.id ||
                appReleaseServer.id ||
                'Unknown App'}
            </h2>
            <p className="text-gray-400 break-words w-11/12 text-wrap">
              {appReleaseServer.mainRelease?.appManifest?.description}
            </p>
            <p className="text-gray-400 text-sm">
              Created by {appReleaseServer.mainRelease?.appManifest?.author || 'unknown author'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 max-h-full overflow-y-auto">
        <p className="text-gray-400">Release History</p>
        {/* Latest Release */}
        <div className="border border-emerald-500 rounded-lg p-4 bg-emerald-500/10">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {appReleaseServer.mainRelease?.appManifest?.version || 'Latest'}
                </span>
                <span className="bg-emerald-500 text-xs px-2 py-1 rounded">LATEST</span>
              </div>
              <p className="text-sm text-gray-400 break-words w-11/12 text-wrap mt-1">
                {appReleaseServer.mainRelease?.appManifest?.description}
              </p>
              <div className="flex-1">
                <div className="text-sm text-gray-400">
                  {appReleaseServer.mainRelease.downloads.toLocaleString()} downloads •{' '}
                  {formatSize(appReleaseServer.mainRelease.size)}
                </div>
              </div>
            </div>
            <Button
              onClick={() => handleDownload(appReleaseServer.mainRelease)}
              className="bg-emerald-600 text-nowrap hover:bg-emerald-700"
            >
              <IconDownload />
              {appReleaseServer.mainRelease?.size && formatSize(appReleaseServer.mainRelease.size)}
            </Button>
          </div>
        </div>

        {/* Past Releases */}
        {appReleaseServer.pastReleases?.map((release, index) => (
          <div key={`${release.name}-${index}`} className="border border-zinc-700 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{release.name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(release.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm text-gray-400 mb-2">
                  {release.downloads.toLocaleString()} downloads • {formatSize(release.size)}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button onClick={() => handleDownload(release)} className="hover:bg-zinc-800">
                  <IconDownload />
                </Button>
              </div>
            </div>
          </div>
        ))}
        <div>
          <Button onClick={handleRemoveApp} className="w-full mt-4 bg-red-600 hover:bg-red-700">
            <IconTrash />
            Remove App
          </Button>
        </div>
      </div>
    </Overlay>
  )
}
