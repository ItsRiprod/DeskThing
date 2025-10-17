import { AppLatestJSONLatest } from '@deskthing/types'
import { IconDownload, IconExpand, IconLoading, IconLogoGear } from '@renderer/assets/icons'
import Button from '@renderer/components/buttons/Button'
import { DownloadErrorOverlay } from '@renderer/overlays/DownloadErrorOverlay'
import { AppReleaseHistoryModal } from '@renderer/overlays/releases/AppReleaseOverlay'
import { useAppStore, useReleaseStore } from '@renderer/stores'
import { AppLatestServer, PastReleaseInfo } from '@shared/types'
import { FC, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

type AppReleaseCardProps = {
  appReleaseServer: AppLatestServer
}

export const AppReleaseCard: FC<AppReleaseCardProps> = ({ appReleaseServer }) => {
  const [searchParams, setSearchParams] = useSearchParams()

  const downloadApp = useReleaseStore((releaseStore) => releaseStore.downloadApp)
  const addStagedManifest = useAppStore((appStore) => appStore.setStagedManifest)
  const addApp = useAppStore((appStore) => appStore.addApp)
  const removeAppRelease = useReleaseStore((releaseStore) => releaseStore.removeAppRelease)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(false)

  const handleRemove = (): Promise<void> => {
    return removeAppRelease(appReleaseServer.id)
  }

  const handleDownload = async (asset: AppLatestJSONLatest | PastReleaseInfo): Promise<void> => {
    setDownloadError(null)
    setIsLoading(true)
    if ('meta_type' in asset) {
      const appReturnData = await downloadApp(asset.appManifest.id)
      if (appReturnData.success) {
        addStagedManifest(appReturnData.appManifest)
      } else {
        setDownloadError(appReturnData.message || 'Unknown error during download')
      }
    } else {
      const manifest = await addApp({ appPath: asset.download_url })
      if (manifest.success) {
        addStagedManifest(manifest.appManifest)
      } else {
        setDownloadError(manifest.message || 'Unknown error during download')
      }
    }
    setIsLoading(false)
  }

  const handleShowPastReleases = (): void => {
    const currentId = searchParams.get('download_page')
    if (currentId === latestRelease.appManifest.id) {
      searchParams.delete('download_page')
    } else {
      searchParams.set('download_page', latestRelease.appManifest.id)
    }
    setSearchParams(searchParams)
  }

  const latestRelease = appReleaseServer.mainRelease

  return (
    <>
      <div className="w-full relative p-4 border rounded-xl border-zinc-900 bg-zinc-950 transition-all duration-300 group hover:shadow-emerald-500/40 hover:border-emerald-400 hover:bg-gradient-to-br hover:from-zinc-950 hover:to-emerald-950 hover:scale-[1.01] hover:-translate-y-0.5">
        {isLoading ? (
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
                {latestRelease?.icon ? (
                  <img
                    src={latestRelease.icon}
                    alt={latestRelease.appManifest?.label || 'App icon'}
                    className="w-24 h-24 rounded-xl object-cover invert transition-all duration-300 group-hover:scale-105 group-hover:shadow-emerald-400/30"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-zinc-900 flex items-center justify-center">
                    <IconLogoGear className="w-16 h-16 text-zinc-300" />
                  </div>
                )}
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl mb-2">
                  {latestRelease?.appManifest?.label ||
                    latestRelease?.appManifest?.id ||
                    'Unknown App'}
                </h3>
                <div className="text-gray-400">
                  <div>Version {latestRelease?.appManifest?.version || 'N/A'}</div>
                  <div>{appReleaseServer?.totalDownloads?.toLocaleString() || 0} downloads</div>
                  {appReleaseServer.mainRelease.appManifest.author && (
                    <div>Made By {appReleaseServer.mainRelease.appManifest.author}</div>
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
              >
                <p className="group-hover:text-emerald-400 transition-all duration-300">
                  Download Latest
                </p>
                <IconDownload className="transition-all duration-300 group-hover:text-emerald-400 group-hover:scale-110 group-hover:rotate-12" />
              </Button>
            </div>
          </div>
        )}
      </div>
      {searchParams.get('download_page') === latestRelease.appManifest.id && (
        <AppReleaseHistoryModal
          onDownload={handleDownload}
          onRemove={handleRemove}
          appReleaseServer={appReleaseServer}
        />
      )}
      {downloadError && (
        <DownloadErrorOverlay
          error={downloadError}
          onAcknowledge={() => setDownloadError(null)}
          title={`Failed to load App: ${latestRelease?.appManifest?.label || 'Unknown App'}`}
        />
      )}
    </>
  )
}
