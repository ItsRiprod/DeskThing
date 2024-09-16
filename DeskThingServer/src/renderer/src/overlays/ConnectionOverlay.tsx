import React from 'react'
import { IconX } from '../assets/icons'
import { Client } from '../store/clientStore'

interface ConnectionOverlayProps {
  client: Client
  disconnect: () => void
  hide: () => void
}

const ConnectionOverlay: React.FC<ConnectionOverlayProps> = ({ client, disconnect, hide }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <div>
          {client.connected && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between mb-2">
                <h2 className="text-xl font-semibold">
                  {client.device_type == 'unknown' ? 'Client' : client.device_type} Details
                </h2>
                <button
                  onClick={hide}
                  className="text-gray-500 border-red-500 p-2 hover:bg-red-500 border rounded-lg hover:text-gray-300"
                >
                  <IconX />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <p className="text-gray-500">Connection Status</p>
                    <p className="text-gray-300">
                      {client.connected ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-500">Connection ID</p>
                    <p className="text-gray-300">{client.connectionId}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-500">IP Address</p>
                    <p className="text-gray-300">{client.ip}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-500">Port</p>
                    <p className="text-gray-300">{client.port}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-500">Client Version</p>
                    <p className="text-gray-300">{client.version}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-500">Client Name</p>
                    <p className="text-gray-300">{client.client_name}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-500">Client Description</p>
                    <p className="text-gray-300">{client.description}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-500">Connected At</p>
                    <p className="text-gray-300">{new Date(client.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-500">User Agent</p>
                    <p className="text-gray-300">{client.userAgent}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-500">User Header</p>
                    <p className="text-gray-300">{client.userAgent}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={disconnect}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConnectionOverlay
