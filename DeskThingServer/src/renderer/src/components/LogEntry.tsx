import { IconCheckCircle, IconLoading, IconTrash } from '@renderer/assets/icons'
import { useProgressStore } from '@renderer/stores/progressStore'
import { ProgressEvent, ProgressStatus } from '@shared/types'
import React, { useState } from 'react'
import Button from './buttons/Button'

interface LogEntryProps {
  progressEvent: ProgressEvent
  allowClosing?: boolean
  showMetadata?: boolean
  allowExpanding?: boolean
  className?: string
}

export const LogEntry: React.FC<LogEntryProps> = ({
  progressEvent,
  showMetadata = false,
  allowClosing = false,
  allowExpanding = false,
  className
}) => {
  const clearProgress = useProgressStore((state) => state.clearProgress)
  const pastEvents = useProgressStore((state) => state.pastEvents)
  const pastMessages = pastEvents.get(progressEvent.channel)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleExpand = (): void => {
    setIsExpanded((prev) => !prev)
  }

  return (
    <div
      className={`bg-zinc-800/50 transition-[height] flex flex-col rounded-lg p-4 border border-zinc-700 group relative ${className}`}
    >
      <button
        key={progressEvent.id}
        onClick={handleExpand}
        disabled={!allowClosing && !allowExpanding}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="h-5 w-5 flex-shrink-0">
            {progressEvent.isLoading ? (
              <IconLoading
                className={`w-full h-full ${
                  progressEvent.status === ProgressStatus.ERROR
                    ? 'text-red-500'
                    : progressEvent.status === ProgressStatus.WARN
                      ? 'text-orange-500'
                      : 'text-blue-500'
                } animate-spin`}
              />
            ) : (
              <IconCheckCircle
                className={`stroke-[3] w-full h-full ${
                  progressEvent.status === ProgressStatus.ERROR
                    ? 'text-red-500'
                    : progressEvent.status === ProgressStatus.WARN
                      ? 'text-orange-500'
                      : 'text-green-500'
                }`}
              />
            )}
          </div>
          <div className="flex-grow">
            <div className="flex justify-between gap-2 items-center">
              <span className="text-sm font-medium text-zinc-300">{progressEvent.operation}</span>
              <span className="text-xs text-zinc-500">
                {new Date(progressEvent.timestamp || 0).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm justify-self-start text-zinc-400">{progressEvent.message}</p>
            {progressEvent.error && (
              <p className="text-sm text-red-500 mt-1">{progressEvent.error}</p>
            )}
          </div>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-1.5">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              progressEvent.status === ProgressStatus.ERROR
                ? 'bg-red-500'
                : progressEvent.status === ProgressStatus.WARN
                  ? 'bg-orange-500'
                  : progressEvent.status === ProgressStatus.COMPLETE ||
                      progressEvent.status === ProgressStatus.SUCCESS
                    ? 'bg-green-500'
                    : 'bg-blue-500'
            }`}
            style={{
              width: `${progressEvent.progress ?? 0}%`
            }}
          />
        </div>
        {showMetadata && progressEvent.metadata && (
          <div className="mt-2 text-xs text-zinc-500">
            <pre className="overflow-x-auto">{JSON.stringify(progressEvent.metadata, null, 2)}</pre>
          </div>
        )}
        {isExpanded && (
          <div className="animate-slide-in flex flex-col-reverse justify-start items-start mt-2 text-xs text-zinc-500">
            {pastMessages?.map((event, index) => (
              <p
                className={`break-words text-wrap ${
                  event.status === ProgressStatus.ERROR
                    ? 'text-red-400'
                    : event.status === ProgressStatus.WARN
                      ? 'text-yellow-400'
                      : event.status === ProgressStatus.SUCCESS ||
                          event.status === ProgressStatus.COMPLETE
                        ? 'text-green-400'
                        : 'text-zinc-500'
                }`}
                key={index}
              >
                {`[${new Date(event.timestamp || 0).toLocaleTimeString()}] `}
                {`(${event.progress?.toFixed(2) || 0}%) `}
                {`${event.operation}: `}
                {event.message}
                {event.error && ` - Error: ${event.error}`}
              </p>
            ))}
          </div>
        )}
      </button>
      {allowClosing && (
        <div className="absolute top-0 right-0 h-full">
          <Button
            onClick={() => clearProgress(progressEvent.channel)}
            className="h-full items-center justify-center w-24 p-2 text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity group-hover:bg-gradient-to-l group-hover:from-red-500/20 group-hover:to-transparent"
          >
            <IconTrash />
          </Button>
        </div>
      )}
    </div>
  )
}
