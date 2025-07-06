import React, { useState } from 'react'
import { useProgressStore } from '@renderer/stores/progressStore'
import { IconArrowRight } from '@renderer/assets/icons'
import { useSearchParams } from 'react-router-dom'
import { LogEntry } from '@renderer/components/LogEntry'

const ViewProgressLogs: React.FC = () => {
  const progressMap = useProgressStore((state) => state.progressMap)
  const [searchParams, setSearchParams] = useSearchParams()
  const [isOpen, setIsOpen] = useState(true)

  const progressEntries = Array.from(progressMap.entries())
    .map(([_, event]) => ({ ...event }))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))

  const onClose = (): void => {
    setIsOpen(false)
    setTimeout(() => {
      searchParams.delete('progress')
      setSearchParams(searchParams)
    }, 200)
  }

  return (
    <div className="fixed inset-y-0 right-0 flex items-center z-50">
      <div
        className={`bg-zinc-900 border border-zinc-800 h-full w-full max-w-2xl overflow-hidden transform transition-transform duration-100 translate-x-0 ${isOpen ? 'animate-slide-in' : 'animate-slide-out'}`}
      >
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-zinc-100 font-semibold">Progress Logs</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 transition-colors">
            <IconArrowRight />
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-4 h-[calc(100vh-4rem)]">
          {progressEntries.map((entry) => (
            <LogEntry
              key={entry.channel}
              progressEvent={entry}
              allowClosing={true}
              showMetadata={true}
            />
          ))}
          {progressEntries.length === 0 && (
            <div className="text-center text-zinc-500 py-8">No progress logs available</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ViewProgressLogs
