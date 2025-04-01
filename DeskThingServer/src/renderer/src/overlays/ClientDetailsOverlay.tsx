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
import React, { useState, useRef, useEffect, useMemo } from 'react'
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
  const ping = usePlatformStore((state) => state.ping)

  // ADB commands
  const [command, setCommand] = useState('')
  const [response, setResponse] = useState('')

  // State Management
  const [loading, setLoading] = useState(false)
  const [animatingIcons, setAnimatingIcons] = useState<Record<string, boolean>>({})
  const [brightness, setBrightness] = useState(50)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const [deviceData, setDeviceData] = useState<{
    app_version?: string
    usid?: string
    mac_bt?: string
  }>({})
  const [supervisorData, setSupervisorData] = useState<Record<string, string>>({})

  const adbId = useMemo(() => {
    if (client.manifest?.context.method === ClientConnectionMethod.ADB) {
      return client.manifest.context.adbId
    } else {
      return undefined
    }
  }, [client.manifest?.context.method])

  const getSupervisorData = async (): Promise<void> => {
    if (!adbId) return

    const supervisorResponse = await sendCommand(adbId, 'shell supervisorctl status')
    console.log('Raw adb response (supervisorctl):', supervisorResponse)
    if (supervisorResponse) {
      const supervisorLines = supervisorResponse.trim().split('\n')
      const parsedData: Record<string, string> = {}
      supervisorLines.forEach((line) => {
        const [name, status] = line.split(/\s+/)
        if (name && status) {
          parsedData[name] = status
        }
      })
      setSupervisorData(parsedData)
    }
  }

  useEffect(() => {
    const getDeviceData = async (): Promise<void> => {
      if (!adbId) return

      try {
        // Get version info
        const versionResponse = await sendCommand(adbId, 'shell cat /etc/superbird/version')
        console.log('Raw adb response (version):', versionResponse)
        if (versionResponse) {
          const versionMatch = versionResponse.match(/SHORT_VERSION\s+(\S+)/)
          if (versionMatch) {
            const shortVersion = versionMatch[1].trim()
            setDeviceData((prevData) => ({
              ...prevData,
              app_version: shortVersion
            }))
          } else {
            console.error('SHORT_VERSION not found in adb response')
          }
        }

        // Get USID info
        const usidResponse = await sendCommand(adbId, 'shell cat /sys/class/efuse/usid')
        console.log('Raw adb response (usid):', usidResponse)
        // Set USID data
        if (usidResponse) {
          setDeviceData((prevData) => ({
            ...prevData,
            usid: usidResponse.trim()
          }))
        }

        // Get MAC BT info
        const macBtResponse = await sendCommand(adbId, 'shell cat /sys/class/efuse/mac_bt')
        console.log('Raw adb response (mac_bt):', macBtResponse)

        // Format MAC BT data
        if (macBtResponse) {
          const macBtFormatted = macBtResponse
            .split('\n')
            .map((line) => line.trim())
            .join(' ')
          setDeviceData((prevData) => ({
            ...prevData,
            mac_bt: macBtFormatted
          }))
        }

        // Get supervisorctl info
        getSupervisorData()
      } catch (error) {
        console.error('Error retrieving device data:', error)
      }
    }

    getDeviceData()
  }, [adbId, sendCommand])

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

    if (supervisorData['backlight'] === 'RUNNING') {
      handleToggleSupervisor('backlight', false)
    }

    // Clear the previous timeout if the brightness changes again
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    const transformedValue = Math.round(245 - (value * (245 - 1)) / 100)

    // Set a new debounce timeout to delay the command execution
    debounceTimeout.current = setTimeout(async () => {
      try {
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
    await ping(client.connectionId)

    const pongPromise = new Promise<void>((resolve) => {
      const onPong = (_event: Electron.IpcRendererEvent, payload: string): void => {
        console.log(`Got ping response from ${client.connectionId}: `, payload)
        setTimeout(() => {
          setAnimatingIcons((prev) => ({ ...prev, ping: false }))
        }, 1000)
        resolve()
      }
      window.electron.ipcRenderer.once(`pong-${client.connectionId}`, onPong)
    })

    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log(`Ping timed out for ${client.connectionId}`)
        setAnimatingIcons((prev) => ({ ...prev, ping: false }))
        resolve()
      }, 5000)
    })

    try {
      await Promise.race([pongPromise, timeoutPromise])
    } finally {
      window.electron.ipcRenderer.removeAllListeners(`pong-${client.connectionId}`)
    }
  }

  const handleDisconnect = (): void => {
    disconnect(client.connectionId)
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
    const action = value ? 'start' : 'stop'
    setAnimatingIcons((prev) => ({ ...prev, [key]: true }))

    try {
      await sendCommand(adbId!, `shell supervisorctl ${action} ${key}`)
    } catch (error) {
      console.error(`Error toggling ${key}:`, error)
    } finally {
      setAnimatingIcons((prev) => ({ ...prev, [key]: false }))
    }

    getSupervisorData()
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
        <h1 className="font-semibold text-2xl">{client.manifest?.context.name || client.id}</h1>
        <p className="text-gray-500 text-lg">{adbId || client.connectionId}</p>
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
        {adbId && (
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
              <h3 className="text-xl">{deviceData.app_version || 'Unknown'}</h3>
            </div>
            <div className="my-4">
              <p className="text-xs font-geistMono text-gray-500">USID</p>
              <h3 className="text-xl">{deviceData.usid || 'Unknown'}</h3>
            </div>
            <div className="my-4">
              <p className="text-xs font-geistMono text-gray-500">MAC BT</p>
              <h3 className="text-xl">{deviceData.mac_bt || 'Unknown'}</h3>
            </div>
            <div className="my-4 flex flex-col gap-1">
              <p className="text-xs font-geistMono text-gray-500">Supervisor Status</p>
              {Object.entries(supervisorData).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <h3 className="text-xl">
                    {key}: {value}
                  </h3>
                  <Button
                    title="Toggle Supervisor"
                    className="bg-black group hover:bg-zinc-950 gap-2"
                    onClick={() => handleToggleSupervisor(key, value != 'RUNNING')}
                    disabled={animatingIcons[key]}
                  >
                    <p className="bg-black group-hover:block hidden text-nowrap">
                      {animatingIcons[key] ? 'Loading' : value == 'RUNNING' ? 'Disable' : 'Enable'}
                    </p>
                    {animatingIcons[key] ? (
                      <IconLoading />
                    ) : value != 'RUNNING' ? (
                      <IconPlay className="text-green-500" />
                    ) : (
                      <IconPause className="text-red-500" />
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
