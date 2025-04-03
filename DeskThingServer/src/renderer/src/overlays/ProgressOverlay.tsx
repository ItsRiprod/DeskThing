import React, { useEffect, useRef, useState } from 'react'
import { IconCheckCircle, IconLoading } from '@renderer/assets/icons'
import { ProgressChannel, ProgressStatus } from '@shared/types'
import { useChannelProgress } from '@renderer/hooks/useProgress'

interface ProgressOverlayProps {
  channel: ProgressChannel
  onClose?: () => void
  onError?: () => void
  title?: string
}

const ProgressOverlay: React.FC<ProgressOverlayProps> = ({
  channel,
  onClose,
  onError,
  title = 'Progress Status'
}) => {
  const { progress, isLoading } = useChannelProgress(channel)
  const [showProgress, setShowProgress] = useState(false)
  const [fadeTimeout, setFadeTimeout] = useState<NodeJS.Timeout | null>(null)
  const [operation, setOperation] = useState(title)

  const prevId = useRef<string | null>(null)

  const handleFadeOut = (): void => {
    setShowProgress(false)
    if (fadeTimeout) clearTimeout(fadeTimeout)
  }

  useEffect(() => {
    if (!progress) return

    const isNewMessage = progress && progress.id !== prevId.current

    if (progress.operation) {
      setOperation(progress.operation)
    }

    if (isNewMessage) {
      setShowProgress(true)

      // Update refs
      prevId.current = progress.id || null

      // Clear existing timeout
      if (fadeTimeout) clearTimeout(fadeTimeout)

      if (isLoading) return

      // Set new timeout
      const timeout = setTimeout(() => {
        setShowProgress(false)
      }, 5000)
      setFadeTimeout(timeout)
    }

    if (progress.status == ProgressStatus.COMPLETE || progress.status == ProgressStatus.SUCCESS) {
      onClose?.()
    }

    if (progress && progress.status == ProgressStatus.ERROR) {
      onError?.()
    }

    return () => {
      if (fadeTimeout) clearTimeout(fadeTimeout)
    }
  }, [progress, onClose, fadeTimeout])

  if (!progress || !progress.message || !showProgress) return null

  return (
    <div className="fixed flex flex-col-reverse bottom-4 right-4 z-50 items-end justify-center gap-2">
      <div
        className={`animate-fade-in-down bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl flex gap-4 max-w-md w-full backdrop-blur-sm cursor-pointer active:scale-95 transition-transform`}
        onClick={handleFadeOut}
      >
        <div className="h-12 w-12 flex-shrink-0">
          {isLoading ? (
            <IconLoading className="w-full h-full text-blue-500 animate-spin" />
          ) : (
            <IconCheckCircle className="stroke-[3] w-full h-full text-green-500" />
          )}
        </div>
        <div className="flex-grow">
          <div
            className={progress.status == ProgressStatus.ERROR ? 'text-red-500' : 'text-green-500'}
          >
            <h2 className="text-lg font-medium">{operation}</h2>
            {progress.status == ProgressStatus.ERROR && (
              <p className="text-sm font-medium">Error</p>
            )}
          </div>
          <p className="mt-2 font-geistMono text-zinc-300 text-sm">{progress.message}</p>
          {progress.error && (
            <p className="mt-2 text-red-500 text-sm font-medium">{progress.error}</p>
          )}
          <div className="mt-3 w-full bg-zinc-800 rounded-full h-1.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progress.status == ProgressStatus.ERROR
                  ? 'bg-red-500'
                  : progress.status == ProgressStatus.COMPLETE ||
                      progress.status == ProgressStatus.SUCCESS
                    ? 'bg-green-500'
                    : 'bg-blue-500'
              }`}
              style={{
                width: `${progress.progress ?? 0}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgressOverlay
