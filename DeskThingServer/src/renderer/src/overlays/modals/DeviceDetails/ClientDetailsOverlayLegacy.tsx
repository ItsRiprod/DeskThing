import {
  IconDisconnect,
  IconHome,
  IconLoading,
  IconPing,
  IconPower,
  IconRefresh,
  IconReload,
  IconUpload,
  IconX
} from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import { useSettingsStore } from '@renderer/stores'
import React, { useState, useMemo } from 'react'
import Overlay from '../../Overlay'
import { Client, ClientConnectionMethod } from '@deskthing/types'
import usePlatformStore from '@renderer/stores/platformStore'
import ADBDeviceDetails from './ADBDetails'

interface ClientDetailsOverlayProps {
  onClose: () => void
  client: Client
}

const ClientDetailsOverlay: React.FC<ClientDetailsOverlayProps> = ({ onClose, client }) => {
  const port = useSettingsStore((settings) => settings.settings.device_devicePort)
  const sendCommand = usePlatformStore((state) => state.runCommand)
  const disconnect = usePlatformStore((state) => state.disconnect)
  const pushStaged = usePlatformStore((state) => state.pushStaged)
  const ping = usePlatformStore((state) => state.ping)

  // State Management
  const [loading, setLoading] = useState(false)
  const [animatingIcons, setAnimatingIcons] = useState<Record<string, boolean>>({})

  const adbId = useMemo(() => {
    if (client.manifest?.context.method === ClientConnectionMethod.ADB) {
      return client.meta.adb?.adbId
    } else {
      return undefined
    }
  }, [client.manifest?.context.method])

  const handleAdbCommand = async (command: string): Promise<string | undefined> => {
    try {
      setLoading(true)
      const response = await sendCommand(adbId!, command)
      if (response) {
        setLoading(false)
        console.log('Response from adb command:', response)
        return response
      } else {
        setLoading(false)
      }
      return undefined
    } catch (Error) {
      console.log(Error)
      return undefined
    }
  }

  const handlePushStaged = (): void => {
    if (!adbId) {
      console.error('ADB ID is required')
      return
    }

    try {
      setLoading(true)
      pushStaged(adbId)
    } catch (error) {
      setLoading(false)
      console.log(error)
    }
  }

  const restartChromium = (): void => {
    if (!adbId) return

    setAnimatingIcons((prev) => ({ ...prev, chromium: true }))
    handleAdbCommand(`shell supervisorctl restart chromium`)
    setTimeout(() => {
      setAnimatingIcons((prev) => ({ ...prev, chromium: false }))
    }, 1000)
  }

  const openPort = (): void => {
    if (!adbId) return
    handleAdbCommand(`reverse tcp:${port} tcp:${port}`)
  }

  const handlePing = async (): Promise<void> => {
    setAnimatingIcons((prev) => ({ ...prev, ping: true }))
    await ping(client.clientId)
    setAnimatingIcons((prev) => ({ ...prev, ping: false }))
  }

  const handleDisconnect = (): void => {
    disconnect(client.clientId)
  }

  const handleRestart = async (): Promise<void> => {
    setAnimatingIcons((prev) => ({ ...prev, restart: true }))

    await sendCommand(adbId!, 'shell reboot')
    setTimeout(() => {
      setAnimatingIcons((prev) => ({ ...prev, restart: false }))
    }, 300)
  }

  const handleShutdown = (): void => {
    sendCommand(adbId!, 'shell poweroff')
  }

  const handleChangeView = (): void => {
    // window.electron.handleClientCommand({
    //   app: 'client',
    //   type: 'set',
    //   request: 'view',
    //   payload: 'utility'
    // })
  }

  return (
    <Overlay
      onClose={onClose}
      className="border border-gray-500 p-4 bg-zinc-900 w-5/6 h-5/6 flex flex-col overflow-hidden"
    >
      <div className="w-full px-1 py-4 flex items-center gap-2">
        <h1 className="font-semibold text-2xl">
          {client.manifest?.context.name || client.clientId}
        </h1>
        <p className="text-gray-500 text-lg">{adbId || client.clientId}</p>
      </div>
      <div className="w-full px-1 gap-1 flex items-center justify-evenly">
        {client.connected && (
          <Button
            className="bg-black group hover:bg-zinc-950 gap-2 w-full justify-center"
            onClick={handleChangeView}
          >
            <IconHome />
            <p className="bg-black group-hover:block hidden text-nowrap">Set View</p>
          </Button>
        )}
        {adbId && (
          <>
            <Button
              title="Set Device Client to Staged Client"
              className="bg-black group hover:bg-zinc-950 gap-2 w-full justify-center"
              onClick={handlePushStaged}
              disabled={loading}
            >
              {loading ? <IconLoading /> : <IconUpload />}
              <p className="bg-black group-hover:block hidden text-nowrap">Push Staged</p>
            </Button>
            <Button
              title="Restart Client's Chromium"
              className="bg-black group hover:bg-zinc-950 gap-2 w-full justify-center"
              onClick={restartChromium}
              disabled={loading}
            >
              <IconRefresh
                className={
                  animatingIcons.chromium
                    ? 'rotate-[360deg] transition-transform duration-1000'
                    : ''
                }
              />
              <p className="bg-black group-hover:block hidden text-nowrap">Reload Chromium</p>
            </Button>
            <Button
              title="Setup ADB Port for Device"
              className="bg-black group hover:bg-zinc-950 gap-2 w-full justify-center"
              onClick={openPort}
              disabled={loading}
            >
              <IconDisconnect />
              <p className="bg-black group-hover:block hidden text-nowrap">Setup Port</p>
            </Button>
            <Button
              title="Restart the Client"
              className="bg-black group border-red-500 border hover:bg-zinc-950 gap-2 w-full justify-center"
              onClick={handleRestart}
              disabled={loading}
            >
              <IconReload
                className={
                  animatingIcons.restart && '-rotate-[360deg] transition-transform duration-500'
                }
              />
              <p className="bg-black group-hover:block hidden text-nowrap">Restart</p>
            </Button>
            <Button
              title="Shutdown the Client"
              className="bg-black group border-red-500 border hover:bg-zinc-950 gap-2 w-full justify-center"
              onClick={handleShutdown}
              disabled={loading}
            >
              {loading ? <IconLoading /> : <IconPower />}
              <p className="bg-black group-hover:block hidden text-nowrap">Power Off</p>
            </Button>
          </>
        )}
        {client.connected && (
          <>
            <Button
              title="Ping the Client"
              className="bg-black group hover:bg-zinc-950 gap-2 w-full justify-center"
              onClick={handlePing}
            >
              <IconPing className={animatingIcons.ping ? 'animate-ping' : ''} />
              <p className="bg-black group-hover:block hidden text-nowrap">Ping</p>
            </Button>
            <Button
              title="Disconnect the Client"
              className="group bg-red-700 gap-2 w-full justify-center"
              onClick={handleDisconnect}
            >
              <IconX />
              <p className="group-hover:block hidden text-nowrap">Disconnect</p>
            </Button>
          </>
        )}
      </div>
      <div className="h-full overflow-y-scroll">
        <div className="my-4">
          <p className="text-xs font-geistMono text-gray-500">{client.manifest?.version}</p>
          <h3 className="text-xl">{client.manifest?.context.name}</h3>
          <p className="text-xs font-geistMono text-gray-500">{client.manifest?.description}</p>
        </div>
        <div className="my-4">
          <p className="text-xs font-geistMono text-gray-500">Platform</p>
          <h3 className="text-xl">{client.manifest?.context.name || 'Unknown'}</h3>
        </div>
        <div className="my-4">
          <p className="text-xs font-geistMono text-gray-500">Connection IP</p>
          <h3 className="text-xl">
            {client.manifest?.context.ip}:{client.manifest?.context.port}
          </h3>
        </div>
        {client.identifiers.adb && <ADBDeviceDetails client={client} />}
      </div>
      <div className="my-4 italic">
        <p className="text-xs font-geistMono text-gray-500">{client.userAgent}</p>
      </div>
    </Overlay>
  )
}

export default ClientDetailsOverlay
