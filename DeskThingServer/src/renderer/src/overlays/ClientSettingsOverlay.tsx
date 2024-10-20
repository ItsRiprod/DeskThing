import React, { useState, useEffect } from 'react'
import Overlay from './Overlay'
import { useClientStore, useAppStore, useSettingsStore } from '@renderer/stores'
import { Client } from '@shared/types'
import { IconRefresh, IconSave } from '@renderer/assets/icons'

interface ClientSettingsOverlayProps {
  onClose: () => void
}

/**
 * ClientSettingsOverlay component
 *
 * This component renders an overlay for managing client settings.
 * It allows users to view and modify various client configuration options.
 *
 * @component
 * @param {Object} props - The component props
 * @param {() => void} props.onClose - Function to call when closing the overlay
 */
const ClientSettingsOverlay: React.FC<ClientSettingsOverlayProps> = ({ onClose }) => {
  const rawClientSettings = useClientStore((state) => state.clientManifest)
  const updateClientSettings = useClientStore((state) => state.updateClientManifest)
  const apps = useAppStore((state) => state.appsList)
  const settings = useSettingsStore((state) => state.settings)
  const [clientSettings, setClientSettings] = useState<Client | null | Partial<Client>>(
    rawClientSettings
  )
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useEffect(() => {
    setClientSettings(rawClientSettings)
  }, [rawClientSettings])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    if (clientSettings) {
      setClientSettings((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSave = (): void => {
    if (clientSettings) {
      updateClientSettings(clientSettings as Client)
    }
    onClose()
  }

  const handleRefresh = (): void => {
    setClientSettings(rawClientSettings)
  }

  const handleFocus = (fieldName: string): void => {
    setFocusedField(fieldName)
  }

  return (
    <Overlay onClose={onClose}>
      <div className="border rounded-xl border-gray-500 p-6 w-screen max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Client Settings</h2>
        </div>
        <div className="overflow-y-auto font-geistMono max-h-[80vh]">
          {clientSettings && (
            <>
              <div className="items-center border-zinc-500 border p-2 my-2 rounded-xl">
                <div className="flex justify-between">
                  <h1 className="text-lg flex font-semibold">
                    {clientSettings.client_name}{' '}
                    <p className="text-xs font-normal">{clientSettings.version}</p>
                  </h1>
                  <p className="">ID: {clientSettings.client_name}</p>
                </div>
                <p className="text-xs italic">{clientSettings.description}</p>
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
                    name="ip"
                    value={clientSettings.ip || ''}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus('ip')}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  {focusedField === 'ip' && (
                    <div className="text-xs gap-1 flex-col flex p-1">
                      <button
                        className="flex p-1 border rounded border-cyan-600 hover:bg-cyan-600 gap-2 px-3"
                        onClick={() => setClientSettings((prev) => ({ ...prev, ip: 'localhost' }))}
                      >
                        <p>ADB / Local Client:</p>
                        <p className="font-geistMono bg-slate-900 px-2 rounded">localhost</p>
                      </button>
                      <button
                        onClick={() =>
                          setClientSettings((prev) => ({ ...prev, ip: '192.168.7.1' }))
                        }
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
                            onClick={() => setClientSettings((prev) => ({ ...prev, ip }))}
                          >
                            <p>Local Network:</p>
                            <p className="font-geistMono bg-slate-900 px-2  rounded">{ip}</p>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2" htmlFor="port">
                    Port
                  </label>
                  <input
                    type="number"
                    id="port"
                    name="port"
                    value={clientSettings.port || ''}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus('port')}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  {focusedField === 'port' && (
                    <div className="text-xs gap-1 flex-col flex p-1">
                      <button
                        onClick={() =>
                          setClientSettings((prev) => ({ ...prev, port: settings?.devicePort }))
                        }
                        className="flex p-1 border rounded border-cyan-600 hover:bg-cyan-600 gap-2 px-3"
                      >
                        <p>Current Port:</p>
                        <p className="font-geistMono bg-slate-900 px-2  rounded">
                          {settings?.devicePort}
                        </p>
                      </button>
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2" htmlFor="default_view">
                    Default View
                  </label>
                  <input
                    type="text"
                    id="default_view"
                    name="default_view"
                    value={clientSettings.default_view || ''}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus('default_view')}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  {focusedField === 'default_view' && (
                    <div className="text-xs gap-1 flex-col flex p-1">
                      <button
                        className="flex p-1 border rounded border-cyan-600 hover:bg-cyan-600 gap-2 px-3"
                        onClick={() =>
                          setClientSettings((prev) => ({ ...prev, default_view: 'landing' }))
                        }
                      >
                        <p className="font-geistMono bg-slate-900 px-2 rounded">Landing</p>
                      </button>
                      <button
                        className="flex p-1 border rounded border-cyan-600 hover:bg-cyan-600 gap-2 px-3"
                        onClick={() =>
                          setClientSettings((prev) => ({ ...prev, default_view: 'dashboard' }))
                        }
                      >
                        <p className="font-geistMono bg-slate-900 px-2 rounded">Dashboard</p>
                      </button>
                      {apps.map((app, index) => (
                        <button
                          className="flex p-1 border rounded border-cyan-600 hover:bg-cyan-600 gap-2 px-3"
                          key={index}
                          onClick={() =>
                            setClientSettings((prev) => ({ ...prev, default_view: app.name }))
                          }
                        >
                          <p className="font-geistMono bg-slate-900 px-2 rounded">
                            {app.manifest?.label || app.name}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2" htmlFor="miniplayer">
                    Miniplayer Mode
                  </label>
                  <input
                    type="text"
                    id="miniplayer"
                    name="miniplayer"
                    value={clientSettings.miniplayer || ''}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus('miniplayer')}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  {focusedField === 'miniplayer' && (
                    <div className="text-xs gap-1 flex-col flex p-1">
                      <button
                        className="flex p-1 border rounded border-cyan-600 hover:bg-cyan-600 gap-2 px-3"
                        onClick={() =>
                          setClientSettings((prev) => ({ ...prev, miniplayer: 'peek' }))
                        }
                      >
                        <p className="font-geistMono bg-slate-900 px-2 rounded">Peek</p>
                      </button>
                      <button
                        className="flex p-1 border rounded border-cyan-600 hover:bg-cyan-600 gap-2 px-3"
                        onClick={() =>
                          setClientSettings((prev) => ({ ...prev, miniplayer: 'hidden' }))
                        }
                      >
                        <p className="font-geistMono bg-slate-900 px-2 rounded">Hidden</p>
                      </button>
                      <button
                        className="flex p-1 border rounded border-cyan-600 hover:bg-cyan-600 gap-2 px-3"
                        onClick={() =>
                          setClientSettings((prev) => ({ ...prev, miniplayer: 'full' }))
                        }
                      >
                        <p className="font-geistMono bg-slate-900 px-2 rounded">Full</p>
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    className="border-cyan-600 group flex gap-3 border-2 p-3 rounded-xl hover:bg-cyan-600"
                    onClick={handleRefresh}
                  >
                    <p className="group-hover:block hidden">Reset</p>
                    <IconRefresh />
                  </button>
                  <button
                    className="border-green-500 group flex gap-3 border-2 p-3 rounded-xl hover:bg-green-500"
                    onClick={handleSave}
                  >
                    <p className="group-hover:block hidden">Save</p>
                    <IconSave />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Overlay>
  )
}
export default ClientSettingsOverlay
