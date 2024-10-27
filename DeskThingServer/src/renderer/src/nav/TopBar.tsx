import React from 'react'
import Nav from './Nav'
import { useClientStore } from '@renderer/stores'
import { IconLogo, IconWifi } from '@renderer/assets/icons'

const TopBar: React.FC = () => {
  const connections = useClientStore((clientStore) => clientStore.connections)
  const version = process.env.PACKAGE_VERSION
  return (
    <div className="bg-zinc-950 border-zinc-800 border-b text-white flex items-center justify-between">
      <div className="flex items-center p-4 min-w-24 md:min-w-48">
        {connections == 0 ? (
          <IconWifi className="text-white" iconSize={24} />
        ) : (
          <div className="text-green-500 flex">
            <p className="text-xs">{connections == 1 ? '' : connections}</p>
            <IconWifi className="" iconSize={24} />
          </div>
        )}
        <IconLogo width={110} height={30} iconSize={50} className={'hidden md:inline'} />
        <p className="text-sm hidden md:inline">v{version}</p>
      </div>
      <div className="w-full">
        <Nav />
      </div>
    </div>
  )
}

export default TopBar
