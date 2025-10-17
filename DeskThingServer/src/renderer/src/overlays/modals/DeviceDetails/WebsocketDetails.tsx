import { IconConfig, IconHome, IconPing, IconX } from '@renderer/assets/icons'
import Button from '@renderer/components/buttons/Button'
import React from 'react'
import { Client, PlatformIDs } from '@deskthing/types'
import usePlatformStore from '@renderer/stores/platformStore'
import { InfoComponent } from '@renderer/components/InfoComponent'

interface WebsocketDetailsProps {
  client: Client
}

const WebsocketDetails: React.FC<WebsocketDetailsProps> = ({ client }) => {
  const disconnect = usePlatformStore((state) => state.disconnect)
  const ping = usePlatformStore((state) => state.ping)
  const sendInitialData = usePlatformStore((state) => state.resendInitialData)

  const handlePing = async (): Promise<void> => {
    await ping(client.clientId)
  }

  const handleResync = async (): Promise<void> => {
    await sendInitialData(client.clientId)
  }

  const handleDisconnect = (): void => {
    disconnect(client.clientId)
  }

  const handleChangeView = (): void => {
    // window.electron.handleClientCommand({
    //   app: 'client',
    //   type: 'set',
    //   request: 'view',
    //   payload: 'utility'
    // })
  }

  return (
    <div className="h-full p-4 overflow-y-auto bg-zinc-950">
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between gap-4">
          {client.connected && (
            <>
              <Button
                className="bg-zinc-900 hover:bg-zinc-800 min-w-fit transition-colors duration-200 gap-2 rounded-lg p-3"
                onClick={handleChangeView}
              >
                <IconHome className="flex-shrink-0" />
                <p className="sm:block text-ellipsis hidden text-nowrap">Set View</p>
              </Button>
              <Button
                title="Ping the Client"
                className="bg-zinc-900 hover:bg-zinc-800 min-w-fit transition-colors duration-200 gap-2 rounded-lg p-3"
                onClick={handlePing}
              >
                <IconPing className="flex-shrink-0" />
                <p className="sm:block text-ellipsis hidden text-nowrap">Ping</p>
              </Button>
              <Button
                title="Send Initial Data"
                className="bg-zinc-900 hover:bg-zinc-800 min-w-fit transition-colors duration-200 gap-2 rounded-lg p-3"
                onClick={handleResync}
              >
                <IconConfig className="flex-shrink-0" />
                <p className="sm:block text-ellipsis hidden text-nowrap">Resync</p>
              </Button>
              <Button
                title="Disconnect the Client"
                className="bg-zinc-900 hover:bg-zinc-800 border-red-500/50 border transition-colors duration-200 gap-2 rounded-lg p-3"
                onClick={handleDisconnect}
              >
                <IconX className="flex-shrink-0" />
                <p className="sm:block text-ellipsis hidden text-nowrap">Disconnect</p>
              </Button>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 p-4 rounded-lg">
            <p className="text-sm font-geistMono text-zinc-400">Version</p>
            <h3 className="text-xl mt-2">{client.manifest?.version || 'Unknown'}</h3>
          </div>
          <div className="bg-zinc-900 p-4 rounded-lg">
            <p className="text-sm font-geistMono text-zinc-400">Name</p>
            <h3 className="text-xl mt-2">{client.manifest?.context.name || 'Unknown'}</h3>
          </div>
          <div className="bg-zinc-900 p-4 rounded-lg">
            <p className="text-sm font-geistMono text-zinc-400">Description</p>
            <h3 className="text-xl mt-2">{client.manifest?.description || 'Unknown'}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 p-4 rounded-lg">
            <p className="text-sm font-geistMono text-zinc-400">Platform</p>
            <h3 className="text-xl mt-2">{client.manifest?.context.name || 'Unknown'}</h3>
          </div>
          <div className="bg-zinc-900 p-4 rounded-lg">
            <p className="text-sm font-geistMono text-zinc-400">Connection IP</p>
            <h3 className="text-xl mt-2">
              {client.manifest?.context.ip}:{client.manifest?.context.port}
            </h3>
          </div>
          <div className="bg-zinc-900 p-4 rounded-lg">
            <div className="flex">
              <p className="text-sm font-geistMono text-zinc-400">Ping (ms)</p>
              <InfoComponent description="The ping for DeskThing (the high level javascript) and the Connection (the websocket itself - usually faster)" />
            </div>
            <h3 className="text-md mt-2">
              DeskThing: {client.meta[PlatformIDs.WEBSOCKET]?.ping?.server}ms
            </h3>
            <h3 className="text-md mt-2">
              Connection: {client.meta[PlatformIDs.WEBSOCKET]?.ping?.socket}ms
            </h3>
          </div>
        </div>

        <div className="bg-zinc-900 p-4 rounded-lg">
          <p className="text-sm font-geistMono text-zinc-400">User Agent</p>
          <h3 className="text-sm mt-2 italic">{client.userAgent || 'Unknown'}</h3>
        </div>
      </div>
    </div>
  )
}

export default WebsocketDetails
