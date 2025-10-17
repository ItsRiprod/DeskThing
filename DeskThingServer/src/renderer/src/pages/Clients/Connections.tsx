import React, { useEffect, useRef, useState } from 'react'
import Sidebar from '@renderer/nav/Sidebar'
import { useClientStore, usePageStore, useSettingsStore } from '@renderer/stores'
import Button from '@renderer/components/buttons/Button'
import {
  IconDownload,
  IconLink,
  IconPlus,
  IconQR,
  IconRefresh,
  IconReload
} from '@renderer/assets/icons'
import MainElement from '@renderer/nav/MainElement'
import { deviceMessages } from '@renderer/assets/refreshMessages'
import ConnectionComponent from '@renderer/components/Client/Connection'
import { useSearchParams } from 'react-router-dom'
import { ProgressChannel } from '@shared/types'
import { useChannelProgress } from '@renderer/hooks/useProgress'

const ClientConnections: React.FC = () => {
  const settings = useSettingsStore((settings) => settings.settings)
  const clients = useClientStore((state) => state.clients)
  const clientManifest = useClientStore((state) => state.clientManifest)
  const refreshConnections = useClientStore((state) => state.refreshConnections)
  const setPage = usePageStore((pageStore) => pageStore.setPage)
  const refreshClient = useClientStore((clientStore) => clientStore.requestClientManifest)
  const downloadLatestClient = useClientStore((state) => state.downloadLatestClient)
  useChannelProgress(ProgressChannel.IPC_PLATFORM)
  useChannelProgress(ProgressChannel.IPC_CLIENT)

  const refreshRef = useRef<HTMLButtonElement>(null)

  // Visibility States
  const [searchParams, setSearchParams] = useSearchParams()

  // Refreshing ADB Devices
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  useEffect(() => {
    if (clients.length === 0) {
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

  const handleRefresh = async (): Promise<void> => {
    if (!isRefreshing) {
      setIsRefreshing(true)
      const res = await refreshConnections()
      console.log('Found', res)
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
    searchParams.set('qr', 'true')
    setSearchParams(searchParams)
  }

  // Functions
  const openSetup = (): void => {
    searchParams.set('setup', 'true')
    searchParams.set('page', 'adb')
    setSearchParams(searchParams)
  }

  const handleDownloadsNav = (): void => {
    setPage('Downloads/Client')
  }

  const handleRestartServerClick = async (): Promise<void> => {
    setIsRestarting(true)
    await window.electron.utility.restartServer()
    setTimeout(() => {
      setIsRestarting(false)
    }, 1000)
  }

  const handleRefreshData = async (): Promise<void> => {
    if (!isRefreshing) {
      setIsRefreshing(true)
      await refreshClient()
      setTimeout(
        () => {
          setIsRefreshing(false)
        },
        Math.random() * 2000 + 1500
      )
    }
  }

  const handleDownloadLatest = async (): Promise<void> => {
    setIsDownloading(true)
    await downloadLatestClient()
    await refreshClient()
    setIsDownloading(false)
  }

  return (
    <div className="flex h-full w-full">
      <Sidebar className="flex justify-between flex-col h-full md:items-stretch xs:items-center">
        <div>
          <div className="md:block xs:hidden block">
            {settings.flag_nerd &&
              settings.server_localIp &&
              settings.server_localIp.map((ip, index) => (
                <div key={index} className="text-gray-500">
                  {ip + ':' + settings.device_devicePort}
                </div>
              ))}

            <div className="border-t border-gray-500 mt-4 pt-4">
              {clientManifest ? (
                <>
                  <p className="">Staged Client</p>
                  <p className="text-gray-500">{clientManifest.name}</p>
                  <p className="text-gray-500">Version: {clientManifest.version}</p>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-red-500 font-semibold text-center">No Client Found!</p>
                  <div className="flex justify-around w-full md:flex-row flex-col bg-red-900 rounded-full">
                    <Button
                      onClick={handleRefreshData}
                      className="hover:font-semibold hover:bg-red-800 rounded-3xl group"
                      title="Refresh Client"
                      disabled={isRefreshing}
                    >
                      <IconRefresh
                        className={`group-disabled:opacity-50 group-hover:stroke-2 ${isRefreshing ? 'animate-spin-smooth' : ''}`}
                        strokeWidth={1.5}
                      />
                    </Button>
                    <Button
                      disabled={isDownloading}
                      onClick={handleDownloadLatest}
                      title="Download Latest"
                      className="hover:font-semibold hover:bg-red-800 rounded-3xl group"
                    >
                      <IconDownload
                        strokeWidth={1.5}
                        className="group-disabled:opacity-50 group-hover:stroke-2"
                      />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            title="Go to Downloads Page"
            onClick={handleDownloadsNav}
            className="hover:bg-zinc-900"
          >
            <IconLink strokeWidth={1.5} />
            <p className="md:block xs:hidden text-center flex-grow">Downloads</p>
          </Button>
          {settings.flag_nerd && (
            <Button
              className={`hover:bg-zinc-900 ${isRestarting ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={handleRestartServerClick}
              title="Restart the server"
            >
              <IconReload
                strokeWidth={1.5}
                className={
                  isRestarting ? '-rotate-[360deg] transition-transform duration-1000' : ''
                }
              />
              <p className="md:block xs:hidden text-center flex-grow">Restart Server</p>
            </Button>
          )}
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
              ref={refreshRef}
            >
              <IconRefresh strokeWidth={1.5} className={isRefreshing ? 'animate-spin' : ''} />
              <p className="md:block hidden text-center flex-grow">
                {isRefreshing ? 'Searching...' : 'Refresh'}
              </p>
            </Button>
            <Button
              className={`border-gray-500 w-full group gap-2 border hover:bg-zinc-900 border-transparent`}
              onClick={openSetup}
            >
              <IconPlus strokeWidth={2} iconSize={28} />
              <p className="md:block hidden text-center flex-grow">Add Device</p>
            </Button>
          </div>
          <div className="font-geistMono w-full h-full items-center flex flex-col gap-2 justify-center">
            {clients.length > 0 ? (
              clients.map((client) => <ConnectionComponent key={client.clientId} client={client} />)
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
