import React from 'react'
import { IconDetails, IconX } from '../assets/icons'
import { Client } from '@renderer/store/clientStore'
import ConnectionOverlay from '@renderer/overlays/ConnectionOverlay'

interface ConnectionStatsProps {
  client: Client
}

const ConnectionStats: React.FC<ConnectionStatsProps> = ({ client }) => {
  const [visible, setVisible] = React.useState(false)
  const handleDisconnect = (): void => {
    window.electron.ipcRenderer.send('remove-connection', client.connectionId)
  }

  const onClose = (): void => {
    setVisible(false)
  }

  return (
    <div className="flex w-full justify-between py-2 border-t border-t-gray-700 rounded-lg p-4">
      {visible && (
        <ConnectionOverlay client={client} disconnect={handleDisconnect} hide={onClose} />
      )}
      <div className="flex flex-col">
        <p className="text-xs text-gray-500 italic font-geistMono">{client.connectionId}</p>
        <div className="font-geistMono flex flex-col gap-2 sm:flex-row text-sm sm:text-nowrap sm:text-xl">
          <p className="hidden lg:block">Client:</p>
          <p className="text-green-500 font-semibold">{client.client_name || 'Unknown'}</p>
        </div>
        <p className="sm:text-sm text-xs">
          {client.version || 'Unknown version'} - {client.ip}
        </p>
        <p className="text-xs">
          {client.connected ? 'Connected' : 'Disconnected'} | Client: {client.device_type}
        </p>
      </div>
      <div className="flex flex-col items-end justify-between">
        <button
          onClick={handleDisconnect}
          className="group border flex border-red-500 hover:bg-red-500 rounded-lg p-2"
        >
          <p className="hidden group-hover:block">Disconnect</p>
          <IconX />
        </button>
        <button
          onClick={() => setVisible(true)}
          className="group border flex border-green-500 hover:bg-green-500 rounded-lg p-2"
        >
          <p className="hidden group-hover:block">Details</p>
          <IconDetails />
        </button>
      </div>
    </div>
  )
}

export default ConnectionStats
