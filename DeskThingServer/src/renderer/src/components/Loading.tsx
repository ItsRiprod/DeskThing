import React from 'react'
import { IconLogoLoading } from './icons'

const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <IconLogoLoading iconSize={256} />
    </div>
  )
}

export default Loading
