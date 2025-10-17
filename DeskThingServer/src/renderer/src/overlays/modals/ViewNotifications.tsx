import React, { useState } from 'react'
import { useNotificationStore } from '@renderer/stores'
import { useSearchParams } from 'react-router-dom'
import { IconArrowRight } from '@renderer/assets/icons'
import { NotificationMessage } from '@deskthing/types'
import Button from '@renderer/components/buttons/Button'
import { IconX } from '@renderer/assets/icons'

type NotificationProps = {
  notification: NotificationMessage
  onAcknowledge: (notification: NotificationMessage) => void
}

const NotificationItem: React.FC<NotificationProps> = ({ notification, onAcknowledge }) => {
  const [textResponse, setTextResponse] = useState('')

  const handleAcknowledge = (response?: boolean): void => {
    if (notification.type === 'text') {
      notification.response = textResponse
    } else if (
      notification.type === 'acknowledge' ||
      notification.type === 'confirm' ||
      notification.type === 'yesno'
    ) {
      notification.response = response
    }
    onAcknowledge(notification)
  }

  const showClose = !notification.acknowledged && !['yesno', 'text'].includes(notification.type)

  return (
    <div
      className={`relative border rounded-xl p-4 mb-4 transition-all duration-300
        ${
          notification.type === 'error'
            ? 'border-red-700 bg-gradient-to-br from-zinc-950 to-red-950 shadow-red-700/30'
            : notification.type === 'warning'
              ? 'border-yellow-700 bg-gradient-to-br from-zinc-950 to-yellow-950 shadow-yellow-700/30'
              : notification.type === 'info'
                ? 'border-blue-700 bg-gradient-to-br from-zinc-950 to-blue-950 shadow-blue-700/30'
                : notification.type === 'acknowledge'
                  ? 'border-emerald-700 bg-gradient-to-br from-zinc-950 to-emerald-950 shadow-emerald-700/30'
                  : notification.type === 'confirm'
                    ? 'border-emerald-400 bg-gradient-to-br from-zinc-950 to-emerald-950 shadow-emerald-400/30'
                    : 'border-zinc-900 bg-zinc-950 shadow-zinc-900/20'
        }
        group hover:scale-[1.01] hover:-translate-y-0.5 m-1
      `}
    >
      {showClose && (
        <button
          className="absolute top-2 right-2 text-zinc-400 hover:text-red-400 transition-colors rounded-full p-1 bg-zinc-900/80 hover:bg-red-900/80"
          title="Dismiss"
          onClick={() => handleAcknowledge(false)}
        >
          <IconX className="w-5 h-5" />
        </button>
      )}
      <div
        className="absolute top-2 left-2 px-2 py-0.5 text-xs font-semibold text-emerald-400 bg-zinc-900/80 rounded-full shadow-sm pointer-events-none select-none"
        style={{
          maxWidth: '120px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
        title={notification.source}
      >
        {notification.source}
      </div>
      <div className="flex flex-col mt-3 gap-2">
        <h2 className="text-xl font-semibold mb-1 truncate">{notification.title}</h2>
        <p className="text-zinc-400 mb-1">{notification.description}</p>
        {notification.link && (
          <a
            href={notification.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 underline font-medium hover:text-emerald-300 transition"
          >
            {notification.link}
          </a>
        )}
        <div className="flex flex-col gap-2 mt-2">
          {notification.type === 'acknowledge' && !notification.acknowledged && (
            <button
              className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200"
              onClick={() => handleAcknowledge(true)}
            >
              {notification.action_label || 'Acknowledge'}
            </button>
          )}
          {notification.type === 'confirm' && !notification.acknowledged && (
            <div className="flex gap-2">
              <button
                className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200"
                onClick={() => handleAcknowledge(true)}
              >
                {notification.action_label || 'Confirm'}
              </button>
              <button
                className="flex-1 bg-zinc-800 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200"
                onClick={() => handleAcknowledge(false)}
              >
                Cancel
              </button>
            </div>
          )}
          {notification.type === 'yesno' && !notification.acknowledged && (
            <div className="flex gap-2">
              <button
                className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200"
                onClick={() => handleAcknowledge(true)}
              >
                Yes
              </button>
              <button
                className="flex-1 bg-zinc-800 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200"
                onClick={() => handleAcknowledge(false)}
              >
                No
              </button>
            </div>
          )}
          {notification.type === 'text' && !notification.acknowledged && (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                className="bg-zinc-800 text-white px-3 py-2 rounded-lg border border-zinc-700 focus:border-emerald-400 outline-none transition"
                value={textResponse}
                onChange={(e) => setTextResponse(e.target.value)}
                placeholder="Enter response..."
              />
              <Button
                className="bg-emerald-700 justify-center hover:bg-emerald-600 disabled:bg-emerald-800 disabled:hover:bg-emerald-800 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200"
                onClick={() => handleAcknowledge()}
                disabled={!textResponse}
              >
                Submit
              </Button>
            </div>
          )}
          {notification.acknowledged && (
            <span className="text-emerald-400 text-sm mt-2 font-semibold">Acknowledged</span>
          )}
        </div>
      </div>
    </div>
  )
}
const ViewNotifications: React.FC = () => {
  const notificationsObj = useNotificationStore((state) => state.messages)
  const acknowledge = useNotificationStore((state) => state.acknowledgeNotification)
  const [searchParams, setSearchParams] = useSearchParams()
  const [isOpen, setIsOpen] = useState(true)
  const appFilter = searchParams.get('appFilter') || ''
  let notifications = Object.values(notificationsObj ?? {})

  if (appFilter) {
    notifications = notifications.filter((notification) => notification.source === appFilter)
  }

  const onClose = (): void => {
    setIsOpen(false)
    setTimeout(() => {
      searchParams.delete('notificationmodal')
      setSearchParams(searchParams)
    }, 180)
  }

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const ClearFilters = (): void => {
    searchParams.delete('appFilter')
    setSearchParams(searchParams)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-end ${isOpen ? 'bg-black/90' : 'bg-black/0'} transition-all duration-200`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-zinc-900 border border-zinc-800 h-full w-full max-w-2xl overflow-hidden transform transition-transform duration-100 translate-x-0 ${
          isOpen ? 'animate-slide-in' : 'animate-slide-out'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-zinc-100 font-semibold">Notifications</h2>
            {appFilter && (
              <div className="text-sm text-zinc-400 italic">
                <p>
                  Filtering by app: <span className="text-zinc-200 font-medium">{appFilter}</span>
                </p>
                <button onClick={ClearFilters}>Clear Filters</button>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 transition-colors">
            <IconArrowRight />
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-4 h-[calc(100vh-4rem)]">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onAcknowledge={acknowledge}
              />
            ))
          ) : (
            <div className="text-center text-zinc-500 py-8">No notifications found.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ViewNotifications
