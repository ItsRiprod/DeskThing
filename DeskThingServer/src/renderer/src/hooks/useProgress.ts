import { useState, useEffect, useCallback, useMemo } from 'react'
import { ProgressChannel, ProgressEvent } from '@shared/types'

interface ProgressState {
  operation: string
  status: 'running' | 'info' | 'complete' | 'error' | 'success'
  message: string
  progress?: number
  metadata?: Record<string, unknown>
  error?: string
}

export const useProgress = (channel: ProgressChannel): ProgressState => {
  const [progressState, setProgressState] = useState<ProgressState>({
    operation: '',
    status: 'info',
    message: '',
    progress: 0
  })

  const handleProgress = useCallback(
    (event: ProgressEvent) => {
      console.log(`Progress Event on channel ${channel}:`, {
        status: progress.status,
        message: progress.message,
        error: progress.error,
        progress: progress.progress
      })
      if (event.channel === channel) {
        setProgressState({
          operation: event.operation,
          status: event.status,
          message: event.message,
          progress: event.progress,
          metadata: event.metadata,
          error: event.status == 'error' ? event.error : undefined
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
      error: progressState.error
    }
  }, [progressState])

  return progress
}
