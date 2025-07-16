import React, { useState } from 'react'
import { useClientStore } from '@renderer/stores'
import { ClientDeviceType, ClientManifest } from '@deskthing/types'
import Button from '@renderer/components/Button'
import { IconToggle, IconSave, IconLoading } from '@renderer/assets/icons'
import { InfoComponent } from '@renderer/components/InfoComponent'

const ClientSettings: React.FC = () => {
  const clientSettings = useClientStore((state) => state.clientManifest)
  const updateClientSettings = useClientStore((state) => state.updateClientManifest)
  const [localSettings, setLocalSettings] = useState<ClientManifest | null>(clientSettings)
  const [loading, setLoading] = useState(false)

  const handleContextChange = <T extends keyof ClientDeviceType>(
    context: T,
    value: ClientDeviceType[T]
  ): void => {
    if (localSettings) {
      setLocalSettings({
        ...localSettings,
        context: {
          ...localSettings.context,
          [context]: value
        }
      })
    }
  }
  const handleSave = async (): Promise<void> => {
    if (localSettings) {
      setLoading(true)
      updateClientSettings(localSettings)
      setTimeout(() => {
        setLoading(false)
      }, 500)
    }
  }

  if (!localSettings) return null

  return (
    <div className="absolute inset w-full h-full p-4 flex flex-col divide-y-2 divide-gray-500">
      <div className="w-full p-4 flex justify-between items-center">
        <div className="flex gap-1 items-center">
          <h2 className="text-xl">IP Address</h2>
          <InfoComponent description="The IP address of the server or device to connect to." />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={localSettings.context?.ip || ''}
            onChange={(e) => handleContextChange('ip', e.target.value)}
            className="focus:text-white bg-zinc-900 text-white rounded px-2 py-2"
          />
        </div>
      </div>
      <div className="w-full p-4 flex justify-between items-center">
        <div className="flex gap-1 items-center">
          <h2 className="text-xl">Port</h2>
          <InfoComponent description="The port number used to connect to the server or device." />
        </div>
        <input
          type="number"
          value={localSettings.context?.port || ''}
          onChange={(e) => handleContextChange('port', Number(e.target.value))}
          className="focus:text-white bg-zinc-900 text-white rounded px-2 py-2"
        />
      </div>
      <div className="w-full px-4 flex justify-between items-center">
        <div className="flex gap-1 items-center">
          <h2 className="text-xl">Use RNDIS</h2>
          <InfoComponent
            description={`Toggle to use RNDIS (USB network) mode for device connection.\nThis will not work by default on devices with NDIS disabled (i.e. the NoRNDIS images). This is generally unstable`}
          />
        </div>
        <Button
          className="bg-transparent p-0"
          onClick={() =>
            handleContextChange(
              'ip',
              localSettings.context?.ip === '192.168.7.1' ? 'localhost' : '192.168.7.1'
            )
          }
        >
          <IconToggle
            iconSize={48}
            checked={localSettings.context?.ip === '192.168.7.1'}
            className={`transition-color ${localSettings.context?.ip === '192.168.7.1' ? 'text-green-500' : 'text-gray-500'}`}
          />
        </Button>
      </div>
      <div className="border-t py-5 border-gray-900 w-full flex justify-end">
        <Button
          className={`border-green-500 border group gap-2 ${loading ? 'text-gray-100 bg-green-600' : 'hover:bg-green-500'}`}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? <IconLoading /> : <IconSave className="stroke-2" />}
          <p>{loading ? 'Saving' : 'Save'}</p>
        </Button>
      </div>
    </div>
  )
}

export default ClientSettings
