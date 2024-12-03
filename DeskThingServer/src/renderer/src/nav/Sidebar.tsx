import React, { useState } from 'react'
import SponsorButton from '../components/SponsorButton'
import NotificationButton from '../components/NotificationButton'
import SettingsButton from '../components/SettingsButton'
import Button from '@renderer/components/Button'
import { IconArrowLeft } from '@renderer/assets/icons'

interface SidebarProps {
  children: React.ReactNode
  className?: string
}

const Sidebar: React.FC<SidebarProps> = ({ children, className }) => {
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(false)

  return (
    <div
      className={`${sidebarVisible ? 'w-48 max-w-48' : 'max-w-0 w-0'} xs:max-w-48 transition-[width,max-width] z-10 md:min-w-48 xs:w-24 flex-shrink-0 xs:relative h-full border-r absolute border-zinc-800 bg-zinc-950 ${className}`}
    >
      <nav
        className={`${sidebarVisible ? 'w-48 p-4 space-y-2' : 'w-0'} xs:w-full absolute overflow-hidden inset w-full xs:space-y-2 flex flex-col h-full justify-between xs:p-4`}
      >
        <div className={'h-full flex flex-col ' + className}>{children}</div>
        <div className="border-t pt-2 border-gray-500 flex xs:flex-col gap-2">
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
      <Button
        onClick={() => setSidebarVisible((state) => !state)}
        className="bg-zinc-900/75 absolute top-0 right-0 translate-x-12 xs:hidden"
      >
        <IconArrowLeft className={`${!sidebarVisible && 'rotate-180'}`} />
      </Button>
    </div>
  )
}

export default Sidebar
