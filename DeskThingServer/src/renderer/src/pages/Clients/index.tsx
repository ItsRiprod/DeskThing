import React from 'react'
import { Outlet } from 'react-router-dom'

const Clients: React.FC = () => {
  return (
    <div className="flex h-full w-full">
      <Outlet />
    </div>
  )
}

export default Clients
