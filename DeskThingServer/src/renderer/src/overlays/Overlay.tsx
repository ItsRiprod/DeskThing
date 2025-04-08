import { IconX } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import ErrorBoundary from '@renderer/components/ErrorBoundary'
import FeedbackButton from '@renderer/components/FeedbackButton'
import React, { useRef, useEffect, useState, useMemo } from 'react'

interface DownloadConfirmationProps {
  onClose: () => void
  className?: string
  showFeedbackButton?: boolean
  children: React.ReactNode
}

const Overlay: React.FC<DownloadConfirmationProps> = ({
  onClose,
  className,
  children,
  showFeedbackButton = true
}) => {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = (): void => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 200)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        handleClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleClose])

  const memoChildren = useMemo(() => children, [children])

  return (
    <div
      className={`fixed ${isClosing ? 'animate-fade-out' : 'animate-fade'} inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`}
    >
      <div ref={overlayRef} className={`relative bg-black rounded-lg ${className}`}>
        <div className="first:absolute top-2 right-2 w-fit h-fit flex">
          {showFeedbackButton && (
            <FeedbackButton
              onClick={handleClose}
              className={'hover:bg-black bg-zinc-900'}
              showText={false}
            />
          )}
          <Button title="Close Window" className="hover:bg-black bg-zinc-900" onClick={handleClose}>
            <IconX />
          </Button>
        </div>
        <ErrorBoundary>{memoChildren}</ErrorBoundary>
      </div>
    </div>
  )
}

export default Overlay
