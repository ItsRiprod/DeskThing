import {
  IconCarThingSmall,
  IconConfig,
  IconLoading,
  IconRefresh,
  IconUpload
} from '@renderer/assets/icons'
import { ProgressChannel } from '@shared/types'
import React, { useState } from 'react'
import Button from '../Button'
// import { useSettingsStore } from '@renderer/stores'
import { useClientStore, useSettingsStore } from '@renderer/stores'
import { ADBClientType } from '@deskthing/types'
import ProgressOverlay from '@renderer/overlays/ProgressOverlay'
import usePlatformStore from '@renderer/stores/platformStore'

interface ADBComponentProps {
  adbDevice: ADBClientType
}

const ADBDevice: React.FC<ADBComponentProps> = ({ adbDevice }) => {
  // const port = useSettingsStore((settings) => settings.settings.devicePort)
  const [loading, setLoading] = useState(false)
  const [animatingIcons, setAnimatingIcons] = useState<Record<string, boolean>>({})
  const sendCommand = usePlatformStore((state) => state.runCommand)
  const configure = usePlatformStore((state) => state.configure)
  const pushStaged = usePlatformStore((state) => state.pushStaged)
  const refreshADbClients = useClientStore((store) => store.requestADBDevices)
  const devicePort = useSettingsStore((store) => store.settings.devicePort)

  const handleAdbCommand = async (command: string): Promise<string | undefined> => {
    return sendCommand(adbDevice.adbId, command)
  }

  const onPushFinish = (): void => {
    setLoading(false)
  }

  const configureDevice = async (): Promise<void> => {
    await configure(adbDevice.adbId)
  }

  const restartChromium = async (): Promise<void> => {
    setAnimatingIcons((prev) => ({ ...prev, chromium: true }))
    await handleAdbCommand(`shell supervisorctl restart chromium`)
    setAnimatingIcons((prev) => ({ ...prev, chromium: false }))
  }

  const handleConnectOffline = async (): Promise<void> => {
    setLoading(true)
    await handleAdbCommand(`reconnect offline`)
    await setTimeout(() => refreshADbClients, 5000)
    await handleAdbCommand(`reverse tcp:${devicePort} tcp:${devicePort}`)
    setLoading(false)
  }

  const handlePushStaged = (): void => {
    pushStaged(adbDevice.adbId)
  }

  return (
    <div className="w-full p-4 border rounded-xl border-zinc-900 flex flex-col lg:flex-row gap-4 justify-center items-center lg:justify-between bg-zinc-950">
      <ProgressOverlay
        channel={ProgressChannel.PLATFORM_CHANNEL}
        onClose={onPushFinish}
        title="Running command"
      />
      <div className="flex gap-2 items-center">
        <IconCarThingSmall iconSize={48} />
        <div>
          <h2 className="text-md font-geistMono">{adbDevice.adbId}</h2>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        {adbDevice.offline ? (
          <p className="text-red-500 italic">Device Offline!</p>
        ) : (
          <>
            {adbDevice.ip ? (
              <p>ADB Device Connected</p>
            ) : (
              <Button
                title="Configure Device"
                className="group relative hover:bg-zinc-900 gap-2"
                onClick={configureDevice}
                disabled={loading}
              >
                <div className="absolute inset-0 w-full h-full border-blue-500 border animate-pulse rounded-lg"></div>
                <IconConfig />
                <p className="hidden group-hover:block lg:block">
                  Config<span className="hidden lg:inline">ure</span>
                </p>
              </Button>
            )}
            <Button
              title="Push staged client"
              className="group hover:bg-zinc-900 gap-2"
              onClick={handlePushStaged}
              disabled={loading}
            >
              <IconUpload
                className={
                  animatingIcons.chromium
                    ? 'rotate-[360deg] transition-transform duration-1000'
                    : ''
                }
              />
            </Button>
            <Button
              title="Restart Chromium on the Device"
              className="group hover:bg-zinc-900 gap-2"
              onClick={restartChromium}
              disabled={loading}
            >
              <IconRefresh
                className={
                  animatingIcons.chromium
                    ? 'rotate-[360deg] transition-transform duration-1000'
                    : ''
                }
              />
            </Button>
          </>
        )}
        {adbDevice.offline && (
          <Button
            title="Reconnect Device"
            className="group hover:bg-red-900 gap-2 border-red-500 border"
            onClick={handleConnectOffline}
            disabled={loading}
          >
            {loading ? <IconLoading /> : <IconConfig />}
            <p className="">
              Reconnect<span className="hidden lg:inline"> Device</span>
            </p>
          </Button>
        )}
      </div>
    </div>
  )
}

export default ADBDevice
