import React from 'react'
import Papertrail from './Papertrail'

interface SidebarProps {
  children: React.ReactNode
  className?: string
}

const MainElement: React.FC<SidebarProps> = ({ children, className }) => {
  return (
    <div className="w-full h-full relative overflow-auto">
      <div className="flex flex-col h-full w-full absolute inset">
        <Papertrail />
        <div className={'h-full w-full overflow-auto flex flex-col ' + className}>{children}</div>
      </div>
    </div>
  )
}

export default MainElement
