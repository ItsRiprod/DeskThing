// src/components/ToastContainer.tsx

import React, { useState, useEffect } from 'react'
import Toast from './Toast'
import logStore, { log } from '../../store/logStore'

interface ToastData extends log {
  id: string
}

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastData[]>([])

  useEffect(() => {
    const handleNewLog = (log: log): void => {
      setToasts((prevToasts) => [
        ...prevToasts,
        {
          ...log,
          date: new Date(log.date),
          id: generateUniqueId()
        }
      ])
    }

    logStore.on('new', handleNewLog)

    return () => {
      logStore.off('new', handleNewLog)
    }
  }, [])

  const removeToast = (id: string): void => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }

  const generateUniqueId = (): string => {
    return `${Date.now()}-${Math.random().toString(36)}`
  }

  return (
    <div className="fixed bottom-4 right-4 space-y-4 z-50 pointer-events-auto">
      {toasts.map((toast, index) => (
        <Toast
          index={toasts.length - index}
          key={toast.id}
          message={toast.log}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

export default ToastContainer
