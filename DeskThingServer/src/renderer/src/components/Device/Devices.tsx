import { useEffect, useState } from 'react'
import {
  IconCarThing,
  IconDisconnect,
  IconLogoGearLoading,
  IconRefresh,
  IconTransfer,
  IconUpload
} from '../icons'
import DisplayDeviceData from '../Overlays/DisplayDeviceData'

const Device = (): JSX.Element => {
  const [devices, setDevices] = useState<string[]>([])
  const [enabled, setEnabled] = useState(false)
  const [tooltip, setTooltip] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentDevice, setCurrentDevice] = useState('')
  useEffect(() => {
    handlePush()
  }, [enabled])

  const quickLoading = async (): Promise<void> => {
    setLoading(true)
    handlePush()
    setTimeout(async () => {
      setLoading(false)
    }, 1000)
  }

  const handlePush = async (): Promise<void> => {
    try {
      const response = await window.electron.runAdbCommand('devices')
      if (response) {
        console.log(response)
        // Assuming response is a string with device names separated by newline
        const deviceList = response
          .split('\n')
          .filter(
            (line) => line && !line.startsWith('List of devices attached') && line.trim() !== ''
          )
        setDevices(deviceList)
      } else {
        console.log('No devices found!')
        setDevices([])
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
      setDevices([])
    }
  }

  const handleAdbCommand = async (command: string): Promise<string | undefined> => {
    quickLoading()
    try {
      const response = await window.electron.runAdbCommand(command)
      if (response) {
        console.log('Response from adb command:', response)
        return response
      }
      return undefined
    } catch (Error) {
      console.log(Error)
      return undefined
    }
  }

  const handlePushStaged = (): void => {
    try {
      setLoading(true)
      window.electron.ipcRenderer.send('push-staged')
      window.electron.ipcRenderer.once('pushed-staged', (_event, reply) => {
        console.log(reply)
        setLoading(false)
        if (!reply.success) {
          setError(reply.error || 'Unknown error occurred')
        } else {
          // Optionally handle success, e.g., navigate to the extracted app
        }
      })
    } catch (error) {
      setLoading(false)
      if (error) {
        setError(JSON.stringify(error))
      }
    }
  }

  const handleDeviceClick = (device: string): void => {
    quickLoading()
    setCurrentDevice(device)
    setEnabled(true)
  }

  return (
    <div className="pt-5 flex flex-col w-full items-center p-5">
      <div className="flex flex-row items-center justify-between w-full"></div>
      {enabled && <DisplayDeviceData setEnabled={setEnabled} device={currentDevice} />}
      {devices.length > 0 ? (
        devices.map((device, index) => (
          <div
            key={index}
            className="mt-5 items-center flex justify-between px-5 border border-zinc-100 rounded-xl w-full"
          >
            <button onClick={() => handleDeviceClick(device)}>
              {loading ? (
                <div className="py-8 pl-3">
                  <IconLogoGearLoading iconSize={85} />
                </div>
              ) : (
                <IconCarThing
                  iconSize={150}
                  fontSize={100}
                  text={`${device}`}
                  highlighted={[]}
                  highlightColor="yellow"
                  className="hover:text-green-500 transition-colors duration-150"
                />
              )}
            </button>
            <div className="gap-3 flex items-center">
              <p>{tooltip}</p>
              <button
                onClick={handlePushStaged}
                className="border-2 top-10 border-cyan-600 hover:bg-cyan-500  p-2 rounded-lg"
                onMouseEnter={() => setTooltip('Push Staged Webapp')}
                onMouseLeave={() => setTooltip('')}
              >
                <IconUpload iconSize={24} />
              </button>
              <button
                onClick={() => handleAdbCommand(`devices`)}
                className="border-2 top-10 border-cyan-600 hover:bg-cyan-500  p-2 rounded-lg"
                onMouseEnter={() => setTooltip('Reload Chromium')}
                onMouseLeave={() => setTooltip('')}
              >
                <IconRefresh iconSize={24} />
              </button>
              <button
                onClick={() =>
                  handleAdbCommand(`-s ${device.replace('device', '')} reverse tcp:8891 tcp:8891`)
                }
                className="border-2 top-10 border-cyan-600 hover:bg-cyan-500  p-2 rounded-lg"
                onMouseEnter={() => setTooltip('Setup Socket Port')}
                onMouseLeave={() => setTooltip('')}
              >
                <IconTransfer />
              </button>
              <button
                onClick={() => handleAdbCommand(`-s ${device.replace('device', '')} reconnect`)}
                className="border-2 top-10 border-red-600 hover:bg-red-500  p-2 rounded-lg"
                onMouseEnter={() => setTooltip('Reconnect Device')}
                onMouseLeave={() => setTooltip('')}
              >
                <IconDisconnect />
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center w-full">
          {loading ? (
            <div className="">
              <IconLogoGearLoading iconSize={65} />
            </div>
          ) : (
            <button
              className="border-cyan-500 flex gap-3 border p-5 rounded-2xl hover:bg-cyan-600"
              onClick={quickLoading}
            >
              Check For Devices <IconTransfer />
            </button>
          )}

          <p className="mt-5">No devices connected...</p>
        </div>
      )}
    </div>
  )
}

export default Device
