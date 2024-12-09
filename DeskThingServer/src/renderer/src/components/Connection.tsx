import {
  IconCarThingSmall,
  IconComputer,
  IconConfig,
  IconLoading,
  IconLogs,
  IconMobile,
  IconPing,
  IconRefresh,
  IconX
} from '@renderer/assets/icons'
import { Client, LoggingData } from '@shared/types'
import React, { useEffect, useState } from 'react'
import Button from './Button'
// import { useSettingsStore } from '@renderer/stores'
import ClientDetailsOverlay from '@renderer/overlays/ClientDetailsOverlay'
import DownloadNotification from '@renderer/overlays/DownloadNotification'
import { useClientStore, useSettingsStore } from '@renderer/stores'

interface ConnectionComponentProps {
  client: Client
}

const ConnectionComponent: React.FC<ConnectionComponentProps> = ({ client }) => {
  // const port = useSettingsStore((settings) => settings.settings.devicePort)
  const [loading, setLoading] = useState(false)
  const [animatingIcons, setAnimatingIcons] = useState<Record<string, boolean>>({})
  const [logging, setLogging] = useState<LoggingData | null>()
  const [enabled, setEnabled] = useState(false)
  const [showLogging, setShowLogging] = useState(false)
  const [offline, setOffline] = useState(false)
  const refreshADbClients = useClientStore((store) => store.requestADBDevices)
  const requestClientManifest = useClientStore((store) => store.requestClientManifest)
  const devicePort = useSettingsStore((store) => store.settings.devicePort)

  useEffect(() => {
    if (client.adbId?.includes('offline')) {
      setOffline(true)
    } else {
      setOffline(false)
    }
  }, [client])

  const renderIcon = (): JSX.Element => {
    if (!client.device_type) return <IconComputer iconSize={128} />

    switch (client.device_type.id) {
      case 1:
        return <IconComputer iconSize={128} />
      case 2:
        return <IconComputer iconSize={128} />
      case 3:
        return <IconMobile iconSize={128} />
      case 4:
        return <IconCarThingSmall iconSize={128} />
      default:
        return <IconComputer iconSize={128} />
    }
  }

  const handleAdbCommand = async (command: string): Promise<string | undefined> => {
    try {
      setShowLogging(true)
      setLogging({ status: true, final: false, data: command })
      setLoading(true)
      const response = await window.electron.handleClientADB(command)
      if (response) {
        setLoading(false)
        setLogging({ status: true, final: true, data: response })
        console.log('Response from adb command:', response)
        return response
      } else {
        setLogging({ status: true, final: true, data: 'Sent Successfully!' })
        setLoading(false)
      }
      return undefined
    } catch (Error) {
      setLogging({
        status: false,
        error: `${Error}`,
        final: true,
        data: 'Unable to send ADB command!'
      })
      console.log(Error)
      return undefined
    }
  }

  const onPushFinish = (): void => {
    setLoading(false)
    setShowLogging(false)
  }

  const configureDevice = async (): Promise<void> => {
    setShowLogging(true)
    if (!client.adbId) {
      setLogging({ status: true, final: true, data: 'No Device Detected' })
      return
    }

    try {
      setLogging({ status: true, final: false, data: 'Configuring Device' })
      setLoading(true)
      window.electron.configureDevice(client.adbId.split(' ')[0])
      const unsubscribe = window.electron.ipcRenderer.on('logging', (_event, reply) => {
        console.log(reply)
        setLogging(reply)
        if (reply.final) {
          unsubscribe()
          requestClientManifest()
        }
      })
    } catch (error) {
      setLoading(false)
      console.log(error)
    }
  }

  const restartChromium = async (): Promise<void> => {
    if (!client.adbId) return

    setAnimatingIcons((prev) => ({ ...prev, chromium: true }))
    await handleAdbCommand(`-s ${client.adbId.split(' ')[0]} shell supervisorctl restart chromium`)
    setAnimatingIcons((prev) => ({ ...prev, chromium: false }))
  }

  const handlePing = async (): Promise<void> => {
    setAnimatingIcons((prev) => ({ ...prev, ping: true }))
    await window.electron.pingClient(client.connectionId)

    setShowLogging(true)
    setLogging({ status: true, final: false, data: 'Pinging client...' })

    const pongPromise = new Promise<void>((resolve) => {
      const onPong = (_event: Electron.IpcRendererEvent, payload: string): void => {
        console.log(`Got ping response from ${client.connectionId}: `, payload)
        setLogging({ status: true, final: true, data: `Ping successful: ${payload}` })
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
        setLogging({ status: false, final: true, data: 'Ping timed out' })
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
    window.electron.disconnectClient(client.connectionId)
  }

  const handleConnectOffline = async (): Promise<void> => {
    setLoading(true)
    await window.electron.handleClientADB('reconnect offline')
    await setTimeout(() => refreshADbClients, 5000)
    if (client.adbId) {
      await window.electron.handleClientADB(
        `-s ${client.adbId.split(' ')[0]} reverse tcp:${devicePort} tcp:${devicePort}`
      )
    }
    setLoading(false)
  }

  return (
    <div className="w-full p-4 border rounded-xl border-zinc-900 flex flex-col lg:flex-row gap-4 justify-center items-center lg:justify-between bg-zinc-950">
      {enabled && <ClientDetailsOverlay client={client} onClose={() => setEnabled(false)} />}
      {logging && showLogging && (
        <DownloadNotification
          loggingData={logging}
          onClose={onPushFinish}
          title="Running command"
        />
      )}
      <div className="flex gap-2 items-center">
        {renderIcon()}
        <div>
          <p>Platform</p>
          <h2 className="text-2xl">{client.device_type?.name || 'Unknown Platform'}</h2>
          <h2 className="text-sm text-gray-500 font-geistMono">
            {client.adbId || client.connectionId}
          </h2>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        {!client.connected && offline ? (
          <p className="text-red-500 italic">Device Offline!</p>
        ) : (
          !client.connected && <p className="text-red-500 italic">Not Connected!</p>
        )}
        {client.adbId && !offline && (
          <>
            <Button
              className="group hover:bg-zinc-900 gap-2"
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
              <p className="hidden group-hover:block">
                Restart <span className="hidden lg:inline">Chromium</span>
              </p>
            </Button>
            {!client.connected && (
              <Button
                className="group relative hover:bg-zinc-900 gap-2"
                onClick={configureDevice}
                disabled={loading}
              >
                <div className="absolute inset-0 w-full h-full border-blue-500 border animate-pulse rounded-lg"></div>
                <IconConfig />
                <p className="hidden group-hover:block lg:block">
                  Config<span className="hidden lg:inline">ure</span>
                </p>
              </Button>
            )}
          </>
        )}
        {offline && (
          <Button
            className="group hover:bg-red-900 gap-2 border-red-500 border"
            onClick={handleConnectOffline}
            disabled={loading}
          >
            {loading ? <IconLoading /> : <IconConfig />}
            <p className="">
              Reconnect<span className="hidden lg:inline"> Device</span>
            </p>
          </Button>
        )}
        {!offline && (
          <Button className="group hover:bg-zinc-900 gap-2" onClick={() => setEnabled(true)}>
            <IconLogs />
            <p className="hidden group-hover:block">Details</p>
          </Button>
        )}
        {client.connected && !offline && (
          <>
            <Button className="group hover:bg-zinc-900 gap-2" onClick={handlePing}>
              <IconPing className={animatingIcons.ping ? 'animate-ping' : ''} />
              <p className="hidden group-hover:block">Ping</p>
            </Button>
            <Button
              className="group bg-red-700 gap-2"
              disabled={loading}
              onClick={handleDisconnect}
            >
              <IconX />
              <p className="hidden group-hover:block">Disconnect</p>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default ConnectionComponent
