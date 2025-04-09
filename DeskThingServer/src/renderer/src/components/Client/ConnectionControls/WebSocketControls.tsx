import React, { useState } from 'react'
import { Client, ConnectionState } from '@deskthing/types'
import { IconPing } from '@renderer/assets/icons'
import Button from '../../Button'
import usePlatformStore from '@renderer/stores/platformStore'

interface WebSocketControlsProps {
  client: Client
  isLoading: boolean
}

const WebSocketControls: React.FC<WebSocketControlsProps> = ({ client, isLoading }) => {
  const [_animatingIcons, setAnimatingIcons] = useState<Record<string, boolean>>({})
  const ping = usePlatformStore((state) => state.ping)

  const handlePing = async (): Promise<void> => {
    setAnimatingIcons((prev) => ({ ...prev, ping: true }))
    await ping(client.clientId)
  }

  // Don't show ping for devices that need configuration
  const isAdbDeviceNeedingConfig =
    client.identifiers['adb'] !== undefined &&
    client.connectionState === ConnectionState.Established &&
    !client.manifest?.context?.ip

  if (isAdbDeviceNeedingConfig) {
    return null
  }

  return (
    <Button title="Ping Client" className="group hover:bg-zinc-900 gap-2" onClick={handlePing}>
      <IconPing className={isLoading ? 'animate-ping' : ''} />
      <p className="hidden group-hover:block">Ping</p>
    </Button>
  )
}

export default WebSocketControls
