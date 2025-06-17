import React, { useState } from 'react'
import { Client, ConnectionState } from '@deskthing/types'
import { IconPing } from '@renderer/assets/icons'
import Button from '../../Button'
import usePlatformStore from '@renderer/stores/platformStore'

interface WebSocketControlsProps {
  client: Client
  isLoading: boolean
}

const WebSocketControls: React.FC<WebSocketControlsProps> = ({ client }) => {
  const [animatingIcons, setAnimatingIcons] = useState<Record<string, boolean>>({})
  const ping = usePlatformStore((state) => state.ping)

  const handlePing = async (): Promise<void> => {
    setAnimatingIcons((prev) => ({ ...prev, ping: true }))
    await ping(client.clientId)
    setAnimatingIcons((prev) => ({ ...prev, ping: false }))
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
      <IconPing className={animatingIcons.ping ? 'animate-ping' : ''} />
    </Button>
  )
}

export default WebSocketControls
