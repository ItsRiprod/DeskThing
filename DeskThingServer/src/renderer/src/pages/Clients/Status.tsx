import React, { useState } from 'react'
import Sidebar from '@renderer/components/Sidebar'
import { useClientStore, useSettingsStore } from '@renderer/stores'
import Button from '@renderer/components/Button'
import { IconQR, IconReload } from '@renderer/assets/icons'
import QROverlay from '@renderer/overlays/QROverlay'
import ClientComponent from '@renderer/components/Client'
import MainElement from '@renderer/components/MainElement'

const ClientStatus: React.FC = () => {
  const settings = useSettingsStore((settings) => settings.settings)
  const clients = useClientStore((clients) => clients.clients)
  const [showQR, setShowQR] = useState(false)

  const toggleQR = (): void => {
    setShowQR(!showQR)
  }

  return (
    <div className="flex h-full w-full">
      {showQR && <QROverlay onClose={toggleQR} />}
      <Sidebar className="flex justify-between flex-col h-full md:items-stretch items-center">
        <div>
          <div className="md:block hidden">
            {settings.localIp &&
              settings.localIp.map((ip, index) => (
                <div key={index}>{ip + ':' + settings.devicePort}</div>
              ))}
          </div>
          <div>
            <p className="md:inline hidden">Server is </p> Running
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button className="border-gray-500 hover:bg-gray-500">
            <IconReload strokeWidth={1.5} />
            <p className="md:block hidden text-center flex-grow">Restart</p>
          </Button>
          <Button className="border-gray-500 hover:bg-gray-500" onClick={toggleQR}>
            <IconQR />
            <p className="md:block hidden text-center flex-grow">QR Code</p>
          </Button>
        </div>
      </Sidebar>
      <MainElement>
        <h1 className="text-2xl font-bold m-4">Connected Clients</h1>
        {clients.length > 0 ? (
          clients.map((client) => (
            <div key={client.connectionId}>
              <ClientComponent client={client} />
            </div>
          ))
        ) : (
          <div className="font-geistMono w-full h-full items-center flex justify-center">
            <p>No clients connected</p>
          </div>
        )}
      </MainElement>
    </div>
  )
}

export default ClientStatus
