import React, { useEffect, useState } from 'react'
import { useAppStore, useClientStore, useSettingsStore } from '@renderer/stores'

const InfoWidget: React.FC = () => {
  const connections = useClientStore((state) => state.connections)
  const settings = useSettingsStore((state) => state.settings)
  const apps = useAppStore((state) => state.appsList)
  const [runningApps, setRunningApps] = useState(0)
  const client = useClientStore((state) => state.clientManifest)

  useEffect(() => {
    const runningApps = apps.filter((app) => app.running)
    setRunningApps(runningApps.length)
  }, [])

  return (
    <div className="h-full relative overflow-hidden">
      <h3 className="text-lg font-semibold mb-2">Server Info</h3>
      <div className="p-4 gap-2 flex flex-col">
        <p>
          {connections} client{connections != 1 && 's'} connected
        </p>
        <p>
          {settings.address}:{settings.devicePort}
        </p>
        <div>
          <h4>{apps.length} apps installed</h4>
          <div className="pl-2 border-l border-gray-500">
            <p className="text-gray-500 text-sm">{runningApps} running</p>
            <p className="text-gray-500 text-sm">{apps.length - runningApps} stopped</p>
          </div>
        </div>
        <p>{client?.name}</p>
        <p>{client?.version}</p>
      </div>
    </div>
  )
}
export default InfoWidget
