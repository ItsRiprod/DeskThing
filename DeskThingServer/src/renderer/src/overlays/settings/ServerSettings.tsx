import React, { useState } from 'react'
import useSettingsStore from '../../stores/settingsStore'
import Button from '@renderer/components/Button'
import { IconLoading, IconPlay, IconSave, IconToggle } from '@renderer/assets/icons'
import Select from '@renderer/components/Select'
import { SingleValue } from 'react-select'
import { SettingOption } from '@deskthing/types'
import { LOG_FILTER } from '@shared/types'
import useUpdateStore from '@renderer/stores/updateStore'

const ServerSettings: React.FC = () => {
  const initialSettings = useSettingsStore((settings) => settings.settings)
  const saveSettings = useSettingsStore((settings) => settings.saveSettings)
  const [settings, setSettings] = useState(initialSettings)
  const [loading, setLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const checkForUpdateFn = useUpdateStore((state) => state.checkForUpdates)

  const logLevelOptions = [
    { value: LOG_FILTER.DEBUG, label: 'Debug' },
    { value: LOG_FILTER.MESSAGE, label: 'Message' },
    { value: LOG_FILTER.LOG, label: 'Log' },
    { value: LOG_FILTER.INFO, label: 'Info' },
    { value: LOG_FILTER.WARN, label: 'Warning' },
    { value: LOG_FILTER.ERROR, label: 'Error' },
    { value: LOG_FILTER.FATAL, label: 'Fatal' },
    { value: LOG_FILTER.SILENT, label: 'Silent' },
    { value: LOG_FILTER.APPSONLY, label: 'Apps Only' }
  ]

  const handleSettingChange = (key: string, value: string | boolean | number): void => {
    setSettings({ ...settings, [key]: value })
  }

  const handleSave = async (): Promise<void> => {
    setLoading(true)
    saveSettings(settings)
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }

  const checkForUpdate = (): void => {
    setDownloadLoading(true)
    checkForUpdateFn()
    setTimeout(() => {
      setDownloadLoading(false)
    }, 1000)
  }

  return (
    <div className="w-full absolute inset h-full p-4 flex flex-col divide-y-2 divide-gray-500">
      <div className="w-full px-4 p-3 flex justify-between items-center">
        <h2 className="text-xl">Check for updates</h2>
        <Button
          className={`bg-zinc-900 ${!downloadLoading && 'hover:bg-green-500'}`}
          onClick={checkForUpdate}
          disabled={downloadLoading}
        >
          {downloadLoading ? <IconLoading /> : <IconPlay />}
        </Button>
      </div>
      <div className="w-full p-4 flex justify-between items-center">
        <h2 className="text-xl">Callback Port</h2>
        <input
          type="number"
          value={settings.callbackPort}
          onChange={(e) => handleSettingChange('callbackPort', Number(e.target.value))}
          className="border border-gray-300 focus:text-black text-gray-500 rounded px-2 py-1"
        />
      </div>
      <div className="w-full p-4 flex justify-between items-center">
        <h2 className="text-xl">Device Port</h2>
        <input
          type="number"
          value={settings.devicePort}
          onChange={(e) => handleSettingChange('devicePort', Number(e.target.value))}
          className="border border-gray-300 rounded focus:text-black text-gray-500 px-2 py-1"
        />
      </div>
      <div className="w-full p-4 flex justify-between items-center">
        <h2 className="text-xl">Server Address</h2>
        <input
          type="text"
          value={settings.address}
          onChange={(e) => handleSettingChange('address', e.target.value)}
          className="border border-gray-300 focus:text-black text-gray-500 rounded px-2 py-1"
        />
      </div>
      <div className="w-full px-4 flex justify-between items-center">
        <h2 className="text-xl">Auto Start</h2>
        <Button
          className="bg-transparent p-0"
          onClick={() => handleSettingChange('autoStart', !settings.autoStart)}
        >
          <IconToggle
            iconSize={48}
            checked={settings.autoStart}
            className={`transition-color ${settings.autoStart ? 'text-green-500' : 'text-gray-500'}`}
          />
        </Button>
      </div>
      <div className="w-full p-4 flex justify-between items-center">
        <h2 className="text-xl w-full">Logging Level</h2>
        <Select
          options={logLevelOptions}
          value={settings.logLevel}
          placeholder={settings.LogLevel}
          className="w-full"
          onChange={(selected) => {
            const selectedValue = selected as SingleValue<SettingOption>
            handleSettingChange('logLevel', selectedValue?.value || LOG_FILTER.INFO)
          }}
        />
      </div>
      <div className="w-full px-4 flex justify-between items-center">
        <h2 className="text-xl">Close To Taskbar</h2>
        <Button
          className="bg-transparent p-0"
          onClick={() => handleSettingChange('minimizeApp', !settings.minimizeApp)}
        >
          <IconToggle
            iconSize={48}
            checked={settings.minimizeApp}
            className={`transition-color ${settings.minimizeApp ? 'text-green-500' : 'text-gray-500'}`}
          />
        </Button>
      </div>
      <div className="border-t py-5 border-gray-900 w-full flex justify-end">
        <Button
          className={`border-green-500 border group gap-2 ${loading ? 'text-gray-100 bg-green-600' : 'hover:bg-green-500'}`}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? <IconLoading /> : <IconSave className="stroke-2" />}
          <p>{loading ? 'Saving' : 'Save'}</p>
        </Button>
      </div>
    </div>
  )
}
export default ServerSettings
