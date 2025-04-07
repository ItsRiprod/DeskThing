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
import React, { useEffect, useState } from 'react'
import Button from '../Button'
import ClientDetailsOverlay from '@renderer/overlays/ClientDetailsOverlay'
import {
  Client,
  ClientConnectionMethod,
  ClientPlatformIDs,
  ConnectionState
} from '@deskthing/types'
import usePlatformStore from '@renderer/stores/platformStore'
import { useChannelProgress } from '@renderer/hooks/useProgress'

interface ConnectionComponentProps {
  client: Client
}

const ConnectionComponent: React.FC<ConnectionComponentProps> = ({ client }) => {
  const [animatingIcons, setAnimatingIcons] = useState<Record<string, boolean>>({})
  const [enabled, setEnabled] = useState(false)
  const { isLoading } = useChannelProgress(ProgressChannel.PLATFORM_CHANNEL)

  const [connectedTimeText, setConnectedTimeText] = useState<string>('0s')

  useEffect(() => {
    const updateTime = (): number | undefined => {
      if (!client.timestamp) {
        setConnectedTimeText('0s')
        return
      }

      const timeDiff = Math.floor((Date.now() - client.timestamp) / 1000)
      let newText = '0s'
      let interval = 1000

      if (timeDiff < 5) {
        const halfSecDiff = Math.floor((Date.now() - client.timestamp) / 100) / 10
        newText = `${halfSecDiff}s`
        interval = 100
      } else if (timeDiff < 60) {
        newText = `${timeDiff}s`
      } else if (timeDiff < 3600) {
        newText = `${Math.floor(timeDiff / 60)}m`
        interval = 60000
      } else {
        newText = `${Math.floor(timeDiff / 3600)}h`
        interval = 3600000
      }

      setConnectedTimeText(newText)
      return interval
    }

    const interval = updateTime()
    const timer = setInterval(updateTime, interval)

    return () => clearInterval(timer)
  }, [client.timestamp])
  const sendCommand = usePlatformStore((state) => state.runCommand)
  const disconnect = usePlatformStore((state) => state.disconnect)
  const ping = usePlatformStore((state) => state.ping)

  const renderIcon = (): JSX.Element => {
    if (!client.manifest?.context) return <IconComputer iconSize={128} />

    switch (client.manifest?.context.id) {
      case ClientPlatformIDs.Desktop:
        return <IconComputer iconSize={128} />
      case ClientPlatformIDs.Tablet:
        return <IconComputer iconSize={128} />
      case ClientPlatformIDs.Iphone:
        return <IconMobile iconSize={128} />
      case ClientPlatformIDs.CarThing:
        return <IconCarThingSmall iconSize={128} />
      default:
        return <IconComputer iconSize={128} />
    }
  }

  const handleAdbCommand = async (command: string): Promise<string | undefined> => {
    if (client.manifest?.context?.method !== ClientConnectionMethod.ADB) return

    return await sendCommand(client.manifest.context.adbId, command)
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
    await ping(client.clientId)
  }

  const handleDisconnect = (): void => {
    disconnect(client.clientId)
  }

  const getConnectionStateColor = (state: ConnectionState): string => {
    switch (state) {
      case ConnectionState.Connected:
      case ConnectionState.Established:
        return 'text-green-500'
      case ConnectionState.Connecting:
        return 'text-yellow-500'
      case ConnectionState.Failed:
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className="w-full p-4 border rounded-xl border-zinc-900 flex flex-col lg:flex-row gap-4 justify-center items-center lg:justify-between bg-zinc-950">
      {enabled && <ClientDetailsOverlay client={client} onClose={() => setEnabled(false)} />}
      <div className="flex gap-4 items-center">
        {renderIcon()}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl">{client.manifest?.name || 'Unknown Device'}</h2>
            <span className={`text-sm ${getConnectionStateColor(client.connectionState)}`}>
              {ConnectionState[client.connectionState]}
            </span>
          </div>
          <p className="text-gray-400">
            {client.manifest?.context.ip}:{client.manifest?.context.port}
          </p>
          <p className="text-sm text-gray-500 font-geistMono">{client.clientId}</p>
          {client.manifest?.context.method === ClientConnectionMethod.ADB && (
            <p className="text-sm text-gray-400">ADB: {client.manifest.context.adbId}</p>
          )}
          <p className="text-sm text-gray-400">Connected for: {connectedTimeText}</p>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        {client.manifest?.context.method === ClientConnectionMethod.ADB && (
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
            <p className="hidden group-hover:block">
              Restart <span className="hidden lg:inline">Chromium</span>
            </p>
          </Button>
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
          <IconPing className={isLoading ? 'animate-ping' : ''} />
          <p className="hidden group-hover:block">Ping</p>
        </Button>
        <Button
          title="Disconnect Client"
          className="group bg-red-700 gap-2"
          disabled={isLoading}
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