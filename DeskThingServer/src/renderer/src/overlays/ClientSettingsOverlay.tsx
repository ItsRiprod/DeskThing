import React, { useEffect, useState } from 'react'
import { IconRefresh, IconSave, IconX } from '../assets/icons'
import { ServerManifest } from '../store/clientStore'
import SettingsStoreInstance, { Settings } from '../store/settingsStore'
import { App, appStoreInstance } from '@renderer/store'

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
  const [apps, setApps] = useState<App[]>(appStoreInstance.getAppsList() || [])
  const [defaultView, setDefaultView] = useState(manifest.default_view)
  const [mini, setMini] = useState(manifest.miniplayer)
  const [port, setPort] = useState(manifest.port)
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    // Fetch current settings from electron store
    const fetchSettings = async (): Promise<void> => {
      const currentSettings = await SettingsStoreInstance.getSettings()
      setSettings(currentSettings)
    }
    fetchSettings()
    const onAppUpdate = (apps: App[]): void => {
      setApps(apps)
    }
    appStoreInstance.on('update', (data) => onAppUpdate(data))
  }, [])

  const handleUpload = async (): Promise<void> => {
    const updatedManifest = { ...manifest, ip, port, default_view: defaultView, miniplayer: mini }
    await window.electron.setClientManifest(updatedManifest)
    refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Client Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 border-red-600 border p-2 rounded-lg hover hover:bg-red-500 focus:outline-none"
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
              <label className="block text-sm mb-2" htmlFor="ip">
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
                <button
                  className="flex p-1 border rounded border-cyan-600 hover:bg-cyan-600 gap-2 px-3"
                  onClick={() => setIp('localhost')}
                >
                  <p>ADB / Local Client:</p>
                  <p className="font-geistMono bg-slate-900 px-2 rounded">localhost</p>
                </button>
                <button
                  onClick={() => setIp('192.168.7.1')}
                  className="flex p-1 border rounded border-cyan-600 hover:bg-cyan-600 gap-2 px-3"
                >
                  <p>Car Thing RNDIS:</p>
                  <p className="font-geistMono bg-slate-900 px-2  rounded">192.168.7.1</p>
                </button>
                {settings?.localIp &&
                  settings.localIp.map((ip, index) => (
                    <button
                      className="flex p-1 border rounded border-cyan-600 hover:bg-cyan-600 gap-2 px-3"
                      key={index}
                      onClick={() => settings && setIp(ip)}
                    >
                      <p>Local Network:</p>
                      <p className="font-geistMono bg-slate-900 px-2  rounded">{ip}</p>
                    </button>
                  ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2" htmlFor="port">
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
                <button
                  onClick={() => settings && setPort(settings?.devicePort)}
                  className="flex p-1 border rounded border-cyan-600 hover:bg-cyan-600 gap-2 px-3"
                >
                  <p>Current Port:</p>
                  <p className="font-geistMono bg-slate-900 px-2  rounded">
                    {settings?.devicePort}
                  </p>
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2" htmlFor="view">
                Default View
              </label>
              <input
                type="string"
                id="view"
                value={defaultView}
                onChange={(e) => setDefaultView(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <div className="text-xs gap-1 flex-col flex p-1">
                <button
                  className="flex p-1 border rounded border-cyan-600 hover:bg-cyan-600 gap-2 px-3"
                  onClick={() => setDefaultView('landing')}
                >
                  <p className="font-geistMono bg-slate-900 px-2  rounded">Landing</p>
                </button>
                <button
                  className="flex p-1 border rounded border-cyan-600 hover:bg-cyan-600 gap-2 px-3"
                  onClick={() => setDefaultView('dashboard')}
                >
                  <p className="font-geistMono bg-slate-900 px-2  rounded">Dashboard</p>
                </button>
                {apps &&
                  apps.map((app, index) => (
                    <button
                      className="flex p-1 border rounded border-cyan-600 hover:bg-cyan-600 gap-2 px-3"
                      key={index}
                      onClick={() => app && setDefaultView(app.name)}
                    >
                      <p className="font-geistMono bg-slate-900 px-2  rounded">
                        {app.manifest?.label || app.name}
                      </p>
                    </button>
                  ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2" htmlFor="mini">
                Miniplayer Mode
              </label>
              <input
                type="string"
                id="mini"
                value={mini}
                readOnly
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100 cursor-not-allowed"
                onChange={(e) => setMini(e.target.value)}
              />
              <div className="text-xs gap-1 flex-col flex p-1">
                <button
                  className="flex p-1 border rounded border-cyan-600 hover:bg-cyan-600 gap-2 px-3"
                  onClick={() => setMini('peek')}
                >
                  <p className="font-geistMono bg-slate-900 px-2  rounded">Peek</p>
                </button>
                <button
                  className="flex p-1 border rounded border-cyan-600 hover:bg-cyan-600 gap-2 px-3"
                  onClick={() => setMini('hidden')}
                >
                  <p className="font-geistMono bg-slate-900 px-2  rounded">Hidden</p>
                </button>
                <button
                  className="flex p-1 border rounded border-cyan-600 hover:bg-cyan-600 gap-2 px-3"
                  onClick={() => setMini('full')}
                >
                  <p className="font-geistMono bg-slate-900 px-2  rounded">Full</p>
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="border-cyan-600 group flex gap-3 border-2 p-3 rounded-xl hover:bg-cyan-600"
                onClick={refresh}
              >
                <p className="group-hover:block hidden">Reset</p>
                <IconRefresh />
              </button>
              <button
                className="border-green-500 group flex gap-3 border-2 p-3 rounded-xl hover:bg-green-500"
                onClick={handleUpload}
              >
                <p className="group-hover:block hidden">Save</p>
                <IconSave />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientSettingsOverlay
