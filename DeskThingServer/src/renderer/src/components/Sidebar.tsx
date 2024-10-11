import React from 'react'
import SponsorButton from './SponsorButton'
import NotificationButton from './NotificationButton'

interface SidebarProps {
  children: React.ReactNode
  className?: string
}

const Sidebar: React.FC<SidebarProps> = ({ children, className }) => {
  return (
    <div className="md:min-w-48 min-w-24 h-full border-r border-slate-500 p-4 overflow-y-auto">
      <nav className="space-y-2 flex flex-col h-full justify-between">
        <div className={className}>{children}</div>

        <div className="flex flex-col gap-2">
          <div className="items-center flex flex-col justify-center md:items-stretch">
            <NotificationButton />
          </div>
          <div className="items-center flex flex-col justify-center md:items-stretch">
            <SponsorButton />
          </div>
        </div>
      </nav>
    </div>
  )
}

export default Sidebar
