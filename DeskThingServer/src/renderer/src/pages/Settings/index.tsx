import React from 'react'
import { Outlet } from 'react-router-dom'

const Settings: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Outlet />
    </div>
  )
}

export default Settings
