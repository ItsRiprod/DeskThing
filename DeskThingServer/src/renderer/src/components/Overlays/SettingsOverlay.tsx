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
    <div className="pointer-events-auto fixed top-0 items-center h-screen w-screen flex justify-around left-0 z-10">
      <div className="bg-slate-600 animate-fade p-5 w-11/12 rounded-lg max-h-[90vh] overflow-auto drop-shadow-lg flex flex-col">
        <h1 className="shadow-lg m-5 bg-slate-700 p-3 rounded-xl">Settings</h1>

        <div className="bg-slate-500 p-5 m-1 rounded-lg drop-shadow-lg">
          <div className="shadow-lg m-5 bg-slate-600 p-3 rounded-xl flex justify-between items-center">
            <p>Callback Port:</p>
            <input
              type="number"
              value={settings.callbackPort}
              onChange={(e) => handleSettingChange('callbackPort', Number(e.target.value))}
              className="form-input h-10 w-24 text-blue-600"
            />
          </div>

          <div className="shadow-lg m-5 bg-slate-600 p-3 rounded-xl flex justify-between items-center">
            <p>Device Port:</p>
            <input
              type="number"
              value={settings.devicePort}
              onChange={(e) => handleSettingChange('devicePort', Number(e.target.value))}
              className="form-input h-10 w-24 text-blue-600"
            />
          </div>

          <div className="shadow-lg m-5 bg-slate-600 p-3 rounded-xl flex justify-between items-center">
            <p>Address:</p>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => handleSettingChange('address', e.target.value)}
              className="form-input h-10 w-48 text-blue-600"
            />
          </div>

          <div className="shadow-lg m-5 bg-slate-600 p-3 rounded-xl flex justify-between items-center">
            <p>Auto Start:</p>
            <input
              disabled={true}
              type="checkbox"
              checked={settings.autoStart}
              onChange={(e) => handleSettingChange('autoStart', e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
          </div>

          <div className="shadow-lg m-5 bg-slate-600 p-3 rounded-xl flex justify-between items-center">
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
            className="bg-red-700 hover:bg-red-500 transition-colors p-5 rounded-lg drop-shadow-lg"
            onClick={() => setEnabled(false)}
          >
            <IconX iconSize={24} />
          </button>
          <div className="flex gap-4">
            <button
              className="bg-yellow-600 hover:bg-yellow-500 transition-colors p-5 rounded-lg drop-shadow-lg"
              onClick={handleReset}
            >
              <IconRefresh iconSize={24} />
            </button>
            <button
              className="bg-green-600 hover:bg-green-500 transition-colors p-5 rounded-lg drop-shadow-lg"
              onClick={handleSave}
            >
              <IconPlay iconSize={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsOverlay
