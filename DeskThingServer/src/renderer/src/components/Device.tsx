import { IconUpload, IconRefresh, IconTransfer, IconGear } from '@renderer/assets/icons'
import DeviceOverlay from '@renderer/overlays/DeviceOverlay'
import { useSettingsStore } from '@renderer/stores'
import React, { useState } from 'react'
import Button from './Button'

interface DeviceComponentProps {
  device: string
}

const DeviceComponent: React.FC<DeviceComponentProps> = ({ device }) => {
  const port = useSettingsStore((settings) => settings.settings.devicePort)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [enabled, setEnabled] = useState(false)

  const handleAdbCommand = async (command: string): Promise<string | undefined> => {
    try {
      setError(command)
      setLoading(true)
      const response = await window.electron.handleClientADB(command)
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

  const handlePushStaged = (deviceId: string): void => {
    try {
      setError('Pushing app...')
      setLoading(true)
      window.electron.pushStagedApp(deviceId)
      const unsubscribe = window.electron.ipcRenderer.on('logging', (_event, reply) => {
        console.log(reply)
        if (reply.final) {
          setLoading(false)
          unsubscribe()
        } else {
          setLoading(true)
        }
        if (!reply.status) {
          setError(reply.error || 'Unknown error occurred')
          unsubscribe()
        } else {
          if (reply.data) {
            setError(reply.data)
          }
        }
      })
    } catch (error) {
      setLoading(false)
      if (error) {
        setError(JSON.stringify(error))
      }
    }
  }

  const handleDeviceClick = (): void => {
    setLoading(true)
    setEnabled(true)
    setTimeout(async () => {
      setLoading(false)
    }, 1000)
  }

  return (
    <>
      {enabled && <DeviceOverlay onClose={() => setEnabled(false)} device={device} />}
      <div className="flex flex-col md:flex-row p-5 border md:justify-between justify-center rounded-2xl w-full">
        <div className="flex h-full">
          <Button
            className={`group ${!loading && 'hover:bg-cyan-600'} border-cyan-600 border-2`}
            onClick={() => handleDeviceClick()}
          >
            <p className="hidden group-hover:inline">Device Settings</p>
            <IconGear />
          </Button>
          <div className="flex flex-col mx-3">
            <p className="text-xl font-semibold">{device} Device</p>
            <p className="italic font-geistMono text-sm">Not Configured</p>
          </div>
        </div>
        {loading ? (
          <p>{error}</p>
        ) : (
          <div className="flex gap-2">
            <Button
              className={`group ${!loading && 'hover:bg-cyan-600'} border-cyan-600 border-2`}
              onClick={() => handlePushStaged(device.replace('device', '').trim())}
              disabled={loading}
            >
              <p className="hidden group-hover:inline">Upload Client</p>
              <IconUpload iconSize={24} />
            </Button>
            <Button
              className={`group ${!loading && 'hover:bg-cyan-600'} border-cyan-600 border-2`}
              onClick={() =>
                handleAdbCommand(
                  `-s ${device.replace('device', '').trim()} shell supervisorctl restart chromium`
                )
              }
              disabled={loading}
            >
              <p className="hidden group-hover:inline">Restart Chromium</p>
              <IconRefresh iconSize={24} />
            </Button>
            <Button
              className={`group ${!loading && 'hover:bg-cyan-600'} border-cyan-600 border-2`}
              onClick={() =>
                handleAdbCommand(
                  `-s ${device.replace('device', '').trim()} reverse tcp:${port} tcp:${port}`
                )
              }
              disabled={loading}
            >
              <p className="hidden group-hover:inline">Auto Configure</p>
              <IconTransfer />
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

export default DeviceComponent
