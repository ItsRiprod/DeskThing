import React from 'react'
import { Outlet } from 'react-router-dom'

/**
 * Renders the main Apps component, which serves as a container for the application's pages.
 * This component sets up the layout and rendering context for the application's pages,
 * which are rendered using the `Outlet` component from react-router-dom.
 */
const Apps: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-center h-full">
      <Outlet />
    </div>
  )
}

export default Apps
