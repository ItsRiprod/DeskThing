// src/components/Toast.tsx

import React from 'react'

interface ToastProps {
  message: string
  type: string
  onClose: () => void
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000) // Automatically close after 5 seconds
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed bottom-4 right-4 p-4 ${type == 'error' ? 'bg-red-800 hover:bg-red-700' : 'bg-gray-800 hover:bg-gray-700'}  text-white rounded-lg shadow-lg flex items-center space-x-4 animate-fade-in-down`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="text-2xl font-bold hover:text-red-400">
        &times;
      </button>
    </div>
  )
}

export default Toast
