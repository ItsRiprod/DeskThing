import React, { useState } from 'react'
import { Client, ConnectionState, PlatformIDs } from '@deskthing/types'
import { IconConfig, IconRefresh, IconUpload } from '@renderer/assets/icons'
import Button from '../../Button'
import usePlatformStore from '@renderer/stores/platformStore'
import { useClientStore, useSettingsStore } from '@renderer/stores'

interface ADBControlsProps {
  client: Client
  isLoading: boolean
}

const ADBControls: React.FC<ADBControlsProps> = ({ client, isLoading }) => {
  const [animatingIcons, setAnimatingIcons] = useState<Record<string, boolean>>({})
  const refreshADbClients = useClientStore((store) => store.requestADBDevices)
  const devicePort = useSettingsStore((store) => store.settings.device_devicePort)

  const sendCommand = usePlatformStore((state) => state.runCommand)
  const configure = usePlatformStore((state) => state.configure)
  const pushStaged = usePlatformStore((state) => state.pushStaged)

  const adbId = client.identifiers[PlatformIDs.ADB]?.id || client.meta.adb?.adbId

  const handleAdbCommand = async (command: string): Promise<string | undefined> => {
    if (!adbId) return
    return await sendCommand(adbId, command)
  }

  const restartChromium = async (): Promise<void> => {
    if (!adbId) return
    setAnimatingIcons((prev) => ({ ...prev, chromium: true }))
    await handleAdbCommand(`-s ${adbId} shell supervisorctl restart chromium`)
    setAnimatingIcons((prev) => ({ ...prev, chromium: false }))
  }

  const configureDevice = async (): Promise<void> => {
    if (!adbId) return
    await configure(adbId)
  }

  const handlePushStaged = (): void => {
    if (!adbId) return
    pushStaged(adbId)
  }

  const handleConnectOffline = async (): Promise<void> => {
    if (!adbId) return
    await handleAdbCommand(`reconnect offline`)
    await setTimeout(() => refreshADbClients, 5000)
    await handleAdbCommand(`reverse tcp:${devicePort} tcp:${devicePort}`)
  }

  // Determine device state
  const needsConfiguration =
    client.connectionState === ConnectionState.Established && !client.identifiers.websocket?.active

  const isOffline = client.connectionState === ConnectionState.Failed

  if (needsConfiguration) {
    return (
      <Button
        title="Configure Device"
        className="group relative hover:bg-zinc-900 gap-2"
        onClick={configureDevice}
        disabled={isLoading}
      >
        <div className="absolute inset-0 w-full h-full border-blue-500 border animate-pulse rounded-lg"></div>
        <IconConfig />
        <p>Configure</p>
      </Button>
    )
  }

  if (isOffline) {
    return (
      <Button
        title="Reconnect Device"
        className="group hover:bg-red-900 gap-2 border-red-500 border"
        onClick={handleConnectOffline}
        disabled={isLoading}
      >
        <IconConfig />
        <p>Reconnect Device</p>
      </Button>
    )
  }

  return (
    <>
      <Button
        title="Push staged client"
        className="group hover:bg-zinc-900 gap-2"
        onClick={handlePushStaged}
        disabled={isLoading}
      >
        <IconUpload
          className={
            animatingIcons.chromium ? 'rotate-[360deg] transition-transform duration-1000' : ''
          }
        />
      </Button>
      <Button
        title="Restart Chromium on the Device"
        className="group hover:bg-zinc-900 gap-2"
        onClick={restartChromium}
        disabled={isLoading}
      >
        <IconRefresh
          className={
            animatingIcons.chromium ? 'rotate-[360deg] transition-transform duration-1000' : ''
          }
        />
      </Button>
    </>
  )
}

export default ADBControls
