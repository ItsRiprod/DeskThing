import React from 'react'
import { useClientStore, useAppStore } from '@renderer/stores'
import { Client } from '@shared/types'
import { AppSettingProps } from './AppsOverlay'

const AppSettings: React.FC<AppSettingProps> = ({ app }: AppSettingProps) => {
  const clientSettings = useClientStore((state) => state.clientManifest)
  const updateClientSettings = useClientStore((state) => state.updateClientManifest)
  const apps = useAppStore((state) => state.appsList)

  const handleSettingChange = (key: keyof Client, value: string | boolean | number): void => {
    if (clientSettings) {
      updateClientSettings({ ...clientSettings, [key]: value })
    }
  }

  if (!clientSettings) return null

  return (
    <div className="w-full h-full p-4 flex flex-col divide-y-2 divide-gray-500">
      <div className="w-full p-4 flex justify-between items-center">
        <h2 className="text-xl">Default View</h2>
        <select
          value={clientSettings.default_view || ''}
          onChange={(e) => handleSettingChange('default_view', e.target.value)}
          className="focus:text-white bg-zinc-900 text-white rounded px-2 py-2"
        >
          <option value="landing">Landing</option>
          <option value="dashboard">Dashboard</option>
          {apps.map((app) => (
            <option key={app.name} value={app.name}>
              {app.manifest?.label || app.name}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full p-4 flex justify-between items-center">
        <h2 className="text-xl">Miniplayer Mode</h2>
        <select
          value={clientSettings.miniplayer || ''}
          onChange={(e) => handleSettingChange('miniplayer', e.target.value)}
          className="focus:text-white bg-zinc-900 text-white rounded px-2 py-2"
        >
          <option value="peek">Peek</option>
          <option value="hidden">Hidden</option>
          <option value="full">Full</option>
        </select>
      </div>
      <div className="w-full p-4 flex justify-between items-center">
        <h2 className="text-xl">IP Address</h2>
        <input
          type="text"
          value={clientSettings.ip || ''}
          onChange={(e) => handleSettingChange('ip', e.target.value)}
          className="focus:text-white bg-zinc-900 text-white rounded px-2 py-2"
        />
      </div>
      <div className="w-full p-4 flex justify-between items-center">
        <h2 className="text-xl">Port</h2>
        <input
          type="number"
          value={clientSettings.port || ''}
          onChange={(e) => handleSettingChange('port', Number(e.target.value))}
          className="focus:text-white bg-zinc-900 text-white rounded px-2 py-2"
        />
      </div>
    </div>
  )
}

export default AppSettings
