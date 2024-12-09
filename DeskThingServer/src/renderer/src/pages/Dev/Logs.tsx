import React, { useEffect, useState, useRef } from 'react'
import useLogStore from '../../stores/logStore'
import Sidebar from '@renderer/nav/Sidebar'
import MainElement from '@renderer/nav/MainElement'
import Button from '@renderer/components/Button'
import {
  IconBell,
  IconCheck,
  IconCopy,
  IconFolderOpen,
  IconLogs,
  IconWarning
} from '@renderer/assets/icons'
import { useReward } from 'react-rewards'
import { MESSAGE_TYPES } from '@shared/types/types'

const Logs: React.FC = () => {
  const { logList, getLogs } = useLogStore()
  const [filter, setFilter] = useState<MESSAGE_TYPES | null>(null)
  const logContainerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const { reward, isAnimating } = useReward('rewardId', 'confetti')
  const [hoveredLog, setHoveredLog] = useState<string | null>(null)

  const filteredLogs = filter ? logList.filter((log) => log.type === filter) : logList

  useEffect(() => {
    getLogs()
  }, [getLogs])

  useEffect(() => {
    if (logContainerRef.current && autoScroll) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [filteredLogs, autoScroll])

  const handleScroll = (): void => {
    if (logContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current
      const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10 // 10px threshold
      setAutoScroll(isScrolledToBottom)
    }
  }

  const handleLogsOpen = (): void => {
    window.electron.openLogsFolder()
  }

  const handleCopyLogs = (): void => {
    const logsText = filteredLogs
      .map(
        (log) =>
          `[${new Date(log.date || '2024-11-17T11:16:16.970Z').toLocaleTimeString()} ${log.source}]: ${log.log}`
      )
      .join('\n')
    navigator.clipboard.writeText(logsText)
    reward()
  }

  return (
    <div className="w-full h-full flex">
      <Sidebar className="flex justify-between flex-col h-full max-h-full md:items-stretch xs:items-center">
        <div className="relative h-full overflow-auto">
          <p>
            {hoveredLog && (
              <div className="absolute inset-0 text-xs text-gray-500 break-words">{hoveredLog}</div>
            )}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={handleLogsOpen} className="hover:bg-zinc-900">
            <IconFolderOpen strokeWidth={1.5} />
            <p className="md:block xs:hidden text-center flex-grow">Open Logs</p>
          </Button>

          <Button onClick={handleCopyLogs} className="hover:bg-zinc-900" disabled={isAnimating}>
            <span id="rewardId" />
            {isAnimating ? <IconCheck strokeWidth={1.5} /> : <IconCopy strokeWidth={1.5} />}
            <p className="md:block xs:hidden text-center flex-grow">Copy Logs</p>
          </Button>
        </div>
      </Sidebar>
      <MainElement>
        <div className="flex gap-2 px-2 my-2 py-2 bg-zinc-950 border-b border-zinc-900">
          <Button
            onClick={() => setFilter(null)}
            className={`w-full ${filter === null ? 'bg-zinc-800 hover:bg-zinc-700' : 'hover:bg-zinc-900'}`}
          >
            <IconLogs strokeWidth={1.5} />
            <p className="md:block hidden text-center flex-grow">All</p>
          </Button>
          <Button
            onClick={() => setFilter(MESSAGE_TYPES.MESSAGE)}
            className={`w-full ${filter === MESSAGE_TYPES.MESSAGE ? 'bg-zinc-800 hover:bg-zinc-700' : 'hover:bg-zinc-900'}`}
          >
            <IconBell strokeWidth={1.5} />
            <p className="md:block hidden text-center flex-grow">Messages</p>
          </Button>
          <Button
            onClick={() => setFilter(MESSAGE_TYPES.ERROR)}
            className={`w-full ${filter === MESSAGE_TYPES.ERROR ? 'bg-zinc-800 hover:bg-zinc-700' : 'hover:bg-zinc-900'}`}
          >
            <IconWarning strokeWidth={1.5} />
            <p className="md:block hidden text-center flex-grow">Errors</p>
          </Button>
          <Button
            onClick={() => setFilter(MESSAGE_TYPES.WARNING)}
            className={`w-full ${filter === MESSAGE_TYPES.WARNING ? 'bg-zinc-800 hover:bg-zinc-700' : 'hover:bg-zinc-900'}`}
          >
            <IconWarning strokeWidth={1.5} />
            <p className="md:block hidden text-center flex-grow">Warnings</p>
          </Button>
          <Button
            onClick={() => setFilter(MESSAGE_TYPES.FATAL)}
            className={`w-full ${filter === MESSAGE_TYPES.FATAL ? 'bg-zinc-800 hover:bg-zinc-700' : 'hover:bg-zinc-900'}`}
          >
            <IconWarning strokeWidth={1.5} />
            <p className="md:block hidden text-center flex-grow">Fatal</p>
          </Button>
          <Button
            onClick={() => setFilter(MESSAGE_TYPES.DEBUG)}
            className={`w-full ${filter === MESSAGE_TYPES.DEBUG ? 'bg-zinc-800 hover:bg-zinc-700' : 'hover:bg-zinc-900'}`}
          >
            <IconLogs strokeWidth={1.5} />
            <p className="md:block hidden text-center flex-grow">Debug</p>
          </Button>
          <Button
            onClick={() => setFilter(MESSAGE_TYPES.LOGGING)}
            className={`w-full ${filter === MESSAGE_TYPES.LOGGING ? 'bg-zinc-800 hover:bg-zinc-700' : 'hover:bg-zinc-900'}`}
          >
            <IconLogs strokeWidth={1.5} />
            <p className="md:block hidden text-center flex-grow">Logs</p>
          </Button>
        </div>
        <div
          ref={logContainerRef}
          className="w-full bg-black shadow-2xl p-5 max-w-full overflow-auto"
          style={{ maxHeight: 'calc(100vh - 8rem)' }}
          onScroll={handleScroll}
        >
          <ul className="space-y-2">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, index) => (
                <li
                  key={index}
                  className={`relative group text-sm hover:bg-zinc-900 items-center flex overflow-auto justify-between w-full font-geistMono break-words whitespace-pre-wrap ${
                    log.type === MESSAGE_TYPES.ERROR
                      ? 'text-red-500'
                      : log.type === MESSAGE_TYPES.MESSAGE
                        ? 'text-yellow-500'
                        : log.type === MESSAGE_TYPES.WARNING
                          ? 'text-orange-500'
                          : log.type === MESSAGE_TYPES.FATAL
                            ? 'text-red-700'
                            : log.type === MESSAGE_TYPES.DEBUG
                              ? 'text-blue-500'
                              : 'text-gray-500'
                  }`}
                  onClick={() => setHoveredLog(log.trace || null)}
                >
                  <p className="break-words">{log.log}</p>
                  <p className="text-xs italic text-gray-600 text-nowrap">
                    [{new Date(log.date as string).toLocaleTimeString()} {log.source}]
                  </p>
                </li>
              ))
            ) : (
              <li className="text-sm text-white">No logs available for filter {filter}.</li>
            )}
          </ul>
        </div>
      </MainElement>
    </div>
  )
}

export default Logs
