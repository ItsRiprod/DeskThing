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

const Logs: React.FC = () => {
  const { logList, getLogs } = useLogStore()
  const [filter, setFilter] = useState<string | null>(null)
  const logContainerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const { reward, isAnimating } = useReward('rewardId', 'confetti')

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
    const logsText = filteredLogs.map((log) => `[${log.date}] ${log.type}: ${log.log}`).join('\n')
    navigator.clipboard.writeText(logsText)
    reward()
  }

  return (
    <div className="w-full h-full flex">
      <Sidebar className="flex justify-end flex-col h-full max-h-full md:items-stretch items-center">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 border-l-2 pl-2 border-gray-500 py-2">
            <p className="font-semibold">Filters</p>
            <Button
              onClick={() => setFilter(null)}
              className={`border-gray-500 ${filter === null ? 'border-l-green-500 border-l-4' : ''}`}
            >
              <IconLogs strokeWidth={1.5} />
              <p className="md:block hidden text-center flex-grow">All</p>
            </Button>
            <Button
              onClick={() => setFilter('message')}
              className={`border-gray-500 ${filter === 'message' ? 'border-l-green-500 border-l-4' : ''}`}
            >
              <IconBell strokeWidth={1.5} />
              <p className="md:block hidden text-center flex-grow">Messages</p>
            </Button>
            <Button
              onClick={() => setFilter('error')}
              className={`border-gray-500 ${filter === 'error' ? 'border-l-green-500 border-l-4' : ''}`}
            >
              <IconWarning strokeWidth={1.5} />
              <p className="md:block hidden text-center flex-grow">Errors</p>
            </Button>
          </div>
          <Button onClick={handleLogsOpen} className="border-gray-500 hover:bg-gray-500">
            <IconFolderOpen strokeWidth={1.5} />
            <p className="md:block hidden text-center flex-grow">Open Logs</p>
          </Button>

          <Button
            onClick={handleCopyLogs}
            className="border-gray-500 hover:bg-gray-500"
            disabled={isAnimating}
          >
            <span id="rewardId" />
            {isAnimating ? <IconCheck strokeWidth={1.5} /> : <IconCopy strokeWidth={1.5} />}
            <p className="md:block hidden text-center flex-grow">Copy Logs</p>
          </Button>
        </div>
      </Sidebar>
      <MainElement>
        <h2 className="text-xl font-semibold m-4">Logs</h2>
        <div
          ref={logContainerRef}
          className="w-full border-t bg-black shadow-2xl border-gray-500 p-5 max-w-full overflow-auto"
          style={{ maxHeight: 'calc(100vh - 8rem)' }}
          onScroll={handleScroll}
        >
          <ul className="space-y-2">
            {filteredLogs.map((log, index) => (
              <li
                key={index}
                className={`text-sm font-geistMono break-words whitespace-pre-wrap ${
                  log.type === 'error'
                    ? 'text-red-500'
                    : log.type === 'message'
                      ? 'text-yellow-500'
                      : 'text-gray-500'
                }`}
              >
                [{log.date}] {log.type}: {log.log}
              </li>
            ))}
          </ul>
        </div>
      </MainElement>
    </div>
  )
}

export default Logs
