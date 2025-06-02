import { IconX } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import { useSettingsStore } from '@renderer/stores'
import React, { useState } from 'react'
import QRCode from 'react-qr-code'

const WifiPage: React.FC = () => {
  const settings = useSettingsStore((settings) => settings.settings)
  const [ip, setIp] = useState(
    (settings.server_localIp[1] || settings.server_localIp[0]) + ':' + settings.device_devicePort
  )

  const handleIpClick = (index: number): void => {
    if (settings.server_localIp[index]) {
      setIp(settings.server_localIp[index] + ':' + settings.device_devicePort)
    }
  }

  return (
    <div className="w-full h-full overflow-y-auto flex flex-col">
      <h1 className="text-3xl p-8 font-bold mb-6 text-white">WiFi Setup</h1>
      <div className="w-full flex items-center justify-center h-full">
        {settings && settings.server_localIp.length > 1 && (
          <div className="flex flex-col justify-center gap-5 m-5">
            <p className="italic">One of these will work</p>
            {settings.server_localIp.map((localIp, index) => (
              <Button
                key={index}
                className={`${ip.includes(localIp) ? 'font-semibold bg-zinc-800' : 'bg-black'} font-geistMono flex justify-between items-center text-white border-gray-500 hover:bg-gray-500`}
                onClick={() => handleIpClick(index)}
              >
                <p>{localIp + ':' + settings.device_devicePort}</p>
                {settings.server_localIp[index] === ip && <IconX className="text-gray-400" />}
              </Button>
            ))}
          </div>
        )}
        <div className="flex flex-col">
          <div className="flex justify-between mb-2">
            <h2 className="text-xl font-semibold">Scan the QR Code with your phone camera</h2>
          </div>
          <div className="w-full flex justify-center p-2">
            <QRCode value={`http://${ip}`} size={Math.min(window.innerWidth * 0.3, 256)} />
          </div>
          <div className="italic flex gap-2 text-gray-400 font-geistMono">
            <p>Or go to</p>
            <a href={`http://${ip}`} target="_blank" className="underline" rel="noreferrer">
              {ip}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WifiPage
