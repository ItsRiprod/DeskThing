import React, { useEffect } from 'react'
import { useNotificationStore } from '@renderer/stores'
import Button from '@renderer/components/Button'
import { IconCheck, IconEye, IconX } from '@renderer/assets/icons'

const LogsPage: React.FC = () => {
  const logs = useNotificationStore((state) => state.logs)
  const readLogs = useNotificationStore((state) => state.readLog)

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Messages / Errors</h1>
      <div className="w-full h-full relative overflow-y-auto">
        {logs.length > 0 ? (
          <ul className="absolute inset-0 w-full h-full flex flex-col gap-3">
            {logs.map((log, index) => (
              <li
                key={index}
                className={`text-sm font-geistMono break-words whitespace-pre-wrap ${
                  log.type === 'error'
                    ? 'text-red-500'
                    : log.type === 'message'
                      ? 'text-yellow-500'
                      : 'text-gray-300'
                }`}
              >
                <button
                  onClick={() => readLogs(index)}
                  className="border-l pl-2 hover:bg-gray-900 relative group border-gray-500 flex items-center justify-center w-full"
                >
                  <div className="absolute left-1 text-red-500 hidden group-hover:block">
                    <IconX />
                  </div>
                  <p>{log.log}</p>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No events found.</p>
        )}
      </div>
    </div>
  )
}

export default LogsPage
