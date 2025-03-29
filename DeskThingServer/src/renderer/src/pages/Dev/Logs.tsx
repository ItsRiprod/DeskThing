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
import { Log } from '@shared/types'
import { LOGGING_LEVELS } from '@DeskThing/types'

const colorMap = {
  [LOGGING_LEVELS.ERROR]: 'text-red-500',
  [LOGGING_LEVELS.FATAL]: 'text-red-700',
  [LOGGING_LEVELS.WARN]: 'text-orange-500',
  [LOGGING_LEVELS.MESSAGE]: 'text-yellow-500',
  [LOGGING_LEVELS.DEBUG]: 'text-blue-500',
  [LOGGING_LEVELS.LOG]: 'text-gray-500'
}

const Logs: React.FC = () => {
  const logList = useLogStore((state) => state.logList)
  const [filter, setFilter] = useState<LOGGING_LEVELS | null>(null)
  const logContainerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const { reward, isAnimating } = useReward('rewardId', 'confetti')
  const [hoveredLog, setHoveredLog] = useState<Error | null>(null)

  const filteredLogs = useMemo(
    () => (filter ? logList.filter((log) => !filter || log.type === filter) : logList),
    [filter, logList]
  )

  useEffect(() => {
    if (logContainerRef.current && autoScroll) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [filteredLogs, autoScroll])

  const handleLogsOpen = (): void => {
    window.electron.utility.openLogsFolder()
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
              <div className="absolute inset-0">
                <p className="text-xs text-gray-500 break-words">{hoveredLog.message}</p>
                <p className="text-xs text-gray-500 break-words">{hoveredLog.stack}</p>
              </div>
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
            onClick={() => setFilter(LOGGING_LEVELS.MESSAGE)}
            className={`w-full ${filter === LOGGING_LEVELS.MESSAGE ? 'bg-zinc-800 hover:bg-zinc-700' : 'hover:bg-zinc-900'}`}
          >
            <IconBell strokeWidth={1.5} />
            <p className="md:block hidden text-center flex-grow">Messages</p>
          </Button>
          <Button
            onClick={() => setFilter(LOGGING_LEVELS.ERROR)}
            className={`w-full ${filter === LOGGING_LEVELS.ERROR ? 'bg-zinc-800 hover:bg-zinc-700' : 'hover:bg-zinc-900'}`}
          >
            <IconWarning strokeWidth={1.5} />
            <p className="md:block hidden text-center flex-grow">Errors</p>
          </Button>
          <Button
            onClick={() => setFilter(LOGGING_LEVELS.WARN)}
            className={`w-full ${filter === LOGGING_LEVELS.WARN ? 'bg-zinc-800 hover:bg-zinc-700' : 'hover:bg-zinc-900'}`}
          >
            <IconWarning strokeWidth={1.5} />
            <p className="md:block hidden text-center flex-grow">WARNs</p>
          </Button>
          <Button
            onClick={() => setFilter(LOGGING_LEVELS.FATAL)}
            className={`w-full ${filter === LOGGING_LEVELS.FATAL ? 'bg-zinc-800 hover:bg-zinc-700' : 'hover:bg-zinc-900'}`}
          >
            <IconWarning strokeWidth={1.5} />
            <p className="md:block hidden text-center flex-grow">Fatal</p>
          </Button>
          <Button
            onClick={() => setFilter(LOGGING_LEVELS.DEBUG)}
            className={`w-full ${filter === LOGGING_LEVELS.DEBUG ? 'bg-zinc-800 hover:bg-zinc-700' : 'hover:bg-zinc-900'}`}
          >
            <IconLogs strokeWidth={1.5} />
            <p className="md:block hidden text-center flex-grow">Debug</p>
          </Button>
          <Button
            onClick={() => setFilter(LOGGING_LEVELS.LOG)}
            className={`w-full ${filter === LOGGING_LEVELS.LOG ? 'bg-zinc-800 hover:bg-zinc-700' : 'hover:bg-zinc-900'}`}
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
                <LogItem
                  key={`${log.options.date}-${index}`}
                  log={log}
                  setHoveredLog={setHoveredLog}
                />
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

const LogItem = memo(
  ({ log, setHoveredLog }: { log: Log; setHoveredLog: (log: Error | null) => void }) => (
    <li
      className={`group text-sm hover:bg-zinc-900 items-center flex overflow-auto justify-between w-full font-geistMono break-words whitespace-pre-wrap ${
        colorMap[log.type]
      }`}
      onClick={() => setHoveredLog(log.options?.error || null)}
    >
      <p className="break-words">{log.log}</p>
      <div className="right-full pr-4 text-xs italic text-gray-600 group-hover:text-gray-300 text-nowrap flex flex-col items-end">
        <p>[{new Date(log.options.date as string).toLocaleTimeString()}]</p>
        <p>{`${log.options.source}${log.options.function && `.${log.options.function}`}`}</p>
      </div>
    </li>
  )
)
LogItem.displayName = 'LogItem'

Logs.displayName = 'Logs'

export default memo(Logs)
