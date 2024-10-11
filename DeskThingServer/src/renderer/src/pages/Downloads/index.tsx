import React from 'react'
import { Outlet } from 'react-router-dom'
import Loading from '../../components/Loading'

const Downloads: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-3xl font-bold mb-4">Downloads</h1>
      <p className="text-lg mb-8">This page has not been implemented yet.</p>
      <Loading message="Settings page is loading..." />
      <Outlet />
    </div>
  )
}

export default Downloads
