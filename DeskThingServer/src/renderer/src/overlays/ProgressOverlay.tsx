import React, { useEffect, useState } from 'react'
import { useProgress } from '@renderer/hooks/useProgress'
import { IconCheckCircle, IconLoading } from '@renderer/assets/icons'
import { ProgressChannel } from '@shared/types'

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
  const progress = useProgress(channel)
  const [showProgress, setShowProgress] = useState(false)
  const [fadeTimeout, setFadeTimeout] = useState<NodeJS.Timeout | null>(null)
  const [operation, setOperation] = useState(title)

  useEffect(() => {
    if (progress.message) {
      setShowProgress(true)
      if (fadeTimeout) clearTimeout(fadeTimeout)
      const timeout = setTimeout(() => {
        setShowProgress(false)
      }, 5000)
      setFadeTimeout(timeout)
    }

    if (progress.operation) {
      setOperation(progress.operation)
    }

    if (progress.status === 'complete' || progress.status === 'success') {
      onClose?.()
    }

    if (progress.status === 'error') {
      onError?.()
    }

    return () => {
      if (fadeTimeout) clearTimeout(fadeTimeout)
    }
  }, [progress, onClose])

  if (!progress.message || !showProgress) return null

  return (
    <div className="fixed flex bottom-4 right-4 z-50 items-center justify-center">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl flex gap-4 max-w-md w-full backdrop-blur-sm">
        <div className="h-12 w-12 flex-shrink-0">
          {progress.status === 'complete' || progress.status === 'success' ? (
            <IconCheckCircle className="stroke-[3] w-full h-full text-green-500" />
          ) : (
            <IconLoading className="w-full h-full text-blue-500 animate-spin" />
          )}
        </div>
        <div className="flex-grow">
          <div className={progress.status === 'error' ? 'text-red-500' : 'text-green-500'}>
            <h2 className="text-lg font-medium">{operation}</h2>
            {progress.status === 'error' && <p className="text-sm font-medium">Error</p>}
          </div>
          <p className="mt-2 font-geistMono text-zinc-300 text-sm">{progress.message}</p>
          {progress.error && (
            <p className="mt-2 text-red-500 text-sm font-medium">{progress.error}</p>
          )}
          <div className="mt-3 w-full bg-zinc-800 rounded-full h-1.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progress.status === 'error'
                  ? 'bg-red-500'
                  : progress.status === 'complete' || progress.status === 'success'
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
