import { useState, useEffect, useRef } from 'react'
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
  IconUpload,
  IconX
} from '../assets/icons'

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
  const [brightness, setBrightness] = useState(245)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null) // Ref to store debounce timeout

  const getSupervisorData = async (): Promise<void> => {
    const supervisorResponse = await window.electron.runAdbCommand(
      `-s ${device.replace('device', '').trim()} shell supervisorctl status backlight chromium setupProxy`
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
          `-s ${device.replace('device', '').trim()} shell cat /etc/superbird/version`
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
        const usidResponse = await window.electron.runAdbCommand(
          `-s ${device.replace('device', '').trim()} shell cat /sys/class/efuse/usid`
        )
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
          `-s ${device.replace('device', '').trim()} shell cat /sys/class/efuse/mac_bt`
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
          console.log(reply.data)
          setTooltip(reply.data)
        }
      }
    })
  }

  const handleBrightnessChange = (value: number): void => {
    setBrightness(value)

    // Clear the previous timeout if the brightness changes again
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    const transformedValue = Math.round(245 - (value * (245 - 1)) / 100)

    // Set a new debounce timeout to delay the command execution
    debounceTimeout.current = setTimeout(async () => {
      try {
        await window.electron.runAdbCommand(
          `-s ${device.replace('device', '').trim()} shell echo ${transformedValue} > /sys/devices/platform/backlight/backlight/aml-bl/brightness`
        )
        handleLogging()
      } catch (error) {
        console.error('Error setting brightness:', error)
      }
    }, 300) // 1-second debounce delay
  }

  const handleRestart = async (): Promise<void> => {
    await window.electron.runAdbCommand(`-s ${device.replace('device', '').trim()} shell reboot`)
    handleLogging()
    handleExit()
  }
  const handlePushProxy = async (): Promise<void> => {
    window.electron.ipcRenderer.send('push-proxy-script', device.replace('device', '').trim())
    handleLogging()
  }
  const handlePowerOff = async (): Promise<void> => {
    await window.electron.runDeviceCommand('post', '{"type":"device","action":"reboot"}')
    handleLogging()
    handleExit()
  }
  const handleAdbCommand = async (command: string): Promise<void | undefined> => {
    try {
      window.electron.runAdbCommand(
        (device ? `-s ${device.replace('device', '').trim()} ` : '') + command
      )
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 animate-fade p-5 w-11/12 rounded-lg max-h-[90vh] overflow-auto drop-shadow-lg flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">{device}</h2>
              <button
                onClick={handleExit}
                className="text-gray-400 border-red-600 border p-2 rounded-lg hover:text-white hover:bg-red-500 focus:outline-none"
              >
                <IconX />
              </button>
            </div>
            <div className="flex items-center flex-col p-5">
              <div className="flex items-center gap-5">
                <IconCarThing
                  iconSize={250}
                  fontSize={100}
                  text={`${device.replace('device', '').trim()}`}
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
                  onClick={
                    supervisorData.setupProxy != 'RUNNING'
                      ? (): Promise<void> => handlePushProxy()
                      : (): void => {}
                  }
                  className={`border-2 top-10 ${supervisorData.setupProxy === 'RUNNING' ? 'border-red-600 hover:bg-red-500' : 'border-amber-600 hover:bg-amber-500'} ${!loading && 'hover:bg-amber-500'}   p-2 rounded-lg`}
                  onMouseEnter={() =>
                    setTooltip(
                      supervisorData.setupProxy === 'RUNNING'
                        ? 'Proxy already running!'
                        : 'Push Proxy App'
                    )
                  }
                  onMouseLeave={() => setTooltip('')}
                  disabled={loading}
                >
                  <IconUpload iconSize={24} />
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
              <div className="my-4">
                <label className="text-white">Brightness: {brightness}%</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={brightness}
                  onChange={(e) => handleBrightnessChange(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            <div className="border-zinc-700 border-2 p-5 m-1 flex justify-between items-center rounded-lg drop-shadow-lg">
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
                    <p className="relative"></p>
                  ) : (
                    <p className="relative text-zinc-500">
                      <i>Warning: Advanced use only. May cause damage.</i>
                    </p>
                  )}
                  <button
                    onClick={() => handleSendCommand(device)}
                    className="border-2 group gap-2 flex border-cyan-600 hover:bg-cyan-500 p-2 rounded-lg"
                    onMouseEnter={() =>
                      setWStooltip(types[device] == 'adb' ? 'Send ADB Command' : 'Send WS Command')
                    }
                    onMouseLeave={() => setWStooltip('')}
                  >
                    <p className="group-hover:block hidden">{weToolTip}</p>
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
