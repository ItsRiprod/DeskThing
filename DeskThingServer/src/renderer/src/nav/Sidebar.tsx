import React from 'react'
import SponsorButton from '../components/SponsorButton'
import NotificationButton from '../components/NotificationButton'
import SettingsButton from '../components/SettingsButton'

interface SidebarProps {
  children: React.ReactNode
  className?: string
}

const Sidebar: React.FC<SidebarProps> = ({ children, className }) => {
  return (
    <div className="md:min-w-48 min-w-24 relative h-full border-r border-zinc-800 bg-zinc-950 overflow-y-auto">
      <nav className="absolute inset w-full space-y-2 flex flex-col h-full justify-between p-4">
        <div className={'h-full flex flex-col ' + className}>{children}</div>
        <div className="border-t pt-2 border-gray-500 flex flex-col gap-2">
          <div className="items-center flex flex-col justify-center md:items-stretch">
            <NotificationButton />
          </div>
          <div className="items-center flex flex-col justify-center md:items-stretch">
            <SponsorButton />
          </div>
          <div className="items-center flex flex-col justify-center md:items-stretch">
            <SettingsButton />
          </div>
        </div>
      </nav>
    </div>
  )
}

export default Sidebar
