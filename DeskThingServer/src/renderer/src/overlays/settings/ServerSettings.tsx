import React, { useState } from 'react'
import useSettingsStore from '../../stores/settingsStore'
import Button from '@renderer/components/Button'
import { IconLoading, IconSave, IconToggle } from '@renderer/assets/icons'
import Select from '@renderer/components/Select'
import { SingleValue } from 'react-select'
import { LOGGING_LEVEL, SettingOption } from '@shared/types'

const ServerSettings: React.FC = () => {
  const initialSettings = useSettingsStore((settings) => settings.settings)
  const saveSettings = useSettingsStore((settings) => settings.saveSettings)
  const [settings, setSettings] = useState(initialSettings)
  const [loading, setLoading] = useState(false)

  const logLevelOptions = [
    { value: LOGGING_LEVEL.SYSTEM, label: 'SYSTEM' },
    { value: LOGGING_LEVEL.APPS, label: 'APPS' },
    { value: LOGGING_LEVEL.PRODUCTION, label: 'PRODUCTION' }
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

  return (
    <div className="w-full absolute inset h-full p-4 flex flex-col divide-y-2 divide-gray-500">
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
            handleSettingChange('logLevel', selectedValue?.value || LOGGING_LEVEL.PRODUCTION)
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
