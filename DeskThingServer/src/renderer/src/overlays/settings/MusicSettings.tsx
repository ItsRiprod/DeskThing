import React, { useState, useEffect } from 'react'
import useSettingsStore from '../../stores/settingsStore'
import useAppStore from '../../stores/appStore'
import Button from '@renderer/components/Button'
import { IconLoading, IconSave, IconToggle } from '@renderer/assets/icons'

const MusicSettings: React.FC = () => {
  const initialSettings = useSettingsStore((settings) => settings.settings)
  const saveSettings = useSettingsStore((settings) => settings.saveSettings)
  const appsList = useAppStore((state) => state.appsList)
  const [audioSources, setAudioSources] = useState<{ id: string; name: string }[]>([])
  const [settings, setSettings] = useState(initialSettings)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const sources = appsList
      .filter((app) => app.manifest && app.manifest.isAudioSource)
      .map((app) => ({
        id: app.name,
        name: app.manifest?.label || app.name
      }))
    setAudioSources(sources)
  }, [appsList])

  const handleSettingChange = (key: string, value: string | boolean | number | string[]): void => {
    setSettings({ ...settings, [key]: value })
  }

  const handleSave = async (): Promise<void> => {
    setLoading(true)
    await saveSettings(settings)
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }

  return (
    <div className="w-full absolute inset h-full p-4 flex flex-col divide-y-2 divide-gray-500">
      <div className="w-full p-4 flex justify-between items-center">
        <h2 className="text-xl">Refresh Interval (seconds)</h2>
        <div className="flex items-center gap-4">
          <input
            type="number"
            value={settings.refreshInterval === -1 ? '' : settings.refreshInterval / 1000}
            onChange={(e) => handleSettingChange('refreshInterval', Number(e.target.value) * 1000)}
            className="focus:text-white bg-zinc-900 text-white rounded px-2 py-2"
            placeholder="Enter A Value"
            disabled={settings.refreshInterval === -1}
          />
        </div>
      </div>
      <div className="w-full p-4 flex justify-between items-center">
        <h2 className="text-xl">Enable Refresh Interval</h2>
        <div className="flex items-center gap-4">
          <Button
            className="bg-transparent p-0"
            onClick={() =>
              handleSettingChange('refreshInterval', settings.refreshInterval === -1 ? 5000 : -1)
            }
          >
            <IconToggle
              iconSize={48}
              checked={settings.refreshInterval !== -1}
              className={`transition-color ${settings.refreshInterval !== -1 ? 'text-green-500' : 'text-gray-500'}`}
            />
          </Button>
        </div>
      </div>
      <div className="w-full p-4 flex justify-between items-center">
        <h2 className="text-xl">Playback Sources</h2>
        <select
          value={settings.playbackLocation}
          onChange={(e) => {
            handleSettingChange('playbackLocation', e.target.value)
          }}
          className="focus:text-white bg-zinc-900 text-white rounded px-2 py-2"
        >
          {audioSources.map((app) => (
            <option key={app.id} value={app.id}>
              {app.name}
            </option>
          ))}
        </select>
      </div>
      <div className="border-t mt-4 py-5 border-gray-900 w-full flex justify-end">
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

export default MusicSettings
