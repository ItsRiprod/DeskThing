import { useState, useEffect } from 'react'
import {
  IconCarThing,
  IconDisconnect,
  IconLightbulbOff,
  IconLightbulbOn,
  IconLogoGearLoading,
  IconPlay,
  IconPower,
  IconRefresh,
  IconReload,
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
  const [supervisorData, setSupervisorData] = useState<{ [key: string]: string }>({})
  const [tooltip, setTooltip] = useState('')
  const [weToolTip, setWStooltip] = useState('')
  const [loading, setIsLoading] = useState(false)

  const getSupervisorData = async (): Promise<void> => {
    const supervisorResponse = await window.electron.runAdbCommand(
      'shell supervisorctl status backlight chromium'
    )
    console.log('Raw adb response (supervisorctl):', supervisorResponse)
    if (supervisorResponse) {
      const supervisorLines = supervisorResponse.trim().split('\n')
      const parsedData: { [key: string]: string } = {}
      supervisorLines.forEach((line) => {
        const [name, status] = line.split(/\s+/)
        if (name && status) {
          parsedData[name] = status
        }
      })
      setIsLoading(false)
      setSupervisorData(parsedData)
    } else {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const getDeviceData = async (): Promise<void> => {
      try {
        // Get version info
        const versionResponse = await window.electron.runAdbCommand(
          'shell cat /etc/superbird/version'
        )
        console.log('Raw adb response (version):', versionResponse)
        if (versionResponse) {
          const versionMatch = versionResponse.match(/SHORT_VERSION\s+(\S+)/)
          if (versionMatch) {
            const shortVersion = versionMatch[1].trim()
            setDeviceData((prevData) => ({
              ...prevData,
              app_version: shortVersion
            }))
          } else {
            console.error('SHORT_VERSION not found in adb response')
          }
        }

        // Get USID info
        const usidResponse = await window.electron.runAdbCommand('shell cat /sys/class/efuse/usid')
        console.log('Raw adb response (usid):', usidResponse)
        // Set USID data
        if (usidResponse) {
          setDeviceData((prevData) => ({
            ...prevData,
            usid: usidResponse.trim()
          }))
        }

        // Get MAC BT info
        const macBtResponse = await window.electron.runAdbCommand(
          'shell cat /sys/class/efuse/mac_bt'
        )
        console.log('Raw adb response (mac_bt):', macBtResponse)

        // Format MAC BT data
        if (macBtResponse) {
          const macBtFormatted = macBtResponse
            .split('\n')
            .map((line) => line.trim())
            .join(' ')
          setDeviceData((prevData) => ({
            ...prevData,
            mac_bt: macBtFormatted
          }))
        }

        // Get supervisorctl info
        getSupervisorData()
      } catch (error) {
        console.error('Error retrieving device data:', error)
      }
    }

    getDeviceData()
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
      if (type == 'adb') {
        const response = await window.electron.runAdbCommand(command)
        console.log(response)
        handleLogging()
      } else {
        await window.electron.runDeviceCommand(type, command)
        handleLogging()
      }
    }
  }

  const handleLogging = async (): Promise<void> => {
    setIsLoading(true)
    const unsubscribe = window.electron.ipcRenderer.on('logging', (_event, reply) => {
      console.log(reply)
      if (reply.final) {
        unsubscribe()
        getSupervisorData()
      } else {
        setIsLoading(true)
      }
      if (!reply.status) {
        setTooltip(reply.error || 'Unknown error occurred')
        unsubscribe()
        setIsLoading(false)
      } else {
        if (reply.data) {
          setTooltip(reply.data)
        }
      }
    })
  }

  const handleRestart = async (): Promise<void> => {
    await window.electron.runAdbCommand('shell reboot')
    handleLogging()
    handleExit()
  }
  const handlePowerOff = async (): Promise<void> => {
    await window.electron.runDeviceCommand('post', '{"type":"device","action":"reboot"}')
    handleLogging()
    handleExit()
  }
  const handleAdbCommand = async (command: string): Promise<void | undefined> => {
    try {
      window.electron.runAdbCommand((deviceData?.usid ? `-s ${deviceData?.usid} ` : '') + command)
      handleLogging()
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
                  text={`${device.replace('device', '')}`}
                  highlighted={[]}
                  highlightColor="yellow"
                />
                {deviceData ? (
                  <div className="text-justify">
                    <p>
                      Version: <i>{deviceData?.app_version}</i>
                    </p>
                    <p>
                      USID: <i>{deviceData?.usid}</i>
                    </p>
                    <p>
                      MAC BT: <i>{deviceData?.mac_bt}</i>
                    </p>
                  </div>
                ) : (
                  <IconLogoGearLoading iconSize={100} />
                )}
              </div>
              <p className="fixed">{tooltip}</p>
              <div className="flex gap-5">
                <button
                  onClick={() => handleAdbCommand(`shell supervisorctl restart chromium`)}
                  className="border-2 top-10 border-cyan-600 hover:bg-cyan-500  p-2 rounded-lg"
                  onMouseEnter={() => setTooltip('Reload Chromium')}
                  onMouseLeave={() => setTooltip('')}
                  disabled={loading}
                >
                  {loading ? <IconLogoGearLoading iconSize={24} /> : <IconRefresh iconSize={24} />}
                </button>
                <button
                  className="border-2 top-10 border-red-600 hover:bg-red-500 p-2 rounded-lg"
                  onClick={() => handleRestart()}
                  onMouseEnter={() => setTooltip('Restart Device')}
                  onMouseLeave={() => setTooltip('')}
                  disabled={loading}
                >
                  {loading ? <IconLogoGearLoading iconSize={24} /> : <IconReload iconSize={24} />}
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
                  onClick={() => handleAdbCommand(`reconnect`)}
                  onMouseEnter={() => setTooltip('Disconnect Device')}
                  onMouseLeave={() => setTooltip('')}
                >
                  <IconDisconnect iconSize={24} />
                </button>
                {supervisorData.backlight === 'RUNNING' ? (
                  <button
                    className="border-2 top-10 border-red-600 hover:bg-red-500  p-2 rounded-lg"
                    onClick={() => handleAdbCommand(`shell supervisorctl stop backlight`)}
                    onMouseEnter={() => setTooltip('Disable Ambient Updates')}
                    onMouseLeave={() => setTooltip('')}
                    disabled={loading}
                  >
                    {loading ? (
                      <IconLogoGearLoading iconSize={24} />
                    ) : (
                      <IconLightbulbOff iconSize={24} />
                    )}
                  </button>
                ) : (
                  <button
                    className="border-2 top-10 border-green-600 hover:bg-green-500  p-2 rounded-lg"
                    onClick={() => handleAdbCommand(`shell supervisorctl start backlight`)}
                    onMouseEnter={() => setTooltip('Enable Ambient Updates')}
                    onMouseLeave={() => setTooltip('')}
                    disabled={loading}
                  >
                    {loading ? (
                      <IconLogoGearLoading iconSize={24} />
                    ) : (
                      <IconLightbulbOn iconSize={24} />
                    )}
                  </button>
                )}
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
                    onMouseEnter={() =>
                      setWStooltip(types[device] == 'adb' ? 'Send ADB Command' : 'Send WS Command')
                    }
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
