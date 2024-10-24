import React from 'react'
import { useClientStore } from '@renderer/stores'
import { Client } from '@shared/types'

const ClientsWidget: React.FC = () => {
  const clients = useClientStore((state) => state.clients)

  return (
    <div className="h-full relative overflow-hidden">
      <h3 className="text-lg font-semibold mb-2">Connections</h3>
      <div className="overflow-y-auto relative h-full w-full">
        <div className="absolute inset-0 w-full text-wrap break-words">
          {clients.length > 0 ? (
            clients.map((client, index) => (
              <div key={index} className="mb-2 text-sm">
                <ClientComponent client={client} />
              </div>
            ))
          ) : (
            <div className="w-full h-full flex justify-center items-center">
              <p className="text-gray-500 text-sm font-geistMono">No Active Connections</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ClientComponent: React.FC<{ client: Client }> = ({ client }) => {
  return (
    <div className="flex flex-col gap-2 border-t border-zinc-500">
      <h1 className="text-lg font-semibold">{client.device_type?.name || client.client_name}</h1>
      <p className="text-gray-500 font-geistMono">{client.connectionId}</p>
      <p className="text-gray-500 font-geistMono">
        {client.ip}:{client.port}
      </p>
    </div>
  )
}

export default ClientsWidget
