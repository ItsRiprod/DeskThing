import { IconX } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import { useSettingsStore } from '@renderer/stores'
import React, { useRef, useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { useSearchParams } from 'react-router-dom'
import Overlay from './Overlay'


const QROverlay: React.FC = () => {
  const settings = useSettingsStore((settings) => settings.settings)
  const [ip, setIp] = useState(settings.localIp[0] + ':' + settings.devicePort)
  const [searchParams, setSearchParams] = useSearchParams()


  const handleIpClick = (index: number): void => {
    if (settings.localIp[index]) {
      setIp(settings.localIp[index] + ':' + settings.devicePort)
    }
  }

  const onClose = (): void => {
    searchParams.delete('qr')
    setSearchParams(searchParams)
  }

  return (
    <Overlay onClose={onClose}>
      <div className="flex flex-col md:flex-row">
        <div className="flex flex-col">
          <div className="flex justify-between mb-2">
            <h2 className="text-xl font-semibold">QR Code</h2>
          </div>
          <div className=" w-full max-w-2xl flex justify-center p-2 border rounded-2xl">
            <QRCode value={`http://${ip}/client`} size={256} />
          </div>
          <p className="italic text-gray-400 font-geistMono">{ip + '/client'}</p>
        </div>
        <div className="flex flex-col justify-center gap-5 m-5">
          <p className="italic">One of these will work</p>
          {settings &&
            settings.localIp.map((localIp, index) => (
              <Button
                key={index}
                className={`${ip.includes(localIp) ? 'font-semibold bg-gray-900' : 'bg-black'} font-geistMono flex justify-between items-center text-white border-gray-500 hover:bg-gray-500`}
                onClick={() => handleIpClick(index)}
              >
                <p>{localIp + ':' + settings.devicePort}</p>
                {settings.localIp[index] === ip && <IconX className="text-gray-400" />}
              </Button>
            ))}
        </div>
      </div>
    </Overlay>
  )
}

export default QROverlay
