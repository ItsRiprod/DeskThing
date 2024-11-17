import React from 'react'
import { useNotificationStore } from '@renderer/stores'
import { IconTrash } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import { MESSAGE_TYPES } from '@shared/types'

const EvensPage: React.FC = () => {
  const logs = useNotificationStore((state) => state.logs)
  const readLogs = useNotificationStore((state) => state.readLog)

  const handleReadLogs = (): void => {
    readLogs()
  }

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
                  log.type === MESSAGE_TYPES.ERROR
                    ? 'text-red-500'
                    : log.type === MESSAGE_TYPES.FATAL
                      ? 'text-red-700'
                      : log.type === MESSAGE_TYPES.WARNING
                        ? 'text-orange-500'
                        : log.type === MESSAGE_TYPES.MESSAGE
                          ? 'text-yellow-500'
                          : log.type === MESSAGE_TYPES.DEBUG
                            ? 'text-blue-500'
                            : 'text-gray-300'
                }`}
              >
                <button
                  onClick={() => readLogs(index)}
                  className="pl-2 py-2 rounded-xl hover:bg-zinc-900 relative group border-gray-500 flex items-center justify-start w-full"
                >
                  <div className="absolute right-1  text-red-500 hidden group-hover:block">
                    <IconTrash />
                  </div>
                  <p className="text-justify">{log.log}</p>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No events found.</p>
        )}
      </div>
      {logs.length > 0 && (
        <Button className="hover:bg-zinc-900 w-fit" onClick={handleReadLogs}>
          <p>Clear All</p>
        </Button>
      )}
    </div>
  )
}

export default EvensPage
