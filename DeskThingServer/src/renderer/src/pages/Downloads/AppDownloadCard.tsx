import { AppLatestJSONLatest } from '@deskthing/types'
import { IconDownload, IconExpand, IconLogoGear } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import { AppReleaseHistoryModal } from '@renderer/overlays/releases/AppReleaseOverlay'
import { useAppStore, useReleaseStore } from '@renderer/stores'
import { AppLatestServer, PastReleaseInfo } from '@shared/types'
import { FC, useState } from 'react'

type AppReleaseCardProps = {
  appReleaseServer: AppLatestServer
}

export const AppReleaseCard: FC<AppReleaseCardProps> = ({ appReleaseServer }) => {
  const [showPastReleases, setShowPastReleases] = useState<boolean>(false)

  const downloadApp = useReleaseStore((releaseStore) => releaseStore.downloadApp)
  const addStagedManifest = useAppStore((appStore) => appStore.setStagedManifest)
  const addApp = useAppStore((appStore) => appStore.addApp)
  const removeAppRelease = useReleaseStore((releaseStore) => releaseStore.removeAppRelease)

  const handleRemove = (): Promise<void> => {
    return removeAppRelease(appReleaseServer.id)
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

  const handleDownload = async (asset: AppLatestJSONLatest | PastReleaseInfo): Promise<void> => {
    console.log('Handling download of ', asset)
    if ('meta_type' in asset) {
      const manifest = await downloadApp(asset.appManifest.id)
      if (manifest) {
        addStagedManifest(manifest)
      }
    } else {
      const manifest = await addApp({ appPath: asset.download_url })
      if (manifest) {
        addStagedManifest(manifest)
      }
    }
  }

  const handleShowPastReleases = (): void => {
    setShowPastReleases(!showPastReleases)
  }

  const latestRelease = appReleaseServer.mainRelease

  return (
    <div>
      <div className="w-full relative p-4 border rounded-xl border-zinc-900 bg-zinc-950 hover:scale-[1.01] transition-all duration-300 hover:shadow-emerald-500">
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
                  className="w-24 h-24 rounded-xl object-cover invert"
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
              className="w-full gap-2 group justify-center hover:bg-zinc-900"
            >
              <p className="group-hover:hidden">Download Latest</p>
              <p className="group-hover:block hidden">
                {latestRelease?.size ? formatSize(latestRelease.size) : 'N/A'}{' '}
              </p>
              <IconDownload />
            </Button>
          </div>
        </div>
      </div>
      {showPastReleases && (
        <AppReleaseHistoryModal
          onClose={handleShowPastReleases}
          onDownload={handleDownload}
          onRemove={handleRemove}
          appReleaseServer={appReleaseServer}
        />
      )}
    </div>
  )
}
