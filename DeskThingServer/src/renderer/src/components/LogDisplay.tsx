import { useEffect, useState, useRef } from 'react'
import logStore, { log } from '../store/logStore'
import { IconLogoLoading } from './icons'

const LogDisplay = (): JSX.Element => {
  const [logs, setLogs] = useState<log[]>([])
  const logEndRef = useRef<HTMLDivElement>(null)
  const logContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateLogs = (data: log[]): void => {
      // Ensure dates are new objects
      const newLogs = data.map((log) => ({
        ...log,
        date: new Date(log.date)
      }))
      setLogs(newLogs)
      console.log('New Data', newLogs)
    }

    // Initialize logs
    const initialLogs = logStore.getLogs().map((log) => ({
      ...log,
      date: new Date(log.date)
    }))
    setLogs(initialLogs)

    setTimeout(() => {
      if (logEndRef.current) {
        logEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }, 200)

    logStore.on('update', updateLogs)
    return () => {
      logStore.off('update', updateLogs)
    }
  }, [])

  useEffect(() => {
    if (logEndRef.current) {
      console.log('Handling scroll')
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

  return (
    <div className="pt-5 w-full h-svh flex-col flex max-h-full items-center">
      <h1 className="text-2xl mb-5 border-b-2 w-11/12 text-center pb-5">Console Logs</h1>
      <div ref={logContainerRef} className="w-full p-2 flex flex-col overflow-y-scroll">
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <div key={index} className="">
              <p className={`p-2 ${getBackgroundColor(log.type)} border-t border-zinc-900`}>
                [ {log.date.toLocaleTimeString()} ]{' ' + log.log}
              </p>
            </div>
          ))
        ) : (
          <div className="w-full flex flex-col items-center justify-center">
            <IconLogoLoading iconSize={256} />
            <p className="logo">Loading Logs...</p>
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
