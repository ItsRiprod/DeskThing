// src/components/Toast.tsx

import { FC, useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type: string
  index: number
  onClose: () => void
}

const Toast: FC<ToastProps> = ({ message, type, onClose, index }) => {
  const [fadeOut, setFadeOut] = useState(false)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout
    let closeTimer: NodeJS.Timeout

    if (!hovering) {
      timer = setTimeout(() => {
        setFadeOut(true)
      }, 4500) // Start fading out 0.5 seconds before closing

      closeTimer = setTimeout(onClose, 5200)
    }

    return () => {
      clearTimeout(timer)
      clearTimeout(closeTimer)
    }
  }, [onClose, hovering])

  const handleMouseEnter = (): void => {
    setHovering(true)
    setFadeOut(false)
  }

  const handleMouseLeave = (): void => {
    setHovering(false)
  }

  return (
    <div
      style={{ bottom: `${4 + Math.max(index * (15 - index), 15)}px`, opacity: fadeOut ? 0 : 1 }}
      className={`fixed transition-all duration-700 border-t-2 shadow-xl right-4 p-4 ${type == 'error' ? 'bg-red-800 hover:bg-red-700 border-red-900' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-900'}  text-white rounded-lg shadow-lg flex items-center space-x-4 animate-fade-in-down`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span>{message}</span>
      <button onClick={onClose} className="text-2xl font-bold hover:text-red-400">
        &times;
      </button>
    </div>
  )
}

export default Toast
