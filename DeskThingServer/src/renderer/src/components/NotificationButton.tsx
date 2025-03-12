import { IconBell } from '@renderer/assets/icons'
import React, { useEffect, useState } from 'react'
import Button from './Button'
import { useNotificationStore } from '@renderer/stores'
import { useSearchParams } from 'react-router-dom'
import { useFloating, autoUpdate } from '@floating-ui/react-dom'

const NotificationButton: React.FC = () => {
  const [_searchParams, setSearchParams] = useSearchParams()
  const { refs, floatingStyles } = useFloating({
    placement: 'right',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate
  })

  const taskNum = useNotificationStore((state) => state.totalTasks)
  const logs = useNotificationStore((state) => state.logs)
  const requests = useNotificationStore((state) => state.requestQueue)
  const issues = useNotificationStore((state) => state.issues.length)
  const [errors, setErrors] = useState(0)

  useEffect(() => {
    setErrors(0)
    logs.forEach((log) => {
      if (log.type === 'error') {
        setErrors((prev) => prev + 1)
      }
    })
  }, [logs])

  const handleOpenNotifications = (): void => {
    setSearchParams({ notifications: 'true' })
  }

  return (
    <div ref={refs.setReference}>
      <Button
        title="System Notifications"
        onClick={handleOpenNotifications}
        className={`gap-2 hover:bg-zinc-900`}
      >
        {taskNum > 0 ? (
          <div
            className={`${errors > 0 || issues > 0 ? 'bg-red-500' : 'bg-green-500'} relative p-1 w-full rounded text-xs group`}
          >
            {requests.length > 0 && (
              <div className="absolute inset-0 rounded w-full h-full animate-ping border-2 border-blue-500"></div>
            )}
            {taskNum}
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className="z-50 hidden group-hover:flex bg-black flex-col items-start gap-2 p-2 rounded-md shadow-md"
            >
              <p>Logs: {logs.length}</p>
              <p>Errors: {errors}</p>
              <p>Requests: {requests.length}</p>
              <p>issues: {issues}</p>
            </div>
          </div>
        ) : (
          <IconBell iconSize={24} strokeWidth={2} />
        )}
        <p className="flex-grow text-center text-lg md:block hidden">Notifications</p>
      </Button>
    </div>
  )
}

export default NotificationButton
