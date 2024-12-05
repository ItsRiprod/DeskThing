import React, { useEffect, useState } from 'react'
import Sidebar from '@renderer/nav/Sidebar'
import { useClientStore, usePageStore, useSettingsStore } from '@renderer/stores'
import Button from '@renderer/components/Button'
import {
  IconCarThingSmall,
  IconDownload,
  IconQR,
  IconRefresh,
  IconReload
} from '@renderer/assets/icons'
import MainElement from '@renderer/nav/MainElement'
import { deviceMessages } from '@renderer/assets/refreshMessages'
import ConnectionComponent from '@renderer/components/Connection'
import { useSearchParams } from 'react-router-dom'

const ClientConnections: React.FC = () => {
  const settings = useSettingsStore((settings) => settings.settings)
  const saveSettings = useSettingsStore((settings) => settings.saveSettings)
  const clients = useClientStore((clients) => clients.clients)
  const stagedClient = useClientStore((clients) => clients.clientManifest)
  const devices = useClientStore((clients) => clients.ADBDevices)
  const refreshClients = useClientStore((clients) => clients.requestADBDevices)
  const setPage = usePageStore((pageStore) => pageStore.setPage)

  // Visibility States
  const [_searchParams, setSearchParams] = useSearchParams()

  // Refreshing ADB Devices
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
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
  const openQr = (): void => {
    setSearchParams({ qr: 'true' })
  }

  const handleDownloadsNav = (): void => {
    setPage('Downloads/Client')
  }

  const handleRestartServerClick = async (): Promise<void> => {
    setIsRestarting(true)
    await window.electron.restartServer()
    await setTimeout(() => {
      setIsRestarting(false)
    }, 1000)
  }

  const handleAutoConfigToggle = (): void => {
    settings.autoConfig = !settings.autoConfig
    saveSettings(settings)
  }

  return (
    <div className="flex h-full w-full">
      <Sidebar className="flex justify-between flex-col h-full md:items-stretch xs:items-center">
        <div>
          <div className="md:block xs:hidden block">
            {settings.localIp &&
              settings.localIp.map((ip, index) => (
                <div key={index} className="text-gray-500">
                  {ip + ':' + settings.devicePort}
                </div>
              ))}
            <div className="border-t border-gray-500 mt-4 pt-4">
              <p className="">Staged Client</p>
              {stagedClient ? (
                <>
                  <p className="text-gray-500">{stagedClient.name}</p>
                  <p className="text-gray-500">Version: {stagedClient.version}</p>
                </>
              ) : (
                <p className="text-red-500 font-semibold">No Client Downloaded</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={handleDownloadsNav} className="hover:bg-zinc-900">
            <IconDownload strokeWidth={1.5} />
            <p className="md:block xs:hidden text-center flex-grow">Downloads</p>
          </Button>
          <Button
            className={`hover:bg-zinc-900 ${isRestarting ? 'cursor-not-allowed opacity-50' : ''}`}
            onClick={handleRestartServerClick}
          >
            <IconReload
              strokeWidth={1.5}
              className={isRestarting ? '-rotate-[360deg] transition-transform duration-1000' : ''}
            />
            <p className="md:block xs:hidden text-center flex-grow">Restart Server</p>
          </Button>
        </div>
      </Sidebar>
      <MainElement>
        <div className="flex flex-col gap-2 p-4">
          <div className="w-full p-4 border rounded-xl border-zinc-900 flex gap-4 justify-between bg-zinc-950">
            <Button className="border-gray-500 gap-2 w-full hover:bg-zinc-900" onClick={openQr}>
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
            <Button
              className={`border-gray-500 w-full group gap-2 border ${settings.autoConfig ? 'bg-zinc-800 border-green-700 hover:bg-zinc-900' : 'hover:bg-zinc-900 border-transparent'}`}
              onClick={handleAutoConfigToggle}
            >
              <IconCarThingSmall strokeWidth={2} iconSize={28} />
              <p className="md:block hidden text-center flex-grow">
                <span className="hidden group-hover:inline">
                  {settings.autoConfig ? 'Disable' : 'Enable'}
                </span>{' '}
                Auto Config
              </p>
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
