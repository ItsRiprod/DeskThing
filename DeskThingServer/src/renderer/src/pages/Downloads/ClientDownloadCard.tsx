import { ClientLatestJSONLatest } from '@deskthing/types'
import { IconDownload, IconExpand, IconLoading, IconLogoGear } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import { DownloadErrorOverlay } from '@renderer/overlays/DownloadErrorOverlay'
import { ClientReleaseHistoryModal } from '@renderer/overlays/releases/ClientReleaseOverlay'
import { useClientStore, useReleaseStore } from '@renderer/stores'
import { ClientLatestServer, PastReleaseInfo } from '@shared/types'
import { FC, useState } from 'react'

type ClientDownloadCardProps = {
  clientRelease: ClientLatestServer
  loading: boolean
  setLoading: (loading: boolean) => void
}

export const ClientDownloadCard: FC<ClientDownloadCardProps> = ({
  clientRelease,
  loading,
  setLoading
}) => {
  const [showPastReleases, setShowPastReleases] = useState<boolean>(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const downloadClient = useReleaseStore((releaseStore) => releaseStore.downloadClient)
  const loadClientUrl = useClientStore((clientStore) => clientStore.loadClientUrl)
  const removeClientRelease = useReleaseStore((releaseStore) => releaseStore.removeClientRelease)

  const handleRemove = (): Promise<void> => {
    return removeClientRelease(clientRelease.id)
  }

  const formatSize = (size: number): string => {
    if (size < 1024) {
      return `${size} B`
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`
    } else {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`
    }
  }

  const handleDownload = async (
    release: ClientLatestJSONLatest | PastReleaseInfo
  ): Promise<void> => {
    setLoading(true)
    try {
      if ('meta_type' in release) {
        const result = await downloadClient(release.clientManifest.id)
        if (!result.success) {
          setDownloadError(result.message || 'Unknown error during download')
        }
      } else {
        const downloadResult = await loadClientUrl(release.download_url)
        if (!downloadResult.success) {
          setDownloadError(downloadResult.message || 'Unknown error during download')
        }
      }
    } catch (error) {
      console.error('Failed to download client:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShowPastReleases = (): void => {
    setShowPastReleases(!showPastReleases)
  }

  const latestRelease = clientRelease.mainRelease

  return (
    <div>
      <div className="w-full flex-grow relative p-4 border rounded-xl border-zinc-900 bg-zinc-950 transition-all duration-300 group hover:shadow-emerald-500/40 hover:border-emerald-400 hover:bg-gradient-to-br hover:from-zinc-950 hover:to-emerald-950 hover:scale-[1.01] hover:-translate-y-0.5">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <IconLoading className="w-16 h-16 text-emerald-300 animate-spin-smooth" />
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="absolute top-2 right-2">
              <Button
                title="View history"
                onClick={handleShowPastReleases}
                className="w-full flex items-center justify-center gap-2 hover:bg-zinc-900"
              >
                <IconExpand />
              </Button>
            </div>
            <button onClick={handleShowPastReleases} className="w-full h-full">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-xl bg-zinc-900 flex items-center justify-center">
                  <IconLogoGear className="w-16 h-16 text-zinc-300" />
                </div>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl mb-2">
                  {latestRelease?.clientManifest?.name ||
                    latestRelease?.clientManifest?.id ||
                    'Unknown Client'}
                </h3>
                <div className="text-gray-400">
                  <div>Version {latestRelease?.clientManifest?.version || 'N/A'}</div>
                  <div>{clientRelease?.totalDownloads?.toLocaleString() || 0} downloads</div>
                  {latestRelease?.clientManifest?.author && (
                    <div>Written By {latestRelease.clientManifest.author}</div>
                  )}
                </div>
              </div>
            </button>
            <div className="w-full space-y-4">
              <Button
                title="Download Latest"
                onClick={() => handleDownload(latestRelease)}
                className="w-full gap-2 group justify-center hover:bg-zinc-900 transition-all duration-300 group-hover:scale-105 group-hover:shadow-emerald-400 group-hover:bg-gradient-to-br group-hover:from-zinc-950/50 group-hover:to-emerald-950/50"
                style={{ borderRadius: '0.75rem', borderWidth: 1, borderColor: 'transparent' }}
                disabled={loading}
              >
                <p className="group-hover:text-emerald-400 transition-all duration-300">
                  Download Latest
                </p>
                <IconDownload className="transition-all duration-300 group-hover:text-emerald-400 group-hover:scale-110 group-hover:rotate-12" />
              </Button>
              <div className="text-xs text-zinc-400 text-center">
                {latestRelease?.size ? formatSize(latestRelease.size) : 'N/A'}
              </div>
            </div>
          </div>
        )}
      </div>
      {showPastReleases && (
        <ClientReleaseHistoryModal
          onClose={handleShowPastReleases}
          onDownload={handleDownload}
          onRemove={handleRemove}
          clientReleaseServer={clientRelease}
        />
      )}
      {downloadError && (
        <DownloadErrorOverlay
          error={downloadError}
          onAcknowledge={() => setDownloadError(null)}
          title={`Failed to load Client: ${latestRelease?.clientManifest?.name || 'Unknown Client'}`}
        />
      )}
    </div>
  )
}
