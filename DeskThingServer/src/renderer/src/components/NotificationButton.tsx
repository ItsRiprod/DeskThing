import { IconDetails, IconWarning } from '@renderer/assets/icons'
import React, { useEffect, useState } from 'react'
import Button from './Button'
import { useSearchParams } from 'react-router-dom'
import useTaskStore from '@renderer/stores/taskStore'
import { useNotificationStore } from '@renderer/stores'

const NotificationButton: React.FC = () => {
  const [bounce, setBounce] = useState(false)
  const taskList = useTaskStore((state) => state.taskList)
  const taskNum = Object.values(taskList).reduce((acc, tasks) => acc + Object.keys(tasks).length, 0)
  const [prevTaskNum, setPrevTaskNum] = useState(taskNum)
  const activeErrors = useNotificationStore((state) => state.issues)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (taskNum != prevTaskNum) {
      setPrevTaskNum(taskNum)
      setBounce(true)
      console.log('New num of tasks: ', taskNum)
    }
  }, [taskNum, prevTaskNum])

  const handleOpenNotifications = (): void => {
    setSearchParams({ notifications: 'true' })
    setBounce(false)
    searchParams.set('notifications', 'true')
    setSearchParams(searchParams)
  }

  return (
    <div>
      <Button
        title="System Notifications"
        onClick={handleOpenNotifications}
        className={`gap-2 hover:bg-zinc-900 items-center justify-center w-full ${bounce && 'animate-highlight border'}`}
      >
        {activeErrors.length > 0 ? (
          <div className="flex gap-1 text-red-500">
            {activeErrors.length}
            <IconWarning iconSize={24} strokeWidth={2} />
          </div>
        ) : (
          <IconDetails iconSize={24} strokeWidth={2} />
        )}
        <p className="flex-grow text-center text-lg md:block hidden">Tasks</p>
      </Button>
    </div>
  )
}

export default NotificationButton
