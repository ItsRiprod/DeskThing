import React, { useState } from 'react'
import { ClientLatestServer, PastReleaseInfo } from '@shared/types'
import Button from '@renderer/components/Button'
import { IconDownload, IconLogoGear, IconTrash } from '@renderer/assets/icons'
import { ClientLatestJSONLatest } from '@deskthing/types'
import Overlay from '../Overlay'
interface ReleaseHistoryModalProps {
  clientReleaseServer: ClientLatestServer
  onClose: () => void
  onRemove: () => Promise<void>
  onDownload: (release: ClientLatestJSONLatest | PastReleaseInfo) => Promise<void>
}

export const ClientReleaseHistoryModal: React.FC<ReleaseHistoryModalProps> = ({
  clientReleaseServer: clientReleaseServer,
  onClose,
  onRemove,
  onDownload
}) => {
  const [confirmDownload, setConfirmDownload] = useState<
    ClientLatestJSONLatest | PastReleaseInfo | null
  >(null)

  const handleRemoveApp = async (): Promise<void> => {
    await onRemove()
    onClose()
  }

  const formatSize = (size: number): string => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
    return `${(size / (1024 * 1024)).toFixed(2)} MB`
  }

  const handleDownload = async (
    release: ClientLatestJSONLatest | PastReleaseInfo
  ): Promise<void> => {
    if (release === clientReleaseServer.mainRelease) {
      onClose()
      await onDownload(release)
    } else {
      setConfirmDownload(release)
    }
  }

  return (
    <Overlay
      onClose={onClose}
      className="w-5/6 flex bg-neutral-900 flex-col max-h-[75vh] overflow-y-hidden max-w-[400px]"
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
          {/* The top header with information */}
          {clientReleaseServer.mainRelease?.icon ? (
            <img
              src={clientReleaseServer.mainRelease.icon}
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
              {clientReleaseServer.mainRelease?.clientManifest?.name ||
                clientReleaseServer.mainRelease?.clientManifest?.id ||
                clientReleaseServer.id ||
                'Unknown App'}
            </h2>
            <p className="text-gray-400">
              {clientReleaseServer?.mainRelease?.clientManifest?.description}
            </p>
            <p className="text-gray-400 text-sm">
              Created by{' '}
              {clientReleaseServer?.mainRelease?.clientManifest?.author || 'unknown author'}
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
                  {clientReleaseServer.mainRelease?.clientManifest?.version || 'Latest'}
                </span>
                <span className="bg-emerald-500 text-xs px-2 py-1 rounded">LATEST</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {clientReleaseServer.mainRelease?.clientManifest?.description}
              </p>
              <div className="flex-1">
                <div className="text-sm text-gray-400">
                  {clientReleaseServer.mainRelease.downloads.toLocaleString()} downloads •{' '}
                  {formatSize(clientReleaseServer.mainRelease.size)}
                </div>
              </div>
            </div>
            <Button
              onClick={() => handleDownload(clientReleaseServer.mainRelease)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <IconDownload />
              {clientReleaseServer.mainRelease?.size &&
                formatSize(clientReleaseServer.mainRelease.size)}
            </Button>
          </div>
        </div>

        {/* Past Releases */}
        {clientReleaseServer.pastReleases?.map((release, index) => (
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
