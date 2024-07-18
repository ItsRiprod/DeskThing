import { useState, useEffect } from 'react'
import {
  IconCarThing,
  IconDisconnect,
  IconLogoGearLoading,
  IconPlay,
  IconPower,
  IconRefresh,
  IconX
} from '../icons'

export interface DeviceData {
  [key: string]: string
}

interface DisplayDeviceDataProps {
  setEnabled: (boolean) => void
  device: string
}

const DisplayDeviceData = ({ setEnabled, device }: DisplayDeviceDataProps): JSX.Element => {
  const [commands, setCommands] = useState<{ [key: string]: string }>({})
  const [types, setType] = useState<{ [key: string]: string }>({})
  const [deviceData, setDeviceData] = useState<DeviceData>({})
  const [tooltip, setTooltip] = useState('')
  const [weToolTip, setWStooltip] = useState('')

  useEffect(() => {
    const handleDeviceData = (_event: Electron.IpcRendererEvent, data: DeviceData): void => {
      setDeviceData(data)
    }
    window.electron.runDeviceCommand('post', '{"type":"action","action":"version_request"}')
    // Set up listener for 'app-data' event
    const removeListener = window.electron.ipcRenderer.once('version-status', handleDeviceData)

    return () => {
      removeListener()
    }
  }, [])

  const handleCommandChange = (device: string, command: string): void => {
    setCommands((prevCommands) => ({
      ...prevCommands,
      [device]: command
    }))
  }
  const handleTypeChange = (device: string, type: string): void => {
    setType((prevCommands) => ({
      ...prevCommands,
      [device]: type
    }))
  }

  const handleSendCommand = async (device: string): Promise<void> => {
    const command = commands[device]
    const type = types[device]
    if (command) {
      await window.electron.runDeviceCommand(type, command)
    }
  }

  const handleRestart = async (): Promise<void> => {
    await window.electron.runDeviceCommand('post', '{"type":"device","action":"reboot"}')
    handleExit()
  }
  const handlePowerOff = async (): Promise<void> => {
    await window.electron.runDeviceCommand('post', '{"type":"device","action":"reboot"}')
    handleExit()
  }
  const handleDisconnect = async (): Promise<void | undefined> => {
    try {
      window.electron.runAdbCommand(`-s ${device.replace('device', '')} reconnect`)
    } catch (Error) {
      console.log(Error)
      return undefined
    }
  }

  const handleExit = (): void => {
    setEnabled(false)
  }
  return (
    <>
      {deviceData != null ? (
        <div className="pointer-events-auto fixed items-center w-screen flex top-0 justify-around left-0 h-screen z-10">
          <div className="bg-zinc-900 animate-fade p-5 w-11/12 rounded-lg max-h-[90vh] overflow-auto drop-shadow-lg flex flex-col">
            <h1 className="shadow-lg flex m-5 bg-zinc-700 p-3 rounded-xl">{device}</h1>
            <div className="flex items-center flex-col p-5">
              <div className="flex items-center gap-5">
                <IconCarThing
                  iconSize={250}
                  fontSize={100}
                  text={`${device}`}
                  highlighted={[]}
                  highlightColor="yellow"
                />
                {deviceData ? (
                  <div className="text-justify">
                    <p>
                      Version: <i>{deviceData?.app_version}</i>
                    </p>
                    <p>
                      Model Name: <i>{deviceData?.model_name}</i>
                    </p>
                    <p>
                      OS version: <i>{deviceData?.os_version}</i>
                    </p>
                    <p>
                      Serial: <i>{deviceData?.serial}</i>
                    </p>
                  </div>
                ) : (
                  <IconLogoGearLoading iconSize={100} />
                )}
              </div>
              <p className="fixed">{tooltip}</p>
              <div className="flex gap-5">
                <button
                  className="border-2 top-10 border-red-600 hover:bg-red-500 p-2 rounded-lg"
                  onClick={() => handleRestart()}
                  onMouseEnter={() => setTooltip('Restart Device')}
                  onMouseLeave={() => setTooltip('')}
                >
                  <IconRefresh iconSize={24} />
                </button>
                <button
                  className="border-2 top-10 border-red-600 hover:bg-red-500  p-2 rounded-lg"
                  onClick={() => handlePowerOff()}
                  onMouseEnter={() => setTooltip('Power Off Device')}
                  onMouseLeave={() => setTooltip('')}
                >
                  <IconPower iconSize={24} />
                </button>
                <button
                  className="border-2 top-10 border-red-600 hover:bg-red-500  p-2 rounded-lg"
                  onClick={() => handleDisconnect()}
                  onMouseEnter={() => setTooltip('Disconnect Device')}
                  onMouseLeave={() => setTooltip('')}
                >
                  <IconDisconnect iconSize={24} />
                </button>
              </div>
            </div>
            <div className="bg-zinc-700 p-5 m-1 flex justify-between items-center rounded-lg drop-shadow-lg">
              <button
                className="border hover:bg-red-500 border-red-500 transition-colors p-5 rounded-lg drop-shadow-lg"
                onClick={handleExit}
              >
                <IconX iconSize={25} />
              </button>
              <div className="flex flex-col gap-1 justify-end items-end">
                <div>
                  <input
                    type="text"
                    placeholder="Enter type"
                    value={types[device] || ''}
                    onChange={(e) => handleTypeChange(device, e.target.value)}
                    className="border-2 border-gray-300 p-2 rounded-lg text-black"
                  />

                  <input
                    type="text"
                    placeholder="Enter command"
                    value={commands[device] || ''}
                    onChange={(e) => handleCommandChange(device, e.target.value)}
                    className="border-2 border-gray-300 p-2 rounded-lg text-black"
                  />
                </div>
                <div className="flex items-center">
                  {weToolTip ? (
                    <p className="relative">{weToolTip}</p>
                  ) : (
                    <p className="relative text-zinc-500">
                      <i>Warning: Advanced use only. May cause damage.</i>
                    </p>
                  )}
                  <button
                    onClick={() => handleSendCommand(device)}
                    className="border-2 border-cyan-600 hover:bg-cyan-500 p-2 rounded-lg"
                    onMouseEnter={() => setWStooltip('Send WS Command')}
                    onMouseLeave={() => setWStooltip('')}
                  >
                    <IconPlay iconSize={24} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  )
}

export default DisplayDeviceData
