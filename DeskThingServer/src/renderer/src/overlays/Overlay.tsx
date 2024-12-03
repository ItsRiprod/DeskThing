import { IconX } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import React, { useRef, useEffect } from 'react'

interface DownloadConfirmationProps {
  onClose: () => void
  className?: string
  children: React.ReactNode
}

const Overlay: React.FC<DownloadConfirmationProps> = ({ onClose, className, children }) => {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  return (
    <div className="fixed animate-fade inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={overlayRef} className={`relative bg-black rounded-lg ${className}`}>
        <Button
          className="first:absolute top-2 right-2 w-fit h-fit hover:bg-black bg-zinc-900"
          onClick={onClose}
        >
          <IconX />
        </Button>
        {children}
      </div>
    </div>
  )
}

export default Overlay
