import { useEffect, useState, useRef } from 'react'
import logStore, { Log } from '../../store/logStore'
import {
  IconBell,
  IconCopy,
  IconFolderOpen,
  IconLogoGearLoading,
  IconLogs,
  IconWarning
} from '../../assets/icons'

const LogDisplay = (): JSX.Element => {
  const [logs, setLogs] = useState<Log[]>([])
  const [filter, setFilter] = useState<string | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)
  const logContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateLogs = (data: Log[]): void => {
      setLogs((prevLogs) => [...prevLogs, data[data.length - 1]])
    }

    const initializeLogs = async (): Promise<void> => {
      const initialLogs = await logStore.getLogs()
      setLogs(initialLogs)
      setTimeout(() => {
        if (logEndRef.current) {
          logEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }, 200)
    }

    initializeLogs()
    logStore.on('update', updateLogs)

    return () => {
      logStore.off('update', updateLogs)
    }
  }, [])

  useEffect(() => {
    if (logEndRef.current) {
      handleScroll()
    }
  }, [logs])

  const handleScroll = (): void => {
    if (logContainerRef.current) {
      const { scrollHeight, clientHeight, scrollTop } = logContainerRef.current
      const isNearBottom = scrollHeight - clientHeight <= Math.abs(scrollTop) + 2000 // Adjust 100 for buffer

      // Auto scroll to bottom only if user is near the bottom
      console.log(scrollHeight - clientHeight - Math.abs(scrollTop))
      if (isNearBottom) {
        if (logEndRef.current) {
          logEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  }

  const toggleFilter = (newFilter: string): void => {
    setFilter((prevFilter) => (prevFilter === newFilter ? null : newFilter))
  }

  const handleOpenLogs = (): void => {
    window.electron.openLogFolder()
  }

  const copyLogsToClipboard = (): void => {
    const formattedLogs = logs.map((log) => `[${log.date}] [${log.type}] ${log.log}`).join('\n')
    navigator.clipboard
      .writeText(formattedLogs)
      .then(() => {
        // Optionally, you can add a visual feedback that the logs were copied
        console.log('Logs copied to clipboard')
      })
      .catch((err) => {
        console.error('Failed to copy logs: ', err)
      })
  }

  const filteredLogs = filter ? logs.filter((log) => log.type.toLowerCase() === filter) : logs

  return (
    <div className="pt-5 w-full h-full flex-col flex items-center">
      <h1 className="text-2xl mb-5 border-b-2 w-11/12 text-center pb-5">Console Logs</h1>
      <div className="w-11/12 flex justify-center items-center gap-2">
        <div className="flex border border-gray-500 rounded-lg">
          <button
            className={`group rounded-lg p-2 px-3 hover:bg-zinc-900 flex ${filter === 'log' ? 'bg-zinc-900' : ''}`}
            onClick={() => toggleFilter('log')}
          >
            <IconLogs />
            <p className="pl-2 hidden group-hover:block">Logs</p>
          </button>
          <button
            className={`group rounded-lg p-2 px-3 hover:bg-red-500 flex ${filter === 'error' ? 'bg-red-500' : ''}`}
            onClick={() => toggleFilter('error')}
          >
            <IconWarning />
            <p className="pl-2 hidden group-hover:block">Errors</p>
          </button>
          <button
            className={`group rounded-lg p-2 px-3 hover:bg-zinc-500 flex ${filter === 'message' ? 'bg-zinc-500' : ''}`}
            onClick={() => toggleFilter('message')}
          >
            <IconBell />
            <p className="pl-2 hidden group-hover:block">Messages</p>
          </button>
        </div>
        <button
          onClick={handleOpenLogs}
          className="group border p-2 border-gray-500 rounded-lg hover:bg-gray-500 flex"
        >
          <IconFolderOpen />
          <p className="pl-2 hidden group-hover:block">Open Folder</p>
        </button>
        <button
          onClick={copyLogsToClipboard}
          className="group border p-2 border-gray-500 rounded-lg hover:bg-gray-500 flex"
        >
          <IconCopy />
          <p className="pl-2 hidden group-hover:block">Copy Logs</p>
        </button>
      </div>
      <div ref={logContainerRef} className="w-full p-2 flex flex-col h-full overflow-y-scroll">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log, index) => (
            <div key={index} className="font-geistMono">
              <p
                className={`p-2 ${getBackgroundColor(log.type.toLowerCase())} border-t border-zinc-900`}
              >
                [{log.date}] {' ' + log.log}
              </p>
            </div>
          ))
        ) : (
          <div className="w-full flex flex-col items-center justify-center font-geistMono">
            <IconLogoGearLoading iconSize={128} />
            <p>{filter ? `No ${filter} logs found` : 'Waiting on logs...'}</p>
          </div>
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  )
}

const getBackgroundColor = (type: string): string => {
  switch (type) {
    case 'log':
      return 'text-zinc-500 hover:bg-zinc-900'
    case 'message':
      return 'bg-zinc-900 hover:bg-zinc-800'
    case 'error':
      return 'bg-red-700 hover:bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

export default LogDisplay
