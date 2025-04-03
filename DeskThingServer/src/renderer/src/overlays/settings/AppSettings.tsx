import React, { useState } from 'react'
import { useAppStore } from '@renderer/stores'
import AppSettings from '@renderer/overlays/apps/AppSettings'
import Button from '@renderer/components/Button'
import { AppIcon } from '@renderer/components/AppIcon'

const AppsSettings: React.FC = () => {
  const apps = useAppStore((state) => state.appsList)
  const [selectedApp, setSelectedApp] = useState(apps[0])

  return (
    <div className="absolute inset w-full h-full p-4 flex flex-col">
      <div className="w-full flex gap-2 mb-4 overflow-x-auto">
        {apps.map((app) => (
          <Button
            title={`Open ${app.manifest?.label}'s settings`}
            key={app.name}
            onClick={() => setSelectedApp(app)}
            className={`gap-2 flex items-center ${selectedApp.name === app.name ? 'bg-zinc-800 hover:b-zinc-700' : 'bg-zinc-900 hover:bg-zinc-800'}`}
          >
            <AppIcon appId={app.name} className="!w-10 !h-10" />
            <p className="whitespace-nowrap ">{app.manifest?.label}</p>
          </Button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {selectedApp && <AppSettings key={selectedApp.name} app={selectedApp} />}
      </div>
    </div>
  )
}

export default AppsSettings
