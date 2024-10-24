import React from 'react'
import useLogStore from '@renderer/stores/logStore'

const LogsWidget: React.FC = () => {
  const logs = useLogStore((state) => state.logList)

  return (
    <div className="h-full relative flex flex-col overflow-hidden">
      <h3 className="text-lg font-semibold mb-2">Logs</h3>
      <div className="overflow-y-auto relative h-full w-full">
        <div className="absolute inset-0 w-full text-wrap break-words">
          {logs.map((log, index) => (
            <div key={index} className="mb-2 text-sm">
              <span className="text-gray-400">{log.date}</span>
              <span className={`ml-2 ${log.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                [{log.type}]
              </span>
              <span className="ml-2 text-white">{log.log}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LogsWidget
