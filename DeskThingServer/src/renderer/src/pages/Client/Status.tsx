import React, { useEffect, useState } from 'react'
import ClientSettings from '../../components/ClientSettings'
import { Client } from '@renderer/store/clientStore'
import { ClientStore, SettingsStore } from '@renderer/store'
import { Settings } from '@renderer/store/settingsStore'

interface StatusProps {
  // Define your props here
}

const Status: React.FC<StatusProps> = () => {
  const [clients, setClients] = useState<Client[]>(ClientStore.getClients())
  const [ips, setIps] = useState<string[]>([])

  useEffect(() => {
    const getIps = async (): Promise<void> => {
      const settings = await SettingsStore.getSettings()
      setIps(settings.localIp)
    }
    const handleSettingsUpdate = async (settings: Settings): Promise<void> => {
      setIps(settings.localIp)
    }
    const handleClientUpdate = (clients: Client[]) => {
      setClients(clients)
    }

    getIps()

    const removeSettingsListener = SettingsStore.on('update', handleSettingsUpdate)

    const removeClientListener = ClientStore.on('Clients', (clients) =>
      handleClientUpdate(clients as Client[])
    )

    return () => {
      removeSettingsListener()
      removeClientListener()
    }
  })

  return (
    <div className="pt-5 flex flex-col w-full items-center p-5">
      <div className="border-b-2 w-full border-slate-700 p-2">
        <ClientSettings />
      </div>
      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Connected Clients</h2>
        <ul className="space-y-4">
          {clients &&
            clients.map((client, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-4 border border-zinc-700 rounded-xl hover:bg-zinc-900"
              >
                <span className="text-lg">{client.ip}</span>
                <span className="text-lg">{client.connected ? 'connected' : ''}</span>
                <div className="space-x-2">
                  <button
                    onClick={() => console.log(`Set ${client.connected} to view`)}
                    className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors duration-150"
                  >
                    Set to View
                  </button>
                  <button
                    onClick={() => console.log(`Disconnect ${client}`)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors duration-150"
                  >
                    Disconnect
                  </button>
                </div>
              </li>
            ))}
        </ul>
      </div>
    </div>
  )
}

export default Status
