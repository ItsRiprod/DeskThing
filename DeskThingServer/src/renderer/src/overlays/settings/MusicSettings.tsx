import React, { useState, useEffect } from 'react'
import useSettingsStore from '../../stores/settingsStore'
import useAppStore from '../../stores/appStore'
import Button from '@renderer/components/buttons/Button'
import { IconLoading, IconSave, IconToggle } from '@renderer/assets/icons'
import Select from '@renderer/components/Select'
import { SingleValue } from 'react-select'
import { Settings } from '@shared/types'
import { SettingOption, TagTypes } from '@deskthing/types'
import { InfoComponent } from '@renderer/components/InfoComponent'

const MusicSettings: React.FC = () => {
  const saveSettings = useSettingsStore((settings) => settings.saveSettings)
  const requestSettings = useSettingsStore((settings) => settings.requestSettings)
  const appsList = useAppStore((state) => state.appsList)
  const [audioSources, setAudioSources] = useState<{ id: string; name: string }[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const sources = appsList
      .filter(
        (app) =>
          app.manifest &&
          (app.manifest.isAudioSource || app.manifest?.tags.includes(TagTypes.AUDIO_SOURCE))
      )
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

  const handleSettingChange = <K extends keyof Settings>(key: K, value: Settings[K]): void => {
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
        <div className="flex gap-1">
          <h2 className="text-xl">Enable Refresh Interval</h2>
          <InfoComponent
            description="Enable or disable the music refresh interval. Periodically re-syncs music data"
            side="bottom"
          />
        </div>
        <div className="flex items-center gap-4">
          <Button
            className="bg-transparent p-0"
            onClick={() =>
              handleSettingChange(
                'music_refreshInterval',
                settings?.music_refreshInterval === -1 ? 15000 : -1
              )
            }
          >
            <IconToggle
              iconSize={48}
              disabled={!settings}
              checked={settings?.music_refreshInterval !== -1}
              className={`transition-color ${settings?.music_refreshInterval !== -1 ? 'text-green-500' : 'text-gray-500'}`}
            />
          </Button>
        </div>
      </div>
      <div
        className={`transition-[height,opacity,border] border-t overflow-hidden ${!settings || settings?.music_refreshInterval === -1 ? 'h-0 opacity-50 border-black' : 'h-20 opacity-100 border-gray-500'}`}
      >
        <div className={`w-full p-4 flex justify-between items-center`}>
          <div className="flex gap-1">
            <h2 className="text-xl">Refresh Interval (seconds)</h2>
            <InfoComponent
              description="Set the interval for refreshing music data in seconds. Usually 10-15 seconds is a good value. This is only needed for while you are changing music on devices other than DeskThing. Otherwise, DeskThing will stay in sync without this."
              side="right"
            />
          </div>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={
                settings
                  ? settings?.music_refreshInterval === -1
                    ? ''
                    : settings.music_refreshInterval / 1000
                  : 15000
              }
              onChange={(e) =>
                handleSettingChange('music_refreshInterval', Number(e.target.value) * 1000)
              }
              className="focus:text-white bg-zinc-900 text-white rounded px-2 py-2"
              placeholder="Enter A Value"
              disabled={!settings || settings.music_refreshInterval === -1}
            />
          </div>
        </div>
      </div>
      <div className="border-t border-gray-500 w-full p-4 flex justify-between items-center">
        <div className="flex gap-1 w-full">
          <h2 className="text-xl">Playback Sources</h2>
          <InfoComponent
            description="Where DeskThing should 'source' music from. This is mostly for controls"
            side="right"
          />
        </div>
        <Select
          placeholder={settings ? settings.music_playbackLocation || '' : 'Loading...'}
          onChange={(e) => {
            const value = e as SingleValue<SettingOption>
            handleSettingChange('music_playbackLocation', value?.value || '')
          }}
          value={settings ? settings.music_playbackLocation || '' : 'Disabled'}
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
            // { TODO Native Local Audio
            //   value: 'local',
            //   label: 'Local Audio'
            // },
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
