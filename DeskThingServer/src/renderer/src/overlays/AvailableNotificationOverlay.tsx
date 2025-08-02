import Button from '@renderer/components/Button'
import { useNotificationStore } from '@renderer/stores'
import React from 'react'
import { useSearchParams } from 'react-router-dom'

const AvailableNotificationOverlay: React.FC = () => {
  const notifications = useNotificationStore((state) => state.messages)
  const [searchParams, setSearchParams] = useSearchParams()

  const handleOpenSettings = (): void => {
    searchParams.set('notifications', 'true')
    searchParams.set('page', 'notification')
    setSearchParams(searchParams)
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col-reverse items-end justify-center gap-2">
      <div className="animate-pop-in bg-zinc-900 border border-zinc-800 px-5 py-4 rounded-tl-lg shadow-2xl flex flex-col gap-4 w-full max-w-xs backdrop-blur-sm cursor-pointer active:scale-95 transition-transform">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-900 flex items-center justify-center">
            <span className="font-bold text-emerald-300 text-lg">
              {Object.keys(notifications).length}
            </span>
          </div>
          <div className="flex-grow">
            <p className="font-semibold text-white text-base">
              {Object.keys(notifications).length === 1
                ? 'You have 1 notification'
                : `You have ${Object.keys(notifications).length} notifications`}
            </p>
            <p className="text-xs text-zinc-400">Stay up to date with the latest alerts.</p>
          </div>
        </div>
        <Button
          className="w-full px-3 py-2 rounded font-semibold bg-emerald-900 text-emerald-300 hover:bg-emerald-800 transition-all duration-300"
          onClick={handleOpenSettings}
        >
          Open Notifications
        </Button>
      </div>
    </div>
  )
}
export default AvailableNotificationOverlay
