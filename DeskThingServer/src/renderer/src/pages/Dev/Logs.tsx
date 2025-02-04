import React, { useEffect, useState, useRef, useMemo, memo } from 'react'
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
  IconToggle,
  IconWarning
} from '@renderer/assets/icons'
import { useReward } from 'react-rewards'
import { Log, MESSAGE_TYPES } from '@shared/types/types'

const colorMap = {
  [MESSAGE_TYPES.ERROR]: 'text-red-500',
  [MESSAGE_TYPES.FATAL]: 'text-red-700',
  [MESSAGE_TYPES.WARNING]: 'text-orange-500',
  [MESSAGE_TYPES.MESSAGE]: 'text-yellow-500',
  [MESSAGE_TYPES.DEBUG]: 'text-blue-500',
  [MESSAGE_TYPES.LOGGING]: 'text-gray-500'
}

const Logs: React.FC = () => {
  const logList = useLogStore((state) => state.logList)
  const getLogs = useLogStore((state) => state.getLogs)
  const [filter, setFilter] = useState<MESSAGE_TYPES | null>(null)
  const logContainerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const { reward, isAnimating } = useReward('rewardId', 'confetti')
  const [hoveredLog, setHoveredLog] = useState<string | null>(null)

  const filteredLogs = useMemo(
    () => (filter ? logList.filter((log) => !filter || log.type === filter) : logList),
    [filter, logList]
  )

  useEffect(() => {
    getLogs()
  }, [getLogs])

  useEffect(() => {
    if (logContainerRef.current && autoScroll) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [filteredLogs, autoScroll])

  const LogItem = memo(({ log }: { log: Log; index: number }) => (
    <li
      className={`group text-sm hover:bg-zinc-900 items-center flex overflow-auto justify-between w-full font-geistMono break-words whitespace-pre-wrap ${
        colorMap[log.type]
      }`}
      onClick={() => setHoveredLog(log.options?.error?.stack || null)}
    >
      <p className="break-words">{log.log}</p>
      <div className="right-full pr-4 text-xs italic text-gray-600 group-hover:text-gray-300 text-nowrap flex flex-col items-end">
        <p>[{new Date(log.options.date as string).toLocaleTimeString()}]</p>
        <p>{`${log.options.source}${log.options.function && `.${log.options.function}`}`}</p>
      </div>
    </li>
  ))
  LogItem.displayName = 'LogItem'

  const handleLogsOpen = (): void => {
    window.electron.openLogsFolder()
  }

  const handleCopyLogs = (): void => {
    const logsText = filteredLogs
      .map(
        (log) =>
          `[${new Date(log.options.date || '2024-11-17T11:16:16.970Z').toLocaleTimeString()} ${log.options.source}]: ${log.log}`
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
          <Button
            onClick={() => setAutoScroll(!autoScroll)}
            className="items-center justify-center hover:bg-zinc-900"
          >
            <IconToggle
              className={autoScroll ? `text-green-500` : `text-red-500`}
              checked={autoScroll}
              strokeWidth={1.5}
              iconSize={30}
            />
            <p className="md:block xs:hidden text-center flex-grow">Autoscroll</p>
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
          className="w-full h-full bg-black shadow-2xl p-5 max-w-full overflow-auto"
          style={{ maxHeight: 'calc(100vh - 8rem)' }}
        >
          {filteredLogs.length > 0 ? (
            <ul className="space-y-2">
              {filteredLogs.map((log, index) => (
                <LogItem key={`${log.options.date}-${index}`} log={log} index={index} />
              ))}
            </ul>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-sm text-white">No logs available for filter {filter}.</p>
            </div>
          )}
        </div>
      </MainElement>
    </div>
  )
}

Logs.displayName = 'Logs'

export default memo(Logs)
