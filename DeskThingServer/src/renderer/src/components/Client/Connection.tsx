import {
  IconCarThingSmall,
  IconComputer,
  IconLogs,
  IconMobile,
  IconX
} from '@renderer/assets/icons'
import { ProgressChannel } from '@shared/types'
import React, { useEffect, useState } from 'react'
import Button from '../Button'
import ClientDetailsOverlay from '@renderer/overlays/ClientDetailsOverlay'
import { Client, ClientPlatformIDs, ConnectionState } from '@deskthing/types'
import usePlatformStore from '@renderer/stores/platformStore'
import { useChannelProgress } from '@renderer/hooks/useProgress'
import { PlatformIDs } from '@shared/stores/platformStore'
import { WebSocketControls, ADBControls } from './ConnectionControls/'

interface ConnectionComponentProps {
  client: Client
}

const ConnectionComponent: React.FC<ConnectionComponentProps> = ({ client }) => {
  const [enabled, setEnabled] = useState(false)
  const { isLoading } = useChannelProgress(ProgressChannel.PLATFORM_CHANNEL)
  const [connectedTimeText, setConnectedTimeText] = useState<string>('0s')
  const disconnect = usePlatformStore((state) => state.disconnect)

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

  // Determine which provider controls to show
  const hasAdbProvider = client.identifiers[PlatformIDs.ADB]?.active
  const hasWebSocketProvider = client.identifiers[PlatformIDs.WEBSOCKET]?.active

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
          {client.manifest?.context.ip && (
            <p className="text-gray-400">
              {client.manifest?.context.ip}:{client.manifest?.context.port}
            </p>
          )}
          <p className="text-sm text-gray-500 font-geistMono">ClientID: {client.clientId}</p>
          {hasAdbProvider && (
            <p className="text-xs flex items-center gap-1">
              <span
                className={`${client.primaryProviderId === PlatformIDs.ADB ? 'text-green-800' : 'text-gray-400'}`}
              >
                ●
              </span>
              <span className="text-gray-500">ADB: {client.identifiers[PlatformIDs.ADB]?.id}</span>
            </p>
          )}
          {hasWebSocketProvider && (
            <p className="text-xs flex items-center gap-1">
              <span
                className={`${client.primaryProviderId === PlatformIDs.WEBSOCKET ? 'text-green-800' : 'text-gray-400'}`}
              >
                ●
              </span>
              <span className="text-gray-500">
                WebSocket: {client.identifiers[PlatformIDs.WEBSOCKET]?.id}
              </span>
            </p>
          )}{' '}
          <p className="text-sm text-gray-400">Connected for: {connectedTimeText}</p>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        {/* Provider-specific controls */}
        {hasAdbProvider && <ADBControls client={client} isLoading={isLoading} />}

        {hasWebSocketProvider && <WebSocketControls client={client} isLoading={isLoading} />}

        {/* Common buttons for all clients */}
        <Button
          title="Client Details and Settings"
          className="group hover:bg-zinc-900 gap-2"
          onClick={() => setEnabled(true)}
        >
          <IconLogs />
        </Button>

        <Button
          title="Disconnect Client"
          className="group bg-red-700 gap-2 hover:bg-red-800"
          disabled={isLoading}
          onClick={handleDisconnect}
        >
          <IconX />
        </Button>
      </div>
    </div>
  )
}

export default ConnectionComponent
