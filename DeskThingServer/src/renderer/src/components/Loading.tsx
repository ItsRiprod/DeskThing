import React from 'react'
import { IconLogoLoading } from '../assets/icons'

interface LoadingProps {
  message?: string
}

const Loading: React.FC<LoadingProps> = ({ message }) => {
  return (
    <div className="flex items-center flex-col justify-center h-full">
      {IconLogoLoading && <IconLogoLoading iconSize={256} />}
      {message && <p className="text-lg text-center logo">{message}</p>}
    </div>
  )
}

export default Loading
