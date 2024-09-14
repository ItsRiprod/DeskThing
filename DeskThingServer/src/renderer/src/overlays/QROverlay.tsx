import { IconX } from '@renderer/assets/icons'
import React from 'react'
import QRCode from 'react-qr-code'

interface QROverlayProps {
  ip: string
  onClose: () => void
}

const QROverlay: React.FC<QROverlayProps> = ({ ip, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="flex flex-col w-5/6 min-w-fit max-w-96 gap-2 bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between mb-2">
          <h2 className="text-xl font-semibold">QR Code</h2>
          <button
            onClick={onClose}
            className="text-gray-500 border-red-500 p-2 hover:bg-red-500 border rounded-lg hover:text-gray-300"
          >
            <IconX />
          </button>
        </div>
        <div className=" w-full max-w-2xl flex justify-center">
          <QRCode value={`http://${ip}/client`} size={256} />
        </div>
        <p className="italic text-gray-400">{ip + '/client'}</p>
      </div>
    </div>
  )
}

export default QROverlay
