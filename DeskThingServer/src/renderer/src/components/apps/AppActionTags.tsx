import React from 'react'
import useNotificationStore from '@renderer/stores/notificationStore'
import useTaskStore from '@renderer/stores/taskStore'
import { useSearchParams } from 'react-router-dom'

type AppActionTagsProps = {
  appId: string
  className?: string
}

export const AppActionTags: React.FC<AppActionTagsProps> = ({ appId, className }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawNotifications = useNotificationStore((state) => state.messages)
  const rawTasks = useTaskStore((state) => state.taskList)

  const notifications = Object.values(rawNotifications).filter((msg) => msg.source === appId)
  const tasks = Object.values(rawTasks[appId] ?? {})

  const notificationCount = notifications.length
  const taskCount = (tasks.filter((task) => !task.completed) ?? []).length

  const actions: Array<{
    label: string
    count: number
    className: string
    link?: string
  }> = [
    {
      label: `${notificationCount} Notification${notificationCount === 1 ? '' : 's'}`,
      count: notificationCount,
      className: 'bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/15',
      link: 'deskthing://apps/list?notificationmodal=true&appFilter=' + appId
    },
    {
      label: `${taskCount} Task${taskCount === 1 ? '' : 's'}`,
      count: taskCount,
      className: 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/15',
      link: 'deskthing://apps/list?notifications=true&page=task'
    }
  ]

  const visibleActions = actions.filter((action) => action.count > 0)

  if (visibleActions.length === 0) return null

  // Helper to parse deskthing://apps/list?tasks=true
  const openLink = (link?: string): void => {
    if (!link) return
    const url = new URL(link.replace('deskthing://', 'http://')) // dummy protocol for parsing
    url.searchParams.forEach((value, key) => {
      searchParams.set(key, value)
    })
    setSearchParams(searchParams)
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {visibleActions.map((action) => (
        <span
          key={action.label}
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors border-none ${action.className}`}
          style={{ cursor: action.link ? 'pointer' : undefined }}
          onClick={() => openLink(action.link)}
        >
          {action.label}
        </span>
      ))}
    </div>
  )
}

export default AppActionTags
