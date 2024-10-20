import {
  IconCarThingSmall,
  IconComputer,
  IconConfig,
  IconLogs,
  IconMobile,
  IconPing,
  IconRefresh,
  IconX
} from '@renderer/assets/icons'
import { Client, LoggingData } from '@shared/types'
import React, { useState } from 'react'
import Button from './Button'
import { useSettingsStore } from '@renderer/stores'
import ClientDetailsOverlay from '@renderer/overlays/ClientDetailsOverlay'
import DownloadNotification from '@renderer/overlays/DownloadNotification'

interface ConnectionComponentProps {
  client: Client
}

const ConnectionComponent: React.FC<ConnectionComponentProps> = ({ client }) => {
  const port = useSettingsStore((settings) => settings.settings.devicePort)
  const [loading, setLoading] = useState(false)
  const [logging, setLogging] = useState<LoggingData | null>()
  const [enabled, setEnabled] = useState(false)
  const [showLogging, setShowLogging] = useState(false)

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

  const handlePushStaged = (): void => {
    setShowLogging(true)
    if (!client.adbId) {
      setLogging({ status: true, final: true, data: 'No Device Detected' })
      return
    }

    try {
      setLogging({ status: true, final: false, data: 'Pushing App' })
      setLoading(true)
      window.electron.pushStagedApp(client.adbId)
      const unsubscribe = window.electron.ipcRenderer.on('logging', (_event, reply) => {
        console.log(reply)
        setLogging(reply)
        if (reply.final) {
          unsubscribe()
        }
        if (!reply.status) {
          unsubscribe()
        }
      })
    } catch (error) {
      setLoading(false)
      console.log(error)
    }
  }

  const onPushFinish = (): void => {
    setLoading(false)
    setShowLogging(false)
  }

  const handleDeviceClick = (): void => {
    setLoading(true)
    setEnabled(true)
    setTimeout(async () => {
      setLoading(false)
    }, 1000)
  }

  const configureDevice = async (): Promise<void> => {
    await handlePushStaged()
    await openPort()
  }

  const restartChromium = (): void => {
    if (!client.adbId) return

    handleAdbCommand(`-s ${client.adbId} shell supervisorctl restart chromium`)
  }

  const openPort = (): void => {
    if (!client.adbId) return
    handleAdbCommand(`-s ${client.adbId} reverse tcp:${port} tcp:${port}`)
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
        {!client.connected && <p className="text-red-500 italic">Not Connected!</p>}
        {client.adbId && (
          <>
            <Button className="group hover:bg-zinc-900 gap-2" onClick={restartChromium}>
              <IconRefresh />
              <p className="hidden group-hover:block">
                Restart <span className="hidden lg:inline">Chromium</span>
              </p>
            </Button>
            <Button className="group hover:bg-zinc-900 gap-2" onClick={configureDevice}>
              <IconConfig />
              <p className="hidden group-hover:block">
                Config<span className="hidden lg:inline">ure</span>
              </p>
            </Button>
          </>
        )}
        <Button className="group hover:bg-zinc-900 gap-2" onClick={() => setEnabled(true)}>
          <IconLogs />
          <p className="hidden group-hover:block">Details</p>
        </Button>
        {client.connected && (
          <>
            <Button className="group hover:bg-zinc-900 gap-2">
              <IconPing />
              <p className="hidden group-hover:block">Ping</p>
            </Button>
            <Button className="group bg-red-700 gap-2">
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
