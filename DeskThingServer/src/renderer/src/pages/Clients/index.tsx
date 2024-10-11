import React from 'react'
import { Outlet } from 'react-router-dom'

const Clients: React.FC = () => {
  return (
    <div className="flex flex-col relative h-full w-full">
      <Outlet />
    </div>
  )
}

export default Clients
