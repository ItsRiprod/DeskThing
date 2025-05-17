import { IconCheckCircle, IconLoading, IconTrash } from '@renderer/assets/icons'
import { useProgressStore } from '@renderer/stores/progressStore'
import { ProgressEvent, ProgressStatus } from '@shared/types'
import React from 'react'
import Button from './Button'

interface LogEntryProps {
  progressEvent: ProgressEvent
  allowClosing?: boolean
  showMetadata?: boolean
}

export const LogEntry: React.FC<LogEntryProps> = ({
  progressEvent,
  showMetadata = false,
  allowClosing = false
}) => {
  const clearProgress = useProgressStore((state) => state.clearProgress)

  return (
    <div
      key={progressEvent.id}
      className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700 group relative"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="h-5 w-5 flex-shrink-0">
          {progressEvent.isLoading ? (
            <IconLoading className="w-full h-full text-blue-500 animate-spin" />
          ) : (
            <IconCheckCircle
              className={`stroke-[3] w-full h-full ${
                progressEvent.status === ProgressStatus.ERROR ? 'text-red-500' : 'text-green-500'
              }`}
            />
          )}
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-zinc-300">{progressEvent.operation}</span>
            <span className="text-xs text-zinc-500">
              {new Date(progressEvent.timestamp || 0).toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-zinc-400">{progressEvent.message}</p>
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
