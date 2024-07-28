import React from 'react'
import { IconX } from './icons'

interface LoadingProps {
  message?: string
}

const Loading: React.FC<LoadingProps> = ({ message }) => {
  return (
    <div className="flex items-center flex-col justify-center h-screen">
      {IconX && <IconX iconSize={256} />}
      {message && <p className="text-lg text-center logo">{message}</p>}
    </div>
  )
}

export default Loading
