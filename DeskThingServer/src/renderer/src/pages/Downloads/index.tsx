import React from 'react'
import { Outlet } from 'react-router-dom'

const Downloads: React.FC = () => {
  return (
    <div className="relative flex w-full h-full">
      <Outlet />
    </div>
  )
}

export default Downloads
