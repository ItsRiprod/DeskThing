import React, { useEffect, useState } from 'react'
import Sidebar from '@renderer/nav/Sidebar'
import { useClientStore, usePageStore, useSettingsStore } from '@renderer/stores'
import Button from '@renderer/components/Button'
import { IconCarThing, IconDownload, IconQR, IconRefresh, IconReload } from '@renderer/assets/icons'
import QROverlay from '@renderer/overlays/QROverlay'
import MainElement from '@renderer/nav/MainElement'
import { deviceMessages } from '@renderer/assets/refreshMessages'
import ConnectionComponent from '@renderer/components/Connection'

const ClientConnections: React.FC = () => {
  const settings = useSettingsStore((settings) => settings.settings)
  const clients = useClientStore((clients) => clients.clients)
  const devices = useClientStore((clients) => clients.ADBDevices)
  const refreshClients = useClientStore((clients) => clients.requestADBDevices)
  const setPage = usePageStore((pageStore) => pageStore.setPage)

  // Visibility States
  const [showQR, setShowQR] = useState(false)

  // Refreshing ADB Devices
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  useEffect(() => {
    if (devices.length === 0) {
      const eligibleMessages = deviceMessages.filter((msg) => msg.minimum <= refreshCount)
      const totalWeight = eligibleMessages.reduce((sum, msg) => sum + msg.weight, 0)
      let randomWeight = Math.random() * totalWeight
      let selectedIndex = 0

      for (let i = 0; i < eligibleMessages.length; i++) {
        randomWeight -= eligibleMessages[i].weight
        if (randomWeight <= 0) {
          selectedIndex = deviceMessages.findIndex(
            (msg) => msg.message === eligibleMessages[i].message
          )
          break
        }
      }

      setCurrentMessageIndex(selectedIndex)
    }
  }, [refreshCount])

  const handleRefresh = (): void => {
    if (!isRefreshing) {
      setIsRefreshing(true)
      refreshClients()
      setTimeout(
        () => {
          setIsRefreshing(false)
          setRefreshCount((prevCount) => prevCount + 1)
        },
        Math.random() * 1200 + 300
      )
    }
  }

  // Functions
  const toggleQR = (): void => {
    setShowQR(!showQR)
  }

  const handleDownloadsNav = (): void => {
    setPage('Downloads/Client')
  }

  return (
    <div className="flex h-full w-full">
      {showQR && <QROverlay onClose={toggleQR} />}
      <Sidebar className="flex justify-between flex-col h-full md:items-stretch items-center">
        <div>
          <div>
            <p className="md:inline hidden">Server is </p> Running
          </div>
          <div className="md:block hidden">
            {settings.localIp &&
              settings.localIp.map((ip, index) => (
                <div key={index}>{ip + ':' + settings.devicePort}</div>
              ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={handleDownloadsNav}>
            <IconDownload strokeWidth={1.5} />
            <p className="md:block hidden text-center flex-grow">Downloads</p>
          </Button>
          <Button className="border-gray-500 hover:bg-gray-500">
            <IconReload strokeWidth={1.5} />
            <p className="md:block hidden text-center flex-grow">Restart Server</p>
          </Button>
        </div>
      </Sidebar>
      <MainElement>
        <div className="flex flex-col gap-2 p-4">
          <div className="w-full p-4 border rounded-xl border-zinc-900 flex gap-4 justify-between bg-zinc-950">
            <Button className="border-gray-500 gap-2 w-full hover:bg-zinc-900" onClick={toggleQR}>
              <IconQR />
              <p className="md:block hidden text-center flex-grow">QR Code</p>
            </Button>
            <Button
              className={`border-gray-500 w-full hover:bg-zinc-900 gap-2 ${isRefreshing ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <IconRefresh strokeWidth={1.5} className={isRefreshing ? 'animate-spin' : ''} />
              <p className="md:block hidden text-center flex-grow">
                {isRefreshing ? 'Searching...' : 'Refresh ADB'}
              </p>
            </Button>
            <Button className="border-gray-500 w-full hover:bg-zinc-900 gap-2">
              <IconCarThing strokeWidth={1.5} />
              <p className="md:block hidden text-center flex-grow">Auto Config</p>
            </Button>
          </div>
          <div className="font-geistMono w-full h-full items-center flex flex-col gap-2 justify-center">
            {clients.length > 0 ? (
              clients.map((client) => (
                <ConnectionComponent key={client.connectionId} client={client} />
              ))
            ) : (
              <div className="first-letter:">
                <p>{deviceMessages[currentMessageIndex].message}</p>
              </div>
            )}
          </div>
        </div>
      </MainElement>
    </div>
  )
}

export default ClientConnections
