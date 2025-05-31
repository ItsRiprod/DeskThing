import { Client, ConnectionState, ClientPlatformIDs } from '@deskthing/types'
import { FC, useEffect, useState } from 'react'

type DeviceDetailsProps = {
  client: Client
}

export const DeviceDetails: FC<DeviceDetailsProps> = ({ client }) => {
  const [connectedTimeText, setConnectedTimeText] = useState<string>('0s')

  useEffect(() => {
    const updateTime = (): number | undefined => {
      if (!client.timestamp) {
        setConnectedTimeText('0s')
        return
      }

      const timeDiff = Math.floor((Date.now() - client.timestamp) / 1000)
      let newText = '0s'
      let interval = 1000

      if (timeDiff < 5) {
        const halfSecDiff = Math.floor((Date.now() - client.timestamp) / 100) / 10
        newText = `${halfSecDiff}s`
        interval = 100
      } else if (timeDiff < 60) {
        newText = `${timeDiff}s`
      } else if (timeDiff < 3600) {
        newText = `${Math.floor(timeDiff / 60)}m`
        interval = 60000
      } else {
        newText = `${Math.floor(timeDiff / 3600)}h`
        interval = 3600000
      }

      setConnectedTimeText(newText)
      return interval
    }

    const interval = updateTime()
    const timer = setInterval(updateTime, interval)

    return () => clearInterval(timer)
  }, [client.timestamp])

  return (
    <div className="h-full overflow-y-auto bg-zinc-900 p-6">
      <div className="flex h-full flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-zinc-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-blue-400">⚡</span>
              Connection Status
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                <span className="text-zinc-400">Status</span>
                <span className="font-medium">{ConnectionState[client.connectionState]}</span>
              </div>
              {client.connected && (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                    <span className="text-zinc-400">Provider</span>
                    <span className="font-medium">{client.primaryProviderId}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                    <span className="text-zinc-400">Connected For</span>
                    <span className="font-medium">{connectedTimeText}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                <span className="text-zinc-400">Uptime</span>
                <span className="font-medium">
                  {client.uptime ? `${client.uptime} seconds` : 'N/A'}
                </span>
              </div>
            </div>
          </section>

          {client.manifest && (
            <section className="bg-zinc-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-purple-400">📱</span>
                Device Info
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                  <span className="text-zinc-400">Platform</span>
                  <span className="font-medium">
                    {ClientPlatformIDs[client.manifest.context.id]}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                  <span className="text-zinc-400">Version</span>
                  <span className="font-medium">{client.manifest.version}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                  <span className="text-zinc-400">IP Address</span>
                  <span className="font-medium">
                    {client.manifest.context.ip}:{client.manifest.context.port}
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
