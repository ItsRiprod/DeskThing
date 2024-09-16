import React, { useEffect, useState } from 'react'
import ClientSettings from '../../components/ClientSettings'
import { Client } from '@renderer/store/clientStore'
import { ClientStore, SettingsStore } from '@renderer/store'
import { Settings } from '@renderer/store/settingsStore'
import ConnectionStats from '@renderer/components/ConnectionStats'
import { IconQR } from '@renderer/assets/icons'
import QROverlay from '@renderer/overlays/QROverlay'

const Status: React.FC = () => {
  const [clients, setClients] = useState<Client[]>(ClientStore.getClients())
  const [ips, setIps] = useState<string[]>([])
  const [port, setPort] = useState<number>(8891)
  const [qrVisible, setQrVisible] = useState(false)
  const [qrCode, setQrCode] = useState('')

  useEffect(() => {
    const getIps = async (): Promise<void> => {
      const settings = await SettingsStore.getSettings()
      setIps(settings.localIp)
      setPort(settings.devicePort)
    }
    const handleSettingsUpdate = async (settings: Settings): Promise<void> => {
      setIps(settings.localIp)
      setPort(settings.devicePort)
    }
    const handleClientUpdate = (clients: Client[]): void => {
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

  const handleQrClick = (qrCode: string): void => {
    setQrCode(qrCode + ':' + port)
    setQrVisible(true)
  }

  return (
    <div className="pt-5 flex flex-col w-full items-center p-5">
      {qrVisible && <QROverlay ip={qrCode} onClose={() => setQrVisible(false)} />}
      <div className="border-b-2 w-full border-slate-700 p-2">
        <ClientSettings />
      </div>
      <div className="w-full justify-between flex">
        <div className="w-full border rounded-lg gap-2 flex flex-col border-gray-700 p-2">
          <h2 className="text-2xl font-bold m-4">Connected Clients</h2>
          {clients &&
            clients.map((client, index) => <ConnectionStats key={index} client={client} />)}
        </div>
        <div className="w-fit max-w-2xl border rounded-lg gap-2 flex flex-col border-gray-700 p-2">
          {ips &&
            ips.map((ip, index) => (
              <button
                onClick={() => handleQrClick(ip)}
                key={index}
                className="flex gap-2 hover:bg-gray-800 w-full text-gray-300 hover:text-white border-gray-300 hover:border-white items-center p-3 border rounded-lg"
              >
                <IconQR />
                <p className="font-semibold">{ip}</p>
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}

export default Status
