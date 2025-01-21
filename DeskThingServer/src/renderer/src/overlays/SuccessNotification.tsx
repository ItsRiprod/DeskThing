import Overlay from './Overlay'
import semverSatisfies from 'semver/functions/satisfies'
import Button from '@renderer/components/Button'
import { IconPlay, IconToggle } from '@renderer/assets/icons'
import { useEffect, useState } from 'react'
import { useAppStore } from '@renderer/stores'
import { AppManifest, PlatformTypes } from '@shared/types'

interface CompatibilityResult {
  isCompatible: boolean
  errors: string[]
}

const checkCompatibility = (manifest: AppManifest): CompatibilityResult => {
  const errors: string[] = []

  const currentPlatform =
    process.platform === 'win32'
      ? PlatformTypes.WINDOWS
      : process.platform === 'darwin'
        ? PlatformTypes.MAC
        : PlatformTypes.LINUX

  if (!manifest.platforms?.includes(currentPlatform)) {
    errors.push(`App not compatible with ${currentPlatform} platform`)
  }

  if (manifest.requiredVersions) {
    const { server: requiredServer, client: requiredClient } = manifest.requiredVersions

    // Get current versions from your environment/config
    const currentServerVersion = '1.0.0' // Replace with actual version
    const currentClientVersion = '1.0.0' // Replace with actual version

    if (!semverSatisfies(currentServerVersion, requiredServer)) {
      errors.push(`Server version ${currentServerVersion} incompatible. Requires ${requiredServer}`)
    }

    if (!semverSatisfies(currentClientVersion, requiredClient)) {
      errors.push(`Client version ${currentClientVersion} incompatible. Requires ${requiredClient}`)
    }
  }

  return {
    isCompatible: errors.length === 0,
    errors
  }
}

export function SuccessNotification(): JSX.Element {
  const [loading, setLoading] = useState(false)
  const stagedManifest = useAppStore((appStore) => appStore.stagedManifest)
  const runStagedApp = useAppStore((appStore) => appStore.runStagedApp)
  const [overwrite, setOverwrite] = useState(false)
  const [compatibility, setCompatibility] = useState<CompatibilityResult>({
    isCompatible: true,
    errors: []
  })

  useEffect(() => {
    if (stagedManifest) {
      const result = checkCompatibility(stagedManifest)
      setCompatibility(result)
    }
  }, [stagedManifest])

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

  return (
    <Overlay onClose={onClose} className="border bg-zinc-950 border-zinc-800 flex flex-col">
      <div className="w-full py-4 bg-zinc-900 px-5 border-b border-gray-500">
        <h1 className="text-2xl text-green-500 pr-24">
          Successfully Downloaded {stagedManifest.label}
        </h1>
      </div>
      <div className="p-5 flex flex-col gap-2">
        <div>
          <p>{stagedManifest.label} is installed</p>
          <p>v{stagedManifest.version}</p>
        </div>
        <Button
          onClick={toggleOverwrite}
          className={`${overwrite ? 'text-green-500' : 'text-red-500'} justify-between items-center gap-2`}
        >
          <p>Overwrite Existing App?</p>
          <IconToggle checked={overwrite} iconSize={48} />
        </Button>
        <Button
          className="hover:bg-zinc-700 relative flex gap-2 w-full bg-black border border-zinc-900"
          onClick={onRunClick}
          disabled={loading}
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
