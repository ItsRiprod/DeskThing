import React from 'react'
import useSettingsStore from '../../stores/settingsStore'
import Button from '@renderer/components/Button'
import { IconToggle } from '@renderer/assets/icons'

const ServerSettings: React.FC = () => {
  const { settings, saveSettings } = useSettingsStore()

  const handleSettingChange = (key: string, value: string | boolean | number): void => {
    saveSettings({ ...settings, [key]: value })
  }

  return (
    <div className="w-full h-full p-4 flex flex-col divide-y-2 divide-gray-500">
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
      <div className="w-full p-4 flex justify-between items-center">
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
    </div>
  )
}

export default ServerSettings
