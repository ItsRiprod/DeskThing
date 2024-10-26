import React, { useEffect } from 'react'
import { LoggingData } from '@shared/types/ipcTypes'
import { IconCheckCircle, IconLoading } from '@renderer/assets/icons'

interface DownloadNotificationProps {
  loggingData: LoggingData | null
  onClose: () => void
  title?: string
}

const DownloadNotification: React.FC<DownloadNotificationProps> = ({
  loggingData,
  onClose,
  title = 'Loading App...'
}) => {
  useEffect(() => {
    if (loggingData) {
      if (loggingData.final) {
        setTimeout(onClose, 3000)
      }
    }
    console.log(loggingData)
  }, [loggingData, onClose])

  if (!loggingData) return null

  return (
    <div className="fixed gap-2 bottom-5 right-5 bg-black p-5 flex text-white rounded-md shadow-md z-50">
      <div className="h-full w-24">
        {loggingData.final ? (
          <IconCheckCircle className="stroke-[3] w-full h-full" />
        ) : (
          <IconLoading className="w-full h-full" />
        )}
      </div>
      <div className="w-full">
        <div className={loggingData.status ? 'text-green-600' : 'text-red-600'}>
          <p className="text-2xl text-nowrap">{title}</p>
          <p>{!loggingData.status && 'Error'}</p>
        </div>
        <p className="mt-2 font-geistMono">
          {typeof loggingData.data === 'string'
            ? loggingData.data
            : JSON.stringify(loggingData.data)}
        </p>
        {loggingData.error && <p className="mt-2 text-red-600">{loggingData.error}</p>}
      </div>
    </div>
  )
}

export default DownloadNotification
