import {
  IconDisconnect,
  IconHome,
  IconLoading,
  IconPause,
  IconPing,
  IconPlay,
  IconPower,
  IconRefresh,
  IconReload,
  IconUpload,
  IconX
} from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import { useSettingsStore } from '@renderer/stores'
import { ProgressChannel } from '@shared/types'
import React, { useState, useRef, useMemo } from 'react'
import Overlay from './Overlay'
import { Client, ClientConnectionMethod } from '@deskthing/types'
import usePlatformStore from '@renderer/stores/platformStore'
import ProgressOverlay from './ProgressOverlay'

interface ClientDetailsOverlayProps {
  onClose: () => void
  client: Client
}

const ClientDetailsOverlay: React.FC<ClientDetailsOverlayProps> = ({ onClose, client }) => {
  const port = useSettingsStore((settings) => settings.settings.devicePort)
  const sendCommand = usePlatformStore((state) => state.runCommand)
  const disconnect = usePlatformStore((state) => state.disconnect)
  const pushStaged = usePlatformStore((state) => state.pushStaged)
  const setServiceStatus = usePlatformStore((state) => state.setServiceStatus)
  const ping = usePlatformStore((state) => state.ping)

  // ADB commands
  const [command, setCommand] = useState('')
  const [response, setResponse] = useState('')

  // State Management
  const [loading, setLoading] = useState(false)
  const [animatingIcons, setAnimatingIcons] = useState<Record<string, boolean>>({})
  const [brightness, setBrightness] = useState(50)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  const adbId = useMemo(() => {
    if (client.manifest?.context.method === ClientConnectionMethod.ADB) {
      return client.manifest.context.adbId
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

  const handleBrightnessChange = (value: number): void => {
    setBrightness(value)

    // Clear the previous timeout if the brightness changes again
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    const transformedValue = Math.round(245 - (value * (245 - 1)) / 100)

    // Set a new debounce timeout to delay the command execution
    debounceTimeout.current = setTimeout(async () => {
      try {
        if (
          client.manifest?.context.method == ClientConnectionMethod.ADB &&
          client.manifest.context.services?.backlight
        ) {
          handleToggleSupervisor('backlight', false)
        }
        await sendCommand(
          adbId!,
          `shell echo ${transformedValue} > /sys/devices/platform/backlight/backlight/aml-bl/brightness`
        )
      } catch (error) {
        console.error('Error setting brightness:', error)
      }
    }, 300) // 300ms debounce delay
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

  const onPushFinish = (): void => {
    setLoading(false)
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

  const handleToggleSupervisor = async (key: string, value: boolean): Promise<void> => {
    setAnimatingIcons((prev) => ({ ...prev, [key]: true }))

    try {
      await setServiceStatus(adbId!, key, value)
    } catch (error) {
      console.error(`Error toggling ${key}:`, error)
    } finally {
      setAnimatingIcons((prev) => ({ ...prev, [key]: false }))
    }
  }

  const handleExecuteCommand = async (): Promise<void> => {
    setAnimatingIcons((prev) => ({ ...prev, command: true }))
    const response = await sendCommand(adbId!, command)
    setResponse(response || 'No response')
    setAnimatingIcons((prev) => ({ ...prev, command: false }))
  }

  return (
    <Overlay
      onClose={onClose}
      className="border border-gray-500 p-4 bg-zinc-900 w-5/6 h-5/6 flex flex-col overflow-hidden"
    >
      <ProgressOverlay channel={ProgressChannel.PLATFORM_CHANNEL} onClose={onPushFinish} />
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
        {client.manifest?.context.method == ClientConnectionMethod.ADB && (
          <>
            <div className="my-4 w-full">
              <p className="text-xs font-geistMono text-white">Brightness</p>
              <input
                id="brightness-slider"
                type="range"
                min="0"
                max="100"
                value={brightness}
                onChange={(e) => handleBrightnessChange(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg accent-white appearance-none cursor-pointer"
              />
              <p className="text-xs font-geistMono text-gray-500">{brightness}%</p>
            </div>
            <div className="my-4">
              <p className="text-xs font-geistMono text-gray-500">App Version</p>
              <h3 className="text-xl">{client.manifest.context.app_version || 'Unknown'}</h3>
            </div>
            <div className="my-4">
              <p className="text-xs font-geistMono text-gray-500">USID</p>
              <h3 className="text-xl">{client.manifest.context.usid || 'Unknown'}</h3>
            </div>
            <div className="my-4">
              <p className="text-xs font-geistMono text-gray-500">MAC BT</p>
              <h3 className="text-xl">{client.manifest.context.mac_bt || 'Unknown'}</h3>
            </div>
            <div className="my-4 flex flex-col gap-1">
              <p className="text-xs font-geistMono text-gray-500">Supervisor Status</p>
              {client.manifest.context.services &&
                Object.entries(client.manifest.context.services).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <h3 className="text-xl">
                      {key}: {value}
                    </h3>
                    <Button
                      title="Toggle Supervisor"
                      className="bg-black group hover:bg-zinc-950 gap-2"
                      onClick={() => handleToggleSupervisor(key, !value)}
                      disabled={animatingIcons[key]}
                    >
                      <p className="bg-black group-hover:block hidden text-nowrap">
                        {animatingIcons[key] ? 'Loading' : value ? 'Disable' : 'Enable'}
                      </p>
                      {animatingIcons[key] ? (
                        <IconLoading />
                      ) : value ? (
                        <IconPause className="text-red-500" />
                      ) : (
                        <IconPlay className="text-green-500" />
                      )}
                    </Button>
                  </div>
                ))}
            </div>
          </>
        )}
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
        {adbId && (
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center gap-2 w-full">
              <input
                onChange={(e) => setCommand(e.target.value)}
                value={command}
                type="text"
                placeholder="Enter ADB command..."
                className="flex-1 px-3 py-2 bg-zinc-900 rounded-md text-white border border-zinc-700 focus:outline-none focus:border-zinc-500"
              />
              <Button
                title="Execute Command"
                className="group bg-black group  hover:bg-zinc-950"
                onClick={handleExecuteCommand}
              >
                {animatingIcons.command ? (
                  <IconLoading />
                ) : (
                  <IconPlay className="text-green-500 group-hover:fill-green-500" />
                )}
              </Button>
            </div>
            {response && (
              <div className="bg-slate-900 p-2">
                {response.split('\n').map((line, index) => (
                  <p key={index} className="text-xs font-geistMono text-gray-300">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="my-4 italic">
        <p className="text-xs font-geistMono text-gray-500">{client.userAgent}</p>
      </div>
    </Overlay>
  )
}

export default ClientDetailsOverlay
