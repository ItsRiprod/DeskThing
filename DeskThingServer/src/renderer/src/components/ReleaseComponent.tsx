import React, { useState } from 'react'
import Button from './Button'
import { GithubAsset } from '@shared/types'
import { IconDownload } from '@renderer/assets/icons'

interface AssetComponentProps {
  asset: GithubAsset
  onClick: (url: string) => void
}

const ReleaseComponent: React.FC<AssetComponentProps> = ({ asset, onClick }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [tooltip, setTooltip] = useState<string>('')

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

  return (
    <div className="flex border-2 p-2 border-gray-500 items-center justify-between rounded-xl">
      <h3 className="pl-5 font-semibold">{asset.name}</h3>
      <Button
        onClick={() => onClick(asset.browser_download_url)}
        className="group border-green-500 hover:bg-green-500 flex gap-2"
      >
        <p className="group-hover:block hidden">Download</p>
        <IconDownload />
      </Button>
    </div>
  )
}

export default ReleaseComponent
