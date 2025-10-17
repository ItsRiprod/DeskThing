import {
  IconCarThingSmall,
  IconComputer,
  IconMobile,
  IconRefresh,
  IconWrench,
  IconX
} from '@renderer/assets/icons'
import { ProgressChannel } from '@shared/types'
import React, { useEffect, useState } from 'react'
import Button from '../buttons/Button'
import ClientDetailsOverlay from '@renderer/overlays/modals/DeviceDetails/ClientDetailsOverlay'
import { Client, ClientPlatformIDs, PlatformIDs, ConnectionState } from '@deskthing/types'
import usePlatformStore from '@renderer/stores/platformStore'
import { useChannelProgress } from '@renderer/hooks/useProgress'
import { WebSocketControls, ADBControls } from './ConnectionControls/'
import { useSettingsStore } from '@renderer/stores'

interface ConnectionComponentProps {
  client: Client
}

const ConnectionComponent: React.FC<ConnectionComponentProps> = ({ client }) => {
  const [enabled, setEnabled] = useState(false)
  const { isLoading } = useChannelProgress(ProgressChannel.PLATFORM_CHANNEL)
  const [connectedTimeText, setConnectedTimeText] = useState<string>('0s')
  const disconnect = usePlatformStore((state) => state.disconnect)
  const resendData = usePlatformStore((state) => state.resendInitialData)
  const [isSendingData, setIsSendingData] = useState(false)
  const is_nerd = useSettingsStore((state) => state.settings?.flag_nerd) || false

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

  const resendInitialData = async (): Promise<void> => {
    setIsSendingData(true)
    await resendData(client.clientId)
    setIsSendingData(false)
  }

  // Determine which provider controls to show
  const hasAdbProvider = client.identifiers[PlatformIDs.ADB]?.active
  const hasWebSocketProvider = client.identifiers[PlatformIDs.WEBSOCKET]?.active

  return (
    <div className="w-full p-4 border rounded-xl border-zinc-900 flex flex-col lg:flex-row gap-4 justify-center items-center lg:justify-between bg-zinc-950">
      {enabled && <ClientDetailsOverlay client={client} onClose={() => setEnabled(false)} />}
      <div className="flex gap-4 items-center">
        <button
          disabled={isSendingData}
          onClick={resendInitialData}
          className="relative group flex items-center justify-center rounded-lg"
        >
          {renderIcon()}
          <IconRefresh
            className={`absolute hidden group-hover:block text-zinc-300 ${isSendingData ? 'animate-spin-smooth' : ''}`}
            iconSize="34"
          />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl">{client.manifest?.name || 'Unknown Device'}</h2>
            <span className={`text-sm ${getConnectionStateColor(client.connectionState)}`}>
              {ConnectionState[client.connectionState]}
            </span>
          </div>
          {is_nerd && client.manifest?.context.ip && (
            <p className="text-gray-400">
              {client.manifest?.context.ip}:{client.manifest?.context.port}
            </p>
          )}
          {is_nerd && hasAdbProvider && (
            <p className="text-xs flex items-center gap-1">
              <span
                className={`${client.primaryProviderId === PlatformIDs.ADB ? 'text-green-800' : 'text-gray-400'}`}
              >
                ●
              </span>
              <span className="text-gray-500">ADB: {client.identifiers[PlatformIDs.ADB]?.id}</span>
            </p>
          )}
          {is_nerd && client.meta[PlatformIDs.ADB] && (
            <div className="text-xs text-zinc-500 font-geistMono">
              <p>- brightness: {client.meta[PlatformIDs.ADB].brightness}</p>
              <p>- mac_bt: {client.meta[PlatformIDs.ADB].mac_bt}</p>
              <p>- offline: {client.meta[PlatformIDs.ADB].offline ? 'true' : 'false'}</p>
            </div>
          )}
          {is_nerd && hasWebSocketProvider && (
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
          {is_nerd && client.meta[PlatformIDs.WEBSOCKET]?.ping && (
            <div className="text-xs text-zinc-500 font-geistMono">
              <p>- websocket: {client.meta[PlatformIDs.WEBSOCKET]?.ping.socket}ms</p>
              <p>- deskthing: {client.meta[PlatformIDs.WEBSOCKET]?.ping.server}ms</p>
            </div>
          )}
          {is_nerd && <p className="text-sm text-gray-400">Connected for: {connectedTimeText}</p>}
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
          <IconWrench />
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
