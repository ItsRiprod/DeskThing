import React, { useState, useEffect } from 'react'
import useSettingsStore from '../../stores/settingsStore'
import useAppStore from '../../stores/appStore'
import Button from '@renderer/components/Button'
import { IconLoading, IconSave, IconToggle } from '@renderer/assets/icons'
import Select from '@renderer/components/Select'
import { SingleValue } from 'react-select'
import { SettingOption, Settings } from '@shared/types'

const MusicSettings: React.FC = () => {
  const saveSettings = useSettingsStore((settings) => settings.saveSettings)
  const requestSettings = useSettingsStore((settings) => settings.requestSettings)
  const appsList = useAppStore((state) => state.appsList)
  const [audioSources, setAudioSources] = useState<{ id: string; name: string }[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const sources = appsList
      .filter((app) => app.manifest && app.manifest.isAudioSource)
      .map((app) => ({
        id: app.name,
        name: app.manifest?.label || app.name
      }))
    setAudioSources(sources)

    const fetchSettings = async (): Promise<void> => {
      const settings = await requestSettings()
      setSettings(settings)
    }

    fetchSettings()
  }, [appsList])

  const handleSettingChange = (key: string, value: string | boolean | number | string[]): void => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
    console.log('Settings Updated:', settings)
  }

  const handleSave = async (): Promise<void> => {
    if (!settings) return
    setLoading(true)
    await saveSettings(settings)
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }

  return (
    <div className="w-full absolute inset h-full p-4 flex flex-col">
      <div className="w-full p-0 px-4 flex justify-between items-center">
        <h2 className="text-xl">Enable Refresh Interval</h2>
        <div className="flex items-center gap-4">
          <Button
            className="bg-transparent p-0"
            onClick={() =>
              handleSettingChange('refreshInterval', settings?.refreshInterval === -1 ? 15000 : -1)
            }
          >
            <IconToggle
              iconSize={48}
              disabled={!settings}
              checked={settings?.refreshInterval !== -1}
              className={`transition-color ${settings?.refreshInterval !== -1 ? 'text-green-500' : 'text-gray-500'}`}
            />
          </Button>
        </div>
      </div>
      <div
        className={`transition-[height,opacity,border] border-t overflow-hidden ${!settings || settings?.refreshInterval === -1 ? 'h-0 opacity-50 border-black' : 'h-20 opacity-100 border-gray-500'}`}
      >
        <div className={`w-full p-4 flex justify-between items-center`}>
          <h2 className="text-xl">Refresh Interval (seconds)</h2>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={
                settings
                  ? settings?.refreshInterval === -1
                    ? ''
                    : settings.refreshInterval / 1000
                  : 15000
              }
              onChange={(e) =>
                handleSettingChange('refreshInterval', Number(e.target.value) * 1000)
              }
              className="focus:text-white bg-zinc-900 text-white rounded px-2 py-2"
              placeholder="Enter A Value"
              disabled={!settings || settings.refreshInterval === -1}
            />
          </div>
        </div>
      </div>
      <div className="border-t border-gray-500 w-full p-4 flex justify-between items-center">
        <h2 className="text-xl w-full">Playback Sources</h2>
        <Select
          placeholder={settings ? settings.playbackLocation || '' : 'Loading...'}
          onChange={(e) => {
            const value = e as SingleValue<SettingOption>
            handleSettingChange('playbackLocation', value?.value || '')
          }}
          value={settings ? settings.playbackLocation || '' : 'Disabled'}
          className="bg-zinc-900 rounded hover:cursor-pointer text-white px-2 py-2 w-full"
          options={[
            ...audioSources.map((app) => ({
              value: app.id,
              label: app.name
            })),
            {
              value: 'none',
              label: 'None'
            },
            {
              value: 'disabled',
              label: 'Disabled'
            }
          ]}
        />
      </div>
      <div className="border-t py-5 border-gray-500 w-full flex justify-end">
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
