import React from 'react'
import Papertrail from './Papertrail'

interface SidebarProps {
  children: React.ReactNode
  className?: string
}

const MainElement: React.FC<SidebarProps> = ({ children, className }) => {
  return (
    <div className="flex flex-col h-full w-full">
      <Papertrail />
      <div className={'h-full w-full overflow-auto flex flex-col ' + className}>{children}</div>
    </div>
  )
}

export default MainElement
