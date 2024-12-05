import React, { useState } from 'react'
import Sidebar from '@renderer/nav/Sidebar'
import MainElement from '@renderer/nav/MainElement'
import { IconPlay, IconRefresh, IconReload, IconToggle } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import { useClientStore, useSettingsStore } from '@renderer/stores'

const ADBSettings: React.FC = () => {
  const [inputValue, setInputValue] = useState('')
  const [pastCommands, setPastCommands] = useState<string[]>([])
  const [commandType, setCommandType] = useState('adb')
  const [adbDevice, setAdbDevice] = useState('')
  const adbDevices = useClientStore((store) => store.ADBDevices)
  const refreshDevices = useClientStore((store) => store.requestADBDevices)
  const saveSettings = useSettingsStore((store) => store.savePartialSettings)
  const adbSetting = useSettingsStore((store) => store.settings.globalADB)
  const [restarting, setRestarting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<string>('')

  const sendCommand = async (): Promise<void> => {
    setLoading(true)
    setPastCommands((prev) => (prev.includes(inputValue) ? prev : [...prev, inputValue]))

    if (commandType == 'adb') {
      const adbCommand = `${adbDevice.length > 0 ? ' -s ' + adbDevice : ''} ${inputValue.trim()}`

      const response = await window.electron.handleClientADB(adbCommand)

      setResponse(response)
    }
    setResponse('Not Supported')
    setLoading(false)
  }

  const handleRestarServer = async (): Promise<void> => {
    setLoading(true)
    setRestarting(true)
    setResponse('Killing Server...')
    let response = await window.electron.handleClientADB('kill-server')
    setResponse((res) => res + '\n' + (response || 'Killed Server\nStarting Server...'))
    response = await window.electron.handleClientADB('start-server')
    setResponse((res) => res + '\n' + (response || 'Started Server'))
    setRestarting(false)
    setLoading(false)
  }

  const handleRefreshDevices = async (): Promise<void> => {
    setRefreshing(true)
    await refreshDevices()
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }

  const handleToggleAdb = (): void => {
    saveSettings({ globalADB: !adbSetting })
  }

  return (
    <div className="w-full h-full flex">
      <Sidebar className="flex justify-end flex-col h-full gap-2 max-h-full md:items-stretch xs:items-center">
        <Button onClick={handleToggleAdb} className="hover:bg-zinc-900 items-center gap-2">
          <IconToggle
            checked={adbSetting}
            className={adbSetting ? `text-green-500` : 'text-gray-500'}
            iconSize={34}
          />
          <p className="md:block xs:hidden text-center flex-grow">
            {adbSetting ? 'Global' : 'Local'} ADB
          </p>
        </Button>
        <Button
          disabled={loading}
          onClick={handleRestarServer}
          className={restarting ? 'text-gray-300' : 'hover:bg-zinc-900'}
        >
          <IconReload
            className={restarting && `-rotate-[360deg] transition-transform duration-1000`}
          />
          <p className="md:block xs:hidden text-center flex-grow">Restart ADB</p>
        </Button>
        <Button
          disabled={loading}
          className={refreshing ? 'text-gray-300' : 'hover:bg-zinc-900'}
          onClick={handleRefreshDevices}
        >
          <IconRefresh className={refreshing && `animate-spin`} />
          <p className="md:block xs:hidden text-center flex-grow">Find Devices</p>
        </Button>
      </Sidebar>
      <MainElement>
        <h1 className="font-semibold text-2xl p-4">ADB Settings</h1>
        <div className="w-full items-stretch flex-col lg:flex-row gap-5 p-5 flex">
          <div className="flex gap-2">
            <select
              className="p-2 rounded text-black"
              value={commandType}
              onChange={(e) => setCommandType(e.target.value)}
            >
              <option value="adb">ADB</option>
              <option value="other">Other</option>
            </select>
            <select
              className="p-2 rounded text-black"
              value={adbDevice}
              onChange={(e) => setAdbDevice(e.target.value)}
            >
              {adbDevices.map((device) => (
                <option key={device} value={device}>
                  {device}
                </option>
              ))}
              <option value="">None</option>
            </select>
          </div>
          <div className="flex flex-col w-full sm:flex-row gap-2">
            <input
              type="text"
              className="p-2 rounded text-black w-full"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Button
              className="text-nowrap border group border-cyan-500 hover:bg-cyan-500"
              onClick={sendCommand}
            >
              <p>Run Command</p>
              <IconPlay />
            </Button>
          </div>
        </div>
        <div className="flex gap-2 px-2 pb-4">
          {pastCommands &&
            pastCommands.map((command, index) => (
              <Button
                key={index}
                onClick={() => setInputValue(command)}
                className="hover:bg-zinc-900 bg-zinc-950"
              >
                {command}
              </Button>
            ))}
        </div>
        <div>
          <div className="font-geistMono w-full bg-zinc-900 h-full p-3">
            {response ? (
              response.split('\n').map((line, index) => <div key={index}>{line}</div>)
            ) : (
              <p>Response</p>
            )}
          </div>
        </div>
      </MainElement>
    </div>
  )
}

export default ADBSettings
