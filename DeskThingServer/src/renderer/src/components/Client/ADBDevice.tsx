import { IconCarThingSmall, IconConfig, IconLoading, IconRefresh, IconUpload } from '@renderer/assets/icons'
import { ADBClient, LoggingData } from '@shared/types'
import React, { useState } from 'react'
import Button from '../Button'
// import { useSettingsStore } from '@renderer/stores'
import DownloadNotification from '@renderer/overlays/DownloadNotification'
import { useClientStore, useSettingsStore } from '@renderer/stores'

interface ADBComponentProps {
  adbDevice: ADBClient
}

const ADBDevice: React.FC<ADBComponentProps> = ({ adbDevice }) => {
  // const port = useSettingsStore((settings) => settings.settings.devicePort)
  const [loading, setLoading] = useState(false)
  const [animatingIcons, setAnimatingIcons] = useState<Record<string, boolean>>({})
  const [logging, setLogging] = useState<LoggingData | null>()
  const [showLogging, setShowLogging] = useState(false)
  const refreshADbClients = useClientStore((store) => store.requestADBDevices)
  const requestClientManifest = useClientStore((store) => store.requestClientManifest)
  const devicePort = useSettingsStore((store) => store.settings.devicePort)

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

    try {
      setLogging({ status: true, final: false, data: 'Configuring Device' })
      setLoading(true)
      window.electron.configureDevice(adbDevice.adbId)
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
    setAnimatingIcons((prev) => ({ ...prev, chromium: true }))
    await handleAdbCommand(`-s ${adbDevice.adbId} shell supervisorctl restart chromium`)
    setAnimatingIcons((prev) => ({ ...prev, chromium: false }))
  }

  const handleConnectOffline = async (): Promise<void> => {
    setLoading(true)
    await window.electron.handleClientADB('reconnect offline')
    await setTimeout(() => refreshADbClients, 5000)
    await window.electron.handleClientADB(
      `-s ${adbDevice.adbId} reverse tcp:${devicePort} tcp:${devicePort}`
    )
    setLoading(false)
  }

  const handlePushStaged = (): void => {
    setShowLogging(true)

    try {
      setLogging({ status: true, final: false, data: 'Pushing App' })
      setLoading(true)
      window.electron.pushStagedApp(adbDevice.adbId)
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
    } finally {
      setLoading(false)
      setShowLogging(false)
    }
  }

  return (
    <div className="w-full p-4 border rounded-xl border-zinc-900 flex flex-col lg:flex-row gap-4 justify-center items-center lg:justify-between bg-zinc-950">
      {logging && showLogging && (
        <DownloadNotification
          loggingData={logging}
          onClose={onPushFinish}
          title="Running command"
        />
      )}
      <div className="flex gap-2 items-center">
        <IconCarThingSmall iconSize={48} />
        <div>
          <h2 className="text-md font-geistMono">{adbDevice.adbId}</h2>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        {adbDevice.offline ? (
          <p className="text-red-500 italic">Device Offline!</p>
        ) : (
          <>
            {adbDevice.connected ? (
              <p>ADB Device Connected</p>
            ) : (
              <Button
                title="Configure Device"
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
            <Button
              title="Push staged client"
              className="group hover:bg-zinc-900 gap-2"
              onClick={handlePushStaged}
              disabled={loading}
            >
              <IconUpload
                className={
                  animatingIcons.chromium
                    ? 'rotate-[360deg] transition-transform duration-1000'
                    : ''
                }
              />
            </Button>
            <Button
              title="Restart Chromium on the Device"
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
            </Button>
          </>
        )}
        {adbDevice.offline && (
          <Button
            title="Reconnect Device"
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
      </div>
    </div>
  )
}

export default ADBDevice
