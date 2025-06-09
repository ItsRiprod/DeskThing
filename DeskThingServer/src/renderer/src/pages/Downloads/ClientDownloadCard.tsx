import { ClientLatestJSONLatest } from '@deskthing/types'
import { IconDownload, IconExpand, IconLogoGear } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import { ReleaseHistoryModal } from '@renderer/overlays/releases/AppReleaseOverlay'
import { useClientStore, useReleaseStore } from '@renderer/stores'
import { ClientLatestServer, PastReleaseInfo } from '@shared/types'
import { FC, useState } from 'react'

type ClientDownloadCardProps = {
  clientRelease: ClientLatestServer
  loading: boolean
  setLoading: (loading: boolean) => void
}

export const ClientDownloadCard: FC<ClientDownloadCardProps> = ({ clientRelease, loading, setLoading }) => {
  const [showPastReleases, setShowPastReleases] = useState<boolean>(false)

  const downloadClient = useReleaseStore((releaseStore) => releaseStore.downloadClient)
  const loadClientUrl = useClientStore((clientStore) => clientStore.loadClientUrl)
  const requestClientManifest = useClientStore((clientStore) => clientStore.requestClientManifest)

  const formatSize = (size: number): string => {
    if (size < 1024) {
      return `${size} B`
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`
    } else {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`
    }
  }

  const handleDownload = async (release: ClientLatestJSONLatest | PastReleaseInfo): Promise<void> => {
    setLoading(true)
    try {
      if ('meta_type' in release) {
        await downloadClient(release.clientManifest.id)
        await requestClientManifest()
      } else {
        await loadClientUrl(release.download_url)
        await requestClientManifest()
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
    <div className="w-full relative p-4 border rounded-xl border-zinc-900 bg-zinc-950">
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
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-xl bg-zinc-900 flex items-center justify-center">
            <IconLogoGear className="w-16 h-16 text-zinc-300" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-2xl mb-2">
            {latestRelease?.clientManifest?.name || latestRelease?.clientManifest?.id || 'Unknown Client'}
          </h3>
          <div className="text-gray-400">
            <div>Version {latestRelease?.clientManifest?.version || 'N/A'}</div>
            <div>{clientRelease?.totalDownloads?.toLocaleString() || 0} downloads</div>
          </div>
        </div>

        <div className="w-full space-y-4">
          <Button
            title="Download Latest"
            onClick={() => handleDownload(latestRelease)}
            className="w-full gap-2 group justify-center hover:bg-zinc-900"
            disabled={loading}
          >
            <p className="group-hover:hidden">Download Latest</p>
            <p className="group-hover:block hidden">
              {latestRelease?.size ? formatSize(latestRelease.size) : 'N/A'}{' '}
            </p>
            <IconDownload />
          </Button>
        </div>

        {showPastReleases && (
          <ReleaseHistoryModal
            onClose={handleShowPastReleases}
            onDownload={handleDownload}
            appReleaseServer={clientRelease}
          />
        )}
      </div>
    </div>
  )
}