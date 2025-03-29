import {
  IconCarThingSmall,
  IconComputer,
  IconLogs,
  IconMobile,
  IconPing,
  IconRefresh,
  IconX
} from '@renderer/assets/icons'
import { ProgressChannel } from '@shared/types'
import React, { useState } from 'react'
import Button from '../Button'
// import { useSettingsStore } from '@renderer/stores'
import ClientDetailsOverlay from '@renderer/overlays/ClientDetailsOverlay'
import { Client, ClientConnectionMethod } from '@DeskThing/types'
import usePlatformStore from '@renderer/stores/platformStore'
import ProgressOverlay from '@renderer/overlays/ProgressOverlay'

interface ConnectionComponentProps {
  client: Client
}

const ConnectionComponent: React.FC<ConnectionComponentProps> = ({ client }) => {
  // const port = useSettingsStore((settings) => settings.settings.devicePort)
  const [loading, setLoading] = useState(false)
  const [animatingIcons, setAnimatingIcons] = useState<Record<string, boolean>>({})
  const [enabled, setEnabled] = useState(false)

  const sendCommand = usePlatformStore((state) => state.runCommand)
  const disconnect = usePlatformStore((state) => state.disconnect)
  const ping = usePlatformStore((state) => state.ping)

  const renderIcon = (): JSX.Element => {
    if (!client.manifest?.context) return <IconComputer iconSize={128} />

    switch (client.manifest?.context.id) {
      case 1:
        return <IconComputer iconSize={128} />
      case 2:
        return <IconComputer iconSize={128} />
      case 3:
        return <IconMobile iconSize={128} />
      case 4:
        return <IconCarThingSmall iconSize={128} />
      default:
        return <IconComputer iconSize={128} />
    }
  }

  const handleAdbCommand = async (command: string): Promise<string | undefined> => {
    if (client.manifest?.context?.method !== ClientConnectionMethod.ADB) return

    return await sendCommand(client.manifest.context.adbId, command)
  }

  const onPushFinish = (): void => {
    setLoading(false)
  }

  const restartChromium = async (): Promise<void> => {
    if (client.manifest?.context.method !== ClientConnectionMethod.ADB) return

    setAnimatingIcons((prev) => ({ ...prev, chromium: true }))
    await handleAdbCommand(
      `-s ${client.manifest.context.adbId} shell supervisorctl restart chromium`
    )
    setAnimatingIcons((prev) => ({ ...prev, chromium: false }))
  }

  const handlePing = async (): Promise<void> => {
    setAnimatingIcons((prev) => ({ ...prev, ping: true }))
    await ping(client.connectionId)

    const pongPromise = new Promise<void>((resolve) => {
      const onPong = (_event: Electron.IpcRendererEvent, payload: string): void => {
        console.log(`Got ping response from ${client.connectionId}: `, payload)
        setTimeout(() => {
          setAnimatingIcons((prev) => ({ ...prev, ping: false }))
        }, 1000)
        resolve()
      }
      window.electron.ipcRenderer.once(`pong-${client.connectionId}`, onPong)
    })

    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log(`Ping timed out for ${client.connectionId}`)
        setAnimatingIcons((prev) => ({ ...prev, ping: false }))
        resolve()
      }, 5000)
    })

    try {
      await Promise.race([pongPromise, timeoutPromise])
    } finally {
      window.electron.ipcRenderer.removeAllListeners(`pong-${client.connectionId}`)
    }
  }

  const handleDisconnect = (): void => {
    disconnect(client.connectionId)
  }

  return (
    <div className="w-full p-4 border rounded-xl border-zinc-900 flex flex-col lg:flex-row gap-4 justify-center items-center lg:justify-between bg-zinc-950">
      {enabled && <ClientDetailsOverlay client={client} onClose={() => setEnabled(false)} />}
      <ProgressOverlay channel={ProgressChannel.IPC_CLIENT} onClose={onPushFinish} />
      <ProgressOverlay channel={ProgressChannel.PLATFORM_CHANNEL} />
      <div className="flex gap-2 items-center">
        {renderIcon()}
        <div>
          <p>Platform</p>
          <h2 className="text-2xl">{client.manifest?.context.name || 'Unknown Platform'}</h2>
          <h2 className="text-sm text-gray-500 font-geistMono">
            {client.manifest?.context.method == ClientConnectionMethod.ADB
              ? client.manifest?.context.adbId
              : client.connectionId}
          </h2>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        {client.manifest?.context.method == ClientConnectionMethod.ADB && (
          <>
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
              <p className="hidden group-hover:block">
                Restart <span className="hidden lg:inline">Chromium</span>
              </p>
            </Button>
          </>
        )}
        <Button
          title="Client Details and Settings"
          className="group hover:bg-zinc-900 gap-2"
          onClick={() => setEnabled(true)}
        >
          <IconLogs />
          <p className="hidden group-hover:block">Details</p>
        </Button>
        <Button title="Ping Client" className="group hover:bg-zinc-900 gap-2" onClick={handlePing}>
          <IconPing className={animatingIcons.ping ? 'animate-ping' : ''} />
          <p className="hidden group-hover:block">Ping</p>
        </Button>
        <Button
          title="Disconnect Client"
          className="group bg-red-700 gap-2"
          disabled={loading}
          onClick={handleDisconnect}
        >
          <IconX />
          <p className="hidden group-hover:block">Disconnect</p>
        </Button>
      </div>
    </div>
  )
}

export default ConnectionComponent
