import React from 'react'
import { useNotificationStore, usePageStore } from '@renderer/stores'
import { IconLink, IconTrash } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import { LOGGING_LEVELS } from '@DeskThing/types'

const colorMap = {
  [LOGGING_LEVELS.ERROR]: 'text-red-500',
  [LOGGING_LEVELS.FATAL]: 'text-red-700',
  [LOGGING_LEVELS.WARN]: 'text-orange-500',
  [LOGGING_LEVELS.MESSAGE]: 'text-yellow-500',
  [LOGGING_LEVELS.DEBUG]: 'text-blue-500'
} as const

const EvensPage: React.FC = () => {
  const logs = useNotificationStore((state) => state.logs)
  const readLogs = useNotificationStore((state) => state.readLog)
  const setPage = usePageStore((pageStore) => pageStore.setPage)

  const handleReadLogs = (): void => {
    readLogs()
  }

  const openLogs = (): void => {
    setPage('Developer/Logs')
  }

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-4">Messages / Errors</h1>
        <Button className="gap-2 hover:bg-zinc-900" onClick={openLogs}>
          <p>Go to full Logs</p>
          <IconLink />
        </Button>
      </div>

      <div className="w-full h-full relative overflow-y-auto">
        {logs.length > 0 ? (
          <ul className="absolute inset-0 w-full h-full flex flex-col gap-3">
            {logs.map((log, index) => (
              <li
                key={index}
                className={`text-sm font-geistMono break-words whitespace-pre-wrap ${colorMap[log.type]}`}
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
