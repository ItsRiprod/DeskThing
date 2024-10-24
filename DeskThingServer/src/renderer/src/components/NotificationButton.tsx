import { IconBell } from '@renderer/assets/icons'
import React, { useEffect, useState } from 'react'
import Button from './Button'
import { useNotificationStore } from '@renderer/stores'
import { useSearchParams } from 'react-router-dom'

const NotificationButton: React.FC = () => {
  const [_searchParams, setSearchParams] = useSearchParams()

  const taskNum = useNotificationStore((state) => state.totalTasks)
  const logs = useNotificationStore((state) => state.logs)
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
    <>
      <Button onClick={handleOpenNotifications} className={`gap-2 hover:bg-zinc-900`}>
        {taskNum > 0 ? (
          <p
            className={`${errors > 0 || issues > 0 ? 'bg-red-500' : 'bg-green-500'} p-1 w-full rounded text-xs`}
          >
            {taskNum}
          </p>
        ) : (
          <IconBell iconSize={24} strokeWidth={2} />
        )}
        <p className="flex-grow text-center text-lg md:block hidden">Notifications</p>
      </Button>
    </>
  )
}

export default NotificationButton
