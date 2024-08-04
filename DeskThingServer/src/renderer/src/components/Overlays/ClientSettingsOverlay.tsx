import React, { useEffect, useState } from 'react'
import { IconRefresh, IconUpload, IconX } from '../icons'
import { ServerManifest } from '@renderer/store/clientStore'
import SettingsStoreInstance, { Settings } from '@renderer/store/settingsStore'

interface ClientSettingsOverlayProps {
  manifest: ServerManifest
  onClose: () => void
  refresh: () => void
}

const ClientSettingsOverlay: React.FC<ClientSettingsOverlayProps> = ({
  manifest,
  onClose,
  refresh
}) => {
  const [ip, setIp] = useState(manifest.ip)
  const [port, setPort] = useState(manifest.port)
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    // Fetch current settings from electron store
    const fetchSettings = async (): Promise<void> => {
      const currentSettings = await SettingsStoreInstance.getSettings()
      setSettings(currentSettings)
    }
    fetchSettings()
  }, [])
  const handleUpload = async (): Promise<void> => {
    const updatedManifest = { ...manifest, ip, port }
    await window.electron.setClientManifest(updatedManifest)
    refresh()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Client Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 border-red-600 border p-2 rounded-lg hover:text-white hover:bg-red-500 focus:outline-none"
          >
            <IconX />
          </button>
        </div>
        <div className="overflow-y-auto font-geistMono max-h-[80vh]">
          <div className="items-center border-zinc-500 border p-2 my-2 rounded-xl">
            <div className="flex justify-between">
              <h1 className="text-lg flex font-semibold">
                {manifest.name} <p className="text-xs font-normal">{manifest.version}</p>
              </h1>
              <p className="">ID: {manifest.id}</p>
            </div>
            <p className="text-xs italic">{manifest.description}</p>
          </div>
          <div className="border-zinc-500 font-geist border p-2 my-2 rounded-xl">
            <h1 className="text-lg font-semibold flex">Modify Settings</h1>
            <div className="mb-4">
              <label className="block text-white text-sm mb-2" htmlFor="ip">
                IP Address
              </label>
              <input
                type="text"
                id="ip"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <div className="text-xs gap-1 flex-col flex p-1">
                <div className="flex">
                  <p>ADB:</p>
                  <button
                    onClick={() => setIp('localhost')}
                    className="font-geistMono bg-slate-900 px-2"
                  >
                    localhost
                  </button>
                </div>
                <div className="flex">
                  <p>Car Thing RNDIS:</p>
                  <button
                    onClick={() => setIp('192.168.7.1')}
                    className="font-geistMono bg-slate-900 px-2"
                  >
                    192.168.7.1
                  </button>
                </div>
                <div className="flex">
                  <p>Local Network:</p>
                  <button
                    onClick={() => settings && setIp(settings?.localIp)}
                    className="font-geistMono bg-slate-900 px-2"
                  >
                    {settings?.localIp}
                  </button>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-white text-sm font-bold mb-2" htmlFor="port">
                Port
              </label>
              <input
                type="number"
                id="port"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <div className="text-xs gap-1 flex-col flex p-1">
                <div className="flex">
                  <p>Current Port:</p>
                  <button
                    onClick={() => settings && setPort(settings?.devicePort)}
                    className="font-geistMono bg-slate-900 px-2"
                  >
                    {settings?.devicePort}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="border-cyan-500 group flex gap-3 border-2 p-3 rounded-xl hover:bg-cyan-600"
                onClick={refresh}
              >
                <p className="group-hover:block hidden">Refresh</p>
                <IconRefresh />
              </button>
              <button
                className="border-green-500 group flex gap-3 border-2 p-3 rounded-xl hover:bg-green-500"
                onClick={handleUpload}
              >
                <p className="group-hover:block hidden">Upload</p>
                <IconUpload />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientSettingsOverlay
