import React, { useState, useEffect } from 'react'
import { IconLogoGear, IconLogoGearLoading, IconRefresh } from './icons'
import settingsStore from '@renderer/store/settingsStore'
import { ServerManifest } from '@renderer/store/clientStore'
import ClientSettingsOverlay from './Overlays/ClientSettingsOverlay'

const ClientSettings: React.FC = () => {
  const [clientManifest, setClientManifest] = useState<ServerManifest | null>(null)
  const [port, setPort] = useState<number>(-1)
  const [loading, setLoading] = useState<boolean>(false)
  const [details, setDetails] = useState<boolean>(false)

  useEffect(() => {
    settingsStore.getSettings().then((settings) => {
      setPort(settings.devicePort)
    })

    handleClientAppRefresh()
  }, [])

  const handleClientAppRefresh = async (): Promise<void> => {
    setLoading(true)
    setClientManifest(null)
    const newManifest: ServerManifest = await window.electron.getClientManifest()
    setClientManifest(newManifest)
    setTimeout(() => {
      setLoading(false)
    }, 200)
  }

  return (
    <div className="flex justify-between w-full py-2">
      {details && clientManifest && (
        <ClientSettingsOverlay
          manifest={clientManifest}
          refresh={handleClientAppRefresh}
          onClose={() => setDetails(false)}
        />
      )}
      {clientManifest ? (
        <div className="flex flex-col justify-center">
          <div className="font-geistMono flex flex-col gap-2 sm:flex-row text-sm sm:text-nowrap sm:text-xl">
            <p>Staged:</p>
            <p className="text-green-500 font-semibold">{clientManifest.name}</p>
          </div>
          <p className="sm:text-sm text-xs">
            {clientManifest.version} - {clientManifest.ip}
          </p>
        </div>
      ) : (
        <div className="flex flex-col justify-center">
          <h1 className="font-geistMono text-sm flex-nowrap gap-2 flex text-nowrap sm:text-xl">
            Staged Client: <p className="text-rose-500 font-semibold">None</p>
          </h1>
          <p>Server Port: {port}</p>
        </div>
      )}
      <div className="items-center flex gap-3">
        <button
          className={`flex group gap-3 border-2 p-3 rounded-xl ${
            clientManifest
              ? 'hover:bg-green-500 text-gray-300 border-green-500'
              : 'border-green-800 text-gray-400'
          }`}
          onClick={() => setDetails(true)}
          disabled={!clientManifest}
        >
          <p className="hidden group-hover:block font-geistMono">Settings</p>
          {loading ? <IconLogoGearLoading iconSize={24} /> : <IconLogoGear iconSize={24} />}
        </button>
        <button
          className="border-cyan-500 group flex gap-3 border-2 p-3 rounded-xl hover:bg-cyan-600"
          onClick={handleClientAppRefresh}
        >
          <p className="hidden group-hover:block font-geistMono">Refresh</p>
          {loading ? <IconLogoGearLoading iconSize={24} /> : <IconRefresh />}
        </button>
      </div>
    </div>
  )
}

export default ClientSettings
