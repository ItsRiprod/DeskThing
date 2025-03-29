import { useState, useEffect, useCallback, useMemo } from 'react'
import { ProgressChannel, ProgressEvent, ProgressStatus } from '@shared/types'

interface ProgressState {
  operation: string
  status: ProgressStatus
  message: string
  progress?: number
  metadata?: Record<string, unknown>
  id: string
  error?: string
}

export const useProgress = (channel: ProgressChannel | ProgressChannel[]): ProgressState => {
  const [progressState, setProgressState] = useState<ProgressState>({
    operation: '',
    status: ProgressStatus.INFO,
    message: '',
    id: '',
    progress: 0
  })

  const handleProgress = useCallback(
    (event: ProgressEvent) => {
      console.log(`Progress Event on channel ${event.channel}:`, event)
      if (Array.isArray(channel) ? channel.includes(event.channel) : event.channel === channel) {
        setProgressState({
          operation: event.operation,
          status: event.status,
          message: event.message,
          id: Math.random().toString(24),
          progress: event.progress,
          metadata: event.metadata,
          error: event.status == ProgressStatus.ERROR ? event.error : undefined
        })
      }
    },
    [channel]
  )

  useEffect(() => {
    const unsubscribe = window.electron.onProgress(handleProgress)
    return () => {
      unsubscribe()
    }
  }, [handleProgress])

  const progress = useMemo(() => {
    return {
      operation: progressState.operation,
      status: progressState.status,
      message: progressState.message,
      progress: progressState.progress,
      metadata: progressState.metadata,
      error: progressState.error,
      id: progressState.id
    }
  }, [progressState])

  return progress
}
