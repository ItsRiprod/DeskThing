import React, { useMemo, useState, useEffect } from 'react'
import { AppSettingProps } from './AppsOverlay'
import Button from '@renderer/components/buttons/Button'
import {
  IconDownload,
  IconLoading,
  IconPlay,
  IconRefresh,
  IconToggle
} from '@renderer/assets/icons'
import { LogEntry } from '@renderer/components/LogEntry'
import { ProgressChannel, StagedAppManifest } from '@shared/types'
import { useChannelProgress } from '@renderer/hooks/useProgress'
import { useAppStore, useClientStore, useReleaseStore } from '@renderer/stores'
import { App, PlatformTypes } from '@deskthing/types'
import semverSatisfies from 'semver/functions/satisfies'
import { DownloadErrorOverlay } from '../DownloadErrorOverlay'

type Issues =
  | 'checksum'
  | 'incompatible-platform'
  | 'existing-app'
  | 'compatible-server'
  | 'compatible-client'

type Issue = {
  title: string
  id: Issues
  message: string
  acknowledged: boolean
}

interface CompatibilityResult {
  isCompatible: boolean
  pending: number
  issues: Issue[]
}

const checkCompatibility = (
  manifest: StagedAppManifest,
  existingApps: App[]
): CompatibilityResult => {
  const compResult: CompatibilityResult = {
    isCompatible: true,
    pending: 0,
    issues: []
  }

  const currentPlatform =
    window.electronAPI.platform === 'win32'
      ? PlatformTypes.WINDOWS
      : window.electronAPI.platform === 'darwin'
        ? PlatformTypes.MAC
        : PlatformTypes.LINUX

  if (!manifest.platforms?.includes(currentPlatform)) {
    compResult.isCompatible = false
    compResult.issues.push({
      title: 'Incompatible Platform',
      id: 'incompatible-platform',
      message: `App not compatible with ${currentPlatform} platform`,
      acknowledged: false
    })
  }

  const existingApp = existingApps.find((app) => app.name === manifest.id)

  if (!manifest.checksumValidated) {
    compResult.isCompatible = false
    compResult.issues.push({
      title: 'Insecure App',
      id: 'checksum',
      message: `App has not been validated or updated by DeskThing (It may not work)`,
      acknowledged: false
    })
    compResult.pending++
  }

  if (existingApp) {
    if (!existingApp.manifest) {
      compResult.isCompatible = false
      compResult.issues.push({
        title: 'Old App Malformed',
        id: 'existing-app',
        message: `App with name ${manifest.label} already exists but has no manifest`,
        acknowledged: false
      })
      compResult.pending++
    } else {
      const existingVersion = existingApp.manifest.version
      const incomingVersion = manifest.version
      if (semverSatisfies(incomingVersion, `<=${existingVersion}`)) {
        compResult.isCompatible = false
        compResult.pending++
        compResult.issues.push({
          title: 'App Already Exists',
          id: 'existing-app',
          message: `App with name ${manifest.label} already exists but is older than incoming version ${incomingVersion}`,
          acknowledged: false
        })
      } else {
        compResult.isCompatible = false
        compResult.pending++
        compResult.issues.push({
          title: 'App Already Exists',
          id: 'existing-app',
          message: `App with name ${manifest.label} already exists but is newer than incoming version ${incomingVersion}`,
          acknowledged: false
        })
      }
    }
  }

  if (manifest.requiredVersions) {
    const { server: requiredServer, client: requiredClient } = manifest.requiredVersions
    const currentServerVersion = process.env.PACKAGE_VERSION || '0.0.0'
    const currentClientVersion = useClientStore.getState().clientManifest?.version || '0.0.0'

    if (!semverSatisfies(currentServerVersion, requiredServer)) {
      compResult.pending++
      compResult.isCompatible = false
      compResult.issues.push({
        title: 'compatible-server',
        id: 'compatible-server',
        message: `Server version ${currentServerVersion} incompatible. Requires ${requiredServer}`,
        acknowledged: false
      })
    }

    if (!semverSatisfies(currentClientVersion, requiredClient)) {
      compResult.pending++
      compResult.isCompatible = false
      compResult.issues.push({
        title: 'compatible-client',
        id: 'compatible-client',
        message: `Client version ${currentClientVersion} incompatible. Requires ${requiredClient}`,
        acknowledged: false
      })
    }
  }

  return compResult
}

const AppUpdate: React.FC<AppSettingProps> = ({ app }: AppSettingProps) => {
  const downloadChannel = useChannelProgress(ProgressChannel.IPC_RELEASES)
  const downloadLatest = useReleaseStore((state) => state.downloadApp)
  const appReleases = useReleaseStore((state) => state.appReleases)
  const refreshAppReleases = useReleaseStore((state) => state.refreshReleases)
  const apps = useAppStore((appStore) => appStore.appsList)
  const runStagedApp = useAppStore((appStore) => appStore.runStagedApp)
  const stagedApp = useAppStore((appStore) => appStore.stagedManifest)
  const setStagedManifest = useAppStore((appStore) => appStore.setStagedManifest)

  const [loading, setLoading] = useState(false)
  const [overwrite, setOverwrite] = useState(false)
  const [compatibility, setCompatibility] = useState<CompatibilityResult>({
    isCompatible: true,
    pending: 0,
    issues: []
  })
  const [stagedAppError, setStagedAppError] = useState<string | null>(null)

  const appRelease = useMemo(
    () => appReleases.find((r) => r.id === app.name),
    [appReleases, app.name]
  )

  useEffect(() => {
    if (stagedApp) {
      const result = checkCompatibility(stagedApp, apps)
      setCompatibility(result)
    }
  }, [stagedApp, apps])

  const handleRefresh = async (): Promise<void> => {
    await refreshAppReleases(true)
  }

  const handleDownload = async (): Promise<void> => {
    const stagedApp = await downloadLatest(app.name)
    if (stagedApp.success) {
      setStagedManifest(stagedApp.appManifest)
    } else {
      setStagedAppError(stagedApp.message || 'Unknown error')
    }
  }

  const onRunClick = async (): Promise<void> => {
    setLoading(true)
    runStagedApp(overwrite)
  }

  const toggleOverwrite = (): void => {
    setOverwrite(!overwrite)
  }

  const onAcknowledge = (issue: Issue): void => {
    let removePending = 0
    const updatedIssues = compatibility.issues.map((i) => {
      if (i.title === issue.title) {
        removePending++
        return { ...i, acknowledged: true }
      }
      return i
    })
    setCompatibility((prev) => ({
      ...prev,
      pending: prev.pending - removePending,
      issues: updatedIssues
    }))
  }

  const isExistingApp = compatibility.issues.some((issue) => issue.id === 'existing-app')

  return (
    <div className="w-full h-full flex flex-col">
      {stagedApp ? (
        <div className="p-2 h-full flex flex-col justify-between gap-4 bg-zinc-950 rounded-lg">
          <div className="flex flex-col lg:flex-row gap-4">
            <div>
              <div className="w-full py-4 bg-zinc-900 px-6 rounded-t-lg border-b border-zinc-700">
                <h1 className="text-2xl text-nowrap font-semibold text-green-500 flex items-center gap-2">
                  <IconDownload className="w-6 h-6" />
                  Downloaded v{stagedApp.version.replaceAll('v', '')}
                </h1>
              </div>
              {isExistingApp && (
                <Button
                  onClick={toggleOverwrite}
                  title={`${overwrite ? 'Disable' : 'Enable'} Overwrite`}
                  disabled={loading}
                  className={`${overwrite ? 'text-red-500' : 'text-green-500'} w-full justify-between items-center gap-2 bg-zinc-900 hover:bg-zinc-800 p-4 rounded-lg transition-colors`}
                >
                  <p className="font-medium text-start text-nowrap">
                    Overwrite Existing App Files?
                  </p>
                  <IconToggle checked={overwrite} iconSize={48} />
                </Button>
              )}
            </div>
            {!compatibility.isCompatible && (
              <div className="bg-zinc-900/50 rounded-lg overflow-hidden">
                <h1 className="w-full flex justify-center text-lg py-3 bg-zinc-900 border-b border-zinc-700">
                  Potential Issues Found
                </h1>
                <div className="divide-y divide-zinc-800">
                  {compatibility.issues.map((error, index) => (
                    <div key={index}>
                      <Button
                        disabled={loading}
                        className="w-full p-4 hover:bg-zinc-800/50 transition-colors"
                        title={`${error.acknowledged ? 'Issue Acknowledged' : 'Acknowledge issue'}`}
                        onClick={() => onAcknowledge(error)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex flex-col items-start gap-2">
                            <p className="text-xl font-medium">{error.title}</p>
                            <p className="text-zinc-400 text-start">{error.message}</p>
                          </div>
                          <div className="flex flex-col items-center w-24">
                            <IconToggle
                              disabled={loading}
                              className={`${error.acknowledged ? 'text-green-500' : 'text-red-500'}`}
                              checked={error.acknowledged}
                              iconSize={48}
                            />
                            {error.acknowledged ? (
                              <p className="animate-fade-in-down text-xs text-zinc-400 italic">
                                Acknowledged
                              </p>
                            ) : (
                              <p className="animate-fade-in-down text-xs text-zinc-400 italic">
                                Acknowledge?
                              </p>
                            )}
                          </div>
                        </div>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!loading && (
            <Button
              className="hover:bg-green-600 disabled:bg-zinc-800 relative flex gap-2 w-full bg-green-500 text-white font-medium py-3 rounded-lg transition-colors"
              onClick={onRunClick}
              disabled={loading || compatibility.pending > 0}
            >
              <IconPlay
                className={`absolute duration-500 inset transition-all ${loading ? 'left-1/2 opacity-0' : 'left-4'}`}
              />
              <p className={`${loading ? 'opacity-0' : ''} transition-all ml-10`}>Initialize App</p>
            </Button>
          )}
        </div>
      ) : app.meta?.updateAvailable ? (
        <div className="flex flex-col h-full items-center justify-center text-center">
          <div className="text-2xl font-semibold text-yellow-500 mb-3">Update Available</div>
          <p className="text-gray-600 mb-4">A new version of {app.name} is available</p>
          <div className="text-sm text-gray-500 mb-4">
            <div>Current version: {app.manifest?.version}</div>
            <div>Latest version: {app.meta.updateAvailableVersion}</div>
            <div>
              Last checked:{' '}
              {appRelease?.lastUpdated
                ? new Date(appRelease?.lastUpdated).toLocaleTimeString()
                : '0:00'}
            </div>
          </div>
          <Button
            className="gap-2 items-center group bg-black hover:bg-zinc-900 px-4 py-2"
            disabled={downloadChannel.isLoading}
            onClick={handleDownload}
          >
            {downloadChannel.isLoading ? (
              <>
                <IconLoading className="animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <IconDownload />
                <span>Update App</span>
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col h-full items-center justify-center text-center">
          <div className="text-2xl font-semibold text-green-500 mb-3">✓ App is up to date</div>
          <p className="text-gray-600 mb-4">You&apos;re running the latest version of {app.name}</p>
          <div className="text-sm text-gray-500">
            <div>Current version: {app.manifest?.version}</div>
            <div>
              Last checked:{' '}
              {appRelease?.lastUpdated
                ? new Date(appRelease?.lastUpdated).toLocaleTimeString()
                : '0:00'}
            </div>
            <Button
              className="gap-2 items-center group text-gray-600 hover:text-gray-800 text-sm px-3 py-1.5"
              disabled={downloadChannel.isLoading}
              onClick={handleRefresh}
            >
              <IconRefresh className="group-disabled:animate-spin-smooth" />
              <p className="group-disabled:hidden">Check Again</p>
              <p className="group-disabled:block hidden">Checking</p>
            </Button>
          </div>
        </div>
      )}
      {downloadChannel.isLoading && downloadChannel.progress && (
        <LogEntry progressEvent={downloadChannel.progress} />
      )}
      {stagedAppError && (
        <DownloadErrorOverlay
          error={stagedAppError}
          onAcknowledge={() => setStagedAppError(null)}
          title="Failed to stage App"
        />
      )}
    </div>
  )
}

export default AppUpdate
