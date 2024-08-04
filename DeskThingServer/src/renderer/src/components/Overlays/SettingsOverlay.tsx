import { useState, useEffect } from 'react'
import { IconX, IconRefresh, IconPlay } from '../icons'
import SettingsStoreInstance, { Settings } from '@renderer/store/settingsStore'

interface SettingsOverlayProps {
  setEnabled: (enabled: boolean) => void
}

const SettingsOverlay = ({ setEnabled }: SettingsOverlayProps): JSX.Element => {
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    // Fetch current settings from electron store
    const fetchSettings = async (): Promise<void> => {
      const currentSettings = await SettingsStoreInstance.getSettings()
      setSettings(currentSettings)
    }
    fetchSettings()
  }, [])

  const handleSettingChange = (setting: keyof Settings, value: any): void => {
    setSettings(
      (prevSettings) =>
        prevSettings && {
          ...prevSettings,
          [setting]: value
        }
    )
  }

  const handleSave = async (): Promise<void> => {
    if (settings) {
      await SettingsStoreInstance.saveSettings(settings)
      setEnabled(false)
    }
  }

  const handleReset = async (): Promise<void> => {
    const defaultSettings = await window.electron.getSettings()
    setSettings(defaultSettings)
  }

  if (!settings) {
    return <div>Loading...</div>
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 animate-fade p-5 w-11/12 rounded-lg max-h-[90vh] overflow-auto drop-shadow-lg flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Server Settings</h2>
          <button
            onClick={() => setEnabled(false)}
            className="text-gray-400 border-red-600 border p-3 rounded-lg hover:text-white hover:bg-red-500 focus:outline-none"
          >
            <IconX />
          </button>
        </div>

        <div className="p-5 m-1 rounded-lg drop-shadow-lg">
          <div className="shadow-lg m-5 border-zinc-500 border p-3 rounded-xl flex justify-between items-center">
            <p>Callback Port:</p>
            <input
              type="number"
              value={settings.callbackPort}
              onChange={(e) => handleSettingChange('callbackPort', Number(e.target.value))}
              className="h-10 bg-slate-500 rounded focus:bg-white active:bg-white focus:text-black active:text-black px-2 text-white-600"
            />
          </div>

          <div className="shadow-lg m-5 border-zinc-500 border p-3 rounded-xl flex justify-between items-center">
            <p>Device Port:</p>
            <input
              type="number"
              value={settings.devicePort}
              onChange={(e) => handleSettingChange('devicePort', Number(e.target.value))}
              className="h-10 bg-slate-500 rounded focus:bg-white active:bg-white focus:text-black active:text-black px-2 text-white-600"
            />
          </div>

          <div className="shadow-lg m-5 border-zinc-500 border p-3 rounded-xl flex justify-between items-center">
            <p>Address:</p>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => handleSettingChange('address', e.target.value)}
              className="h-10 bg-slate-500 rounded focus:bg-white active:bg-white focus:text-black active:text-black px-2 text-white-600"
            />
          </div>
          <div className="shadow-lg m-5 border-zinc-500 border p-3 rounded-xl flex justify-between items-center">
            <p>Local IP:</p>
            <div className="h-10 bg-slate-500 flex items-center rounded px-2 text-gray-300">
              <p>{settings.localIp}</p>
            </div>
          </div>

          <div className="shadow-lg m-5 border-zinc-500 border p-3 rounded-xl flex justify-between items-center">
            <p>Auto Start:</p>
            <input
              disabled={true}
              type="checkbox"
              checked={settings.autoStart}
              onChange={(e) => handleSettingChange('autoStart', e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
          </div>

          <div className="shadow-lg m-5 border-zinc-500 border p-3 rounded-xl flex justify-between items-center">
            <p>Minimize App:</p>
            <input
              disabled={true}
              type="checkbox"
              checked={settings.minimizeApp}
              onChange={(e) => handleSettingChange('minimizeApp', e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
          </div>
        </div>

        <div className="bg-slate-700 p-5 m-1 flex justify-between rounded-lg drop-shadow-lg">
          <button
            className="flex border-red-600 border hover:bg-red-500 p-3 rounded-lg drop-shadow-lg"
            onClick={() => setEnabled(false)}
          >
            <IconX iconSize={24} />
          </button>
          <div className="flex gap-4">
            <button
              className="group gap-2 flex border-cyan-600 border hover:bg-cyan-500 p-3 rounded-lg drop-shadow-lg"
              onClick={handleReset}
            >
              <p className="group-hover:block hidden">Reset</p>
              <IconRefresh iconSize={24} />
            </button>
            <button
              className="group gap-2 flex border-green-600 border hover:bg-green-500 p-3 rounded-lg drop-shadow-lg"
              onClick={handleSave}
            >
              <p className="group-hover:block hidden">Save</p>
              <IconPlay iconSize={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsOverlay
