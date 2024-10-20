import {
  IconConfig,
  IconDisconnect,
  IconHome,
  IconPing,
  IconPower,
  IconRefresh,
  IconReload,
  IconUpload,
  IconX
} from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import { useSettingsStore } from '@renderer/stores'
import { Client, LoggingData } from '@shared/types'
import React, { useRef, useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import Overlay from './Overlay'
import DownloadNotification from './DownloadNotification'

interface ClientDetailsOverlayProps {
  onClose: () => void
  client: Client
}

const ClientDetailsOverlay: React.FC<ClientDetailsOverlayProps> = ({ onClose, client }) => {
  const port = useSettingsStore((settings) => settings.settings.devicePort)
  const [loading, setLoading] = useState(false)
  const [logging, setLogging] = useState<LoggingData | null>()
  const [enabled, setEnabled] = useState(false)
  const [showLogging, setShowLogging] = useState(false)

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

  const restartChromium = (): void => {
    if (!client.adbId) return

    handleAdbCommand(`-s ${client.adbId} shell supervisorctl restart chromium`)
  }

  const openPort = (): void => {
    if (!client.adbId) return
    handleAdbCommand(`-s ${client.adbId} reverse tcp:${port} tcp:${port}`)
  }

  return (
    <Overlay
      onClose={onClose}
      className="border border-gray-500 p-4 bg-zinc-900 w-5/6 h-5/6 flex flex-col overflow-hidden"
    >
      {logging && showLogging && (
        <DownloadNotification
          loggingData={logging}
          onClose={onPushFinish}
          title="Running command"
        />
      )}
      <div className="w-full px-1 py-4 flex items-center gap-2">
        <h1 className="font-semibold text-2xl">{client.device_type?.name || client.client_name}</h1>
        <p className="text-gray-500 text-lg">{client.adbId || client.connectionId}</p>
      </div>
      <div className="w-full px-1 gap-1 flex items-center justify-evenly">
        {client.connected && (
          <Button
            className="group hover:bg-zinc-950 gap-2 w-full justify-center"
            onClick={restartChromium}
          >
            <IconHome />
            <p className="group-hover:block hidden text-nowrap">Set View</p>
          </Button>
        )}
        {client.adbId && (
          <>
            <Button
              className="group hover:bg-zinc-950 gap-2 w-full justify-center"
              onClick={handlePushStaged}
            >
              <IconUpload />
              <p className="group-hover:block hidden text-nowrap">Push Staged</p>
            </Button>
            <Button
              className="group hover:bg-zinc-950 gap-2 w-full justify-center"
              onClick={restartChromium}
            >
              <IconRefresh />
              <p className="group-hover:block hidden text-nowrap">Reload Chromium</p>
            </Button>
            <Button
              className="group hover:bg-zinc-950 gap-2 w-full justify-center"
              onClick={openPort}
            >
              <IconDisconnect />
              <p className="group-hover:block hidden text-nowrap">Setup Port</p>
            </Button>
            <Button
              className="group border-red-500 border hover:bg-zinc-950 gap-2 w-full justify-center"
              onClick={handlePushStaged}
            >
              <IconReload />
              <p className="group-hover:block hidden text-nowrap">Restart</p>
            </Button>
            <Button className="group border-red-500 border hover:bg-zinc-950 gap-2 w-full justify-center">
              <IconPower />
              <p className="group-hover:block hidden text-nowrap">Power Off</p>
            </Button>
          </>
        )}
        {client.connected && (
          <>
            <Button className="group hover:bg-zinc-950 gap-2 w-full justify-center">
              <IconPing />
              <p className="group-hover:block hidden text-nowrap">Ping</p>
            </Button>
            <Button className="group bg-red-700 gap-2 w-full justify-center">
              <IconX />
              <p className="group-hover:block hidden text-nowrap">Disconnect</p>
            </Button>
          </>
        )}
      </div>
      <div className="my-4">
        <p className="text-xs font-geistMono text-gray-500">{client.version}</p>
        <h3 className="text-xl">{client.client_name}</h3>
        <p className="text-xs font-geistMono text-gray-500">{client.description}</p>
      </div>
      <div className="my-4">
        <p className="text-xs font-geistMono text-gray-500">Platform</p>
        <h3 className="text-xl">{client.device_type?.name || 'Unknown'}</h3>
      </div>
      <div className="my-4">
        <p className="text-xs font-geistMono text-gray-500">Connection IP</p>
        <h3 className="text-xl">
          {client.ip}:{client.port}
        </h3>
      </div>
      <div className="my-4 absolute bottom-0 italic">
        <p className="text-xs font-geistMono text-gray-500">{client.userAgent}</p>
      </div>
    </Overlay>
  )
}

export default ClientDetailsOverlay
