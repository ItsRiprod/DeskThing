import Overlay from './Overlay'
import semverSatisfies from 'semver/functions/satisfies'
import Button from '@renderer/components/Button'
import { IconPlay, IconToggle } from '@renderer/assets/icons'
import { useEffect, useState } from 'react'
import { useAppStore, useClientStore } from '@renderer/stores'
import { App, PlatformTypes } from '@DeskThing/types'
import { StagedAppManifest } from '@shared/types'

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

    // Get current versions from your environment/config
    const currentServerVersion = process.env.PACKAGE_VERSION || '0.0.0' // Replace with actual version
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

export function SuccessNotification(): JSX.Element {
  const [loading, setLoading] = useState(false)
  const stagedManifest = useAppStore((appStore) => appStore.stagedManifest)
  const apps = useAppStore((appStore) => appStore.appsList)
  const runStagedApp = useAppStore((appStore) => appStore.runStagedApp)
  const [overwrite, setOverwrite] = useState(false)
  const [compatibility, setCompatibility] = useState<CompatibilityResult>({
    isCompatible: true,
    pending: 0,
    issues: []
  })

  useEffect(() => {
    if (stagedManifest) {
      console.log('Staged Manifest: ', stagedManifest)
      const result = checkCompatibility(stagedManifest, apps)
      setCompatibility(result)
    }
  }, [stagedManifest, apps])

  if (!stagedManifest) return <></>

  const onRunClick = async (): Promise<void> => {
    setLoading(true)
    runStagedApp(overwrite)
    // setTimeout(() => {
    //   setAppReturnData(null)
    // }, 500)
  }

  const onClose = (): void => {
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

  return (
    <Overlay
      onClose={onClose}
      className="border max-w-[75vw] bg-zinc-950 border-zinc-800 flex flex-col"
    >
      <div className="w-full py-4 bg-zinc-900 px-5 border-b border-gray-500">
        <h1 className="text-2xl text-green-500 pr-24">
          Successfully Downloaded {stagedManifest.label || stagedManifest.id} v
          {stagedManifest.version.replace('v', '')}
        </h1>
      </div>
      <div className="p-5 flex flex-col gap-2">
        <div className="flex justify-between gap-8">
          <div className="flex flex-col gap-2">
            <p className="text-wrap text-lg">{stagedManifest.description}</p>
            <div className="text-sm text-zinc-400">
              <p>Owner: {stagedManifest.author}</p>
              <p>{stagedManifest.tags}</p>
              <p>{stagedManifest.label}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {stagedManifest.homepage && (
              <Button className="hover:text-blue-400" href={stagedManifest.homepage}>
                Homepage
              </Button>
            )}
            {stagedManifest.repository && (
              <Button className="hover:text-blue-400" href={stagedManifest.repository}>
                Repository
              </Button>
            )}
          </div>
        </div>
        <Button
          onClick={toggleOverwrite}
          title={`${overwrite ? 'Disable' : 'Enable'} Overwrite`}
          className={`${overwrite ? 'text-red-500' : 'text-green-500'} justify-between items-center gap-2 bg-black rounded-xl`}
        >
          <p>Overwrite Existing App Files?</p>
          <IconToggle checked={overwrite} iconSize={48} />
        </Button>
        {!compatibility.isCompatible && (
          <div>
            <h1 className="w-full flex justify-center text-lg border-b border-gray-500">
              Potential Issues Found
            </h1>
            {compatibility.issues.map((error, index) => (
              <div key={index}>
                <IssueComponent issue={error} onAcknowledge={onAcknowledge} />
              </div>
            ))}
          </div>
        )}
        <Button
          className="hover:bg-zinc-700 disabled:bg-zinc-800 relative flex gap-2 w-full bg-black border border-zinc-900"
          onClick={onRunClick}
          disabled={loading || compatibility.pending > 0}
        >
          <IconPlay
            className={`fill-white absolute duration-500 inset transition-all ${loading ? 'left-1/2 opacity-0' : 'left-4'}`}
          />
          <p className={`${loading ? 'opacity-0' : ''} transition-all ml-10`}>Initialize App</p>
        </Button>
      </div>
    </Overlay>
  )
}

interface IssueComponentProps {
  issue: Issue
  onAcknowledge: (issue: Issue) => void
}

const IssueComponent: React.FC<IssueComponentProps> = ({
  issue,
  onAcknowledge
}: IssueComponentProps) => {
  const onAcknowledgeClick = (): void => {
    onAcknowledge(issue)
  }

  return (
    <Button
      className="w-full items-center gap-5 justify-between"
      title={`${issue.acknowledged ? 'Issue Acknowledged' : 'Acknowledge issue'}`}
      onClick={onAcknowledgeClick}
    >
      <div className="flex flex-col gap-2 justify-start items-start">
        <p className="text-xl">{issue.title}</p>
        <p>{issue.message}</p>
      </div>
      <div className="flex flex-col items-center w-24">
        <IconToggle
          className={`${issue.acknowledged ? 'text-green-500' : 'text-red-500'}`}
          checked={issue.acknowledged}
          iconSize={48}
        />
        {issue.acknowledged ? (
          <p className="animate-fade-in-down text-xs text-gray-300 italic">Acknowledged</p>
        ) : (
          <p className="animate-fade-in-down text-xs text-gray-300 italic">Acknowledge?</p>
        )}
      </div>
    </Button>
  )
}
