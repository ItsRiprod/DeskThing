import React, { useEffect, useRef, useState } from 'react'
import { IconCheckCircle, IconLoading } from '@renderer/assets/icons'
import { ProgressStatus } from '@shared/types'
import { useProgressStore } from '@renderer/stores/progressStore'
import { useSearchParams } from 'react-router-dom'

const ProgressPopup: React.FC = () => {
  const progress = useProgressStore((state) => state.currentProgressEvent)
  const [showProgress, setShowProgress] = useState(false)
  const [fadeTimeout, setFadeTimeout] = useState<NodeJS.Timeout | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const prevId = useRef<string | null>(null)

  const handleFadeOut = (): void => {
    setShowProgress(false)

    searchParams.append('progress', 'true')

    setSearchParams(searchParams)

    if (fadeTimeout) clearTimeout(fadeTimeout)
  }

  useEffect(() => {
    if (!progress) return

    const isNewMessage = progress && progress.id !== prevId.current

    if (isNewMessage) {
      setShowProgress(true)

      // Update refs
      prevId.current = progress.id || null

      // Clear existing timeout
      if (fadeTimeout) clearTimeout(fadeTimeout)

      if (progress.isLoading) return

      // Set new timeout
      const timeout = setTimeout(() => {
        setShowProgress(false)
      }, 5000)
      setFadeTimeout(timeout)
    }

    return () => {
      if (fadeTimeout) clearTimeout(fadeTimeout)
    }
  }, [progress, fadeTimeout])

  if (!progress || !progress.message || !showProgress) return null

  return (
    <div className="fixed flex flex-col-reverse bottom-0 right-0 z-50 items-end justify-center gap-2">
      <div
        className={`animate-pop-in bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-tl-lg shadow-2xl items-center flex flex-col gap-4 w-full backdrop-blur-sm cursor-pointer active:scale-95 transition-transform`}
        onClick={handleFadeOut}
      >
        <div className="flex items-center gap-4">
          <div className="h-6 w-6 flex-shrink-0">
            {progress.isLoading ? (
              <IconLoading className="w-full h-full text-blue-500 animate-spin" />
            ) : (
              <IconCheckCircle className="stroke-[3] w-full h-full text-green-500" />
            )}
          </div>
          <div className="flex-grow">
            <div
              className={
                progress.status == ProgressStatus.ERROR ? 'text-red-500' : 'text-green-500'
              }
            ></div>
            <p className="font-geistMono text-zinc-300 text-sm text-nowrap">{progress.message}</p>
            {progress.error && <p className="text-red-500 text-sm font-medium">{progress.error}</p>}
          </div>
        </div>
        <div className=" w-full bg-zinc-800 rounded-full h-1.5">
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
  )
}

export default ProgressPopup
