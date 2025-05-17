// This should __not__ be used. It is gross and a hotfix
import React, { useEffect, useRef, useState } from 'react'
import { ProgressChannel, ProgressStatus } from '@shared/types'
import { useChannelProgress } from '@renderer/hooks/useProgress'

interface ProgressOverlayProps {
  channel: ProgressChannel
  onClose?: () => void
  onError?: () => void
  title?: string
}

/**
 * @deprecated - what are you doing with your life
 * @param param0 
 * @returns 
 */
const ProgressOverlay: React.FC<ProgressOverlayProps> = ({
  channel,
  onClose,
  onError,
  title = 'Progress Status'
}) => {
  const { progress, isLoading } = useChannelProgress(channel)
  const [showProgress, setShowProgress] = useState(false)
  const [operation, setOperation] = useState(title)

  const prevId = useRef<string | null>(null)

  useEffect(() => {
    if (!progress) return

    const isNewMessage = progress && progress.id !== prevId.current

    if (progress.operation && progress.operation !== operation) {
      setOperation(progress.operation)
    }

    if (isNewMessage) {
      if (!showProgress) {
        setShowProgress(true)
      }

      // Update refs
      prevId.current = progress.id || null

      if (isLoading) return
    }

    if (progress.status == ProgressStatus.COMPLETE || progress.status == ProgressStatus.SUCCESS) {
      onClose?.()
    }

    if (progress && progress.status == ProgressStatus.ERROR) {
      onError?.()
    }
  }, [progress, onClose, operation, showProgress])

  return null
}

export default ProgressOverlay
