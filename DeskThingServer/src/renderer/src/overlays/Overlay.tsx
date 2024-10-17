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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={overlayRef} className={`bg-black rounded-lg w-fit p-6 ${className}`}>
        {children}
      </div>
    </div>
  )
}

export default Overlay
