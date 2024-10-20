import {
  IconCarThing,
  IconComputer,
  IconDisconnect,
  IconMobile,
  IconReload
} from '@renderer/assets/icons'
import { Client } from '@shared/types'
import React, { useState } from 'react'
import Button from './Button'
import { useSettingsStore } from '@renderer/stores'

interface ClientComponentProps {
  client: Client
}

const ClientComponent: React.FC<ClientComponentProps> = ({ client }) => {
  const port = useSettingsStore((settings) => settings.settings.devicePort)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [enabled, setEnabled] = useState(false)

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
        return <IconCarThing iconSize={128} />
      default:
        return <IconComputer iconSize={128} />
    }
  }

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
    <div className="border-t-2 w-full border-gray-500 flex p-2">
      {renderIcon()}
      <div>
        <div className="flex items-center gap-1">
          <h1 className="text-xl font-semibold">{client.client_name || 'Unknown Client'}</h1>
          <p className="italic text-gray-500 text-sm">{client.version || 'v?.?.?'}</p>
        </div>
        <div className="font-geistMono">
          <p className="text-xs italic text-gray-500">{client.connectionId}</p>
          <p className="">
            IP: {client.ip || 'unknown'}:{client.port || '0000'}
          </p>
          <p>DEVICE: {client.device_type?.name || 'unknown'}</p>
          <div className="flex">
            <Button className="group border-red-500 hover:bg-red-500">
              <IconDisconnect />
              <p className="group-hover:block hidden">Disconnect</p>
            </Button>
            <Button className="group border-red-500 hover:bg-red-500">
              <IconReload />
              <p className="group-hover:block hidden">Disconnect</p>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientComponent
