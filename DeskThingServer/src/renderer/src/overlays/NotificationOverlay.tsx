import React, { useEffect, useRef } from 'react'
import useLogStore from '../stores/logStore'
import useRequestStore from '../stores/requestStore'

interface NotificationOverlayProps {
  onClose: () => void
}

const NotificationOverlay: React.FC<NotificationOverlayProps> = ({ onClose }) => {
  const logs = useLogStore((logStore) => logStore.logList)
  const requests = useRequestStore((state) => state.requestQueue)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={overlayRef}
        className="flex flex-col w-1/2 min-w-96 max-w-[900px] max-h-full overflow-y-scroll overflow-x-hidden"
      >
        <div className="flex flex-col gap-2">
          <div className="flex justify-between mb-2">
            <h2 className="text-xl font-semibold">Notifications</h2>
          </div>
          <div className="w-full border bg-black shadow-2xl border-gray-500 rounded-2xl p-5">
            <h3 className="font-semibold pb-2">Logs</h3>
            <ul className="space-y-2">
              {logs &&
                logs.map((log, index) => (
                  <li
                    key={index}
                    className={`text-sm font-geistMono ${log.type === 'error' ? 'text-red-500' : log.type === 'message' ? 'text-yellow-500' : 'text-gray-300'}`}
                  >
                    [{log.date}] {log.type}: {log.log}
                  </li>
                ))}
            </ul>
          </div>
          <div className="w-full border bg-black shadow-2xl border-gray-500 rounded-2xl p-5">
            <h3 className="font-semibold pb-2">Requests</h3>
            <ul className="space-y-2">
              {requests.map((request, index) => (
                <li key={index} className="text-sm font-geistMono">
                  {request.appName}: {Object.keys(request.scopes).join(', ')}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationOverlay
