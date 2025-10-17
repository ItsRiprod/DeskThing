import React, { useEffect, useState } from 'react'
import useSettingsStore from '../../stores/settingsStore'
import useAppStore from '../../stores/appStore'
import Button from '@renderer/components/buttons/Button'
import { IconLoading, IconSave } from '@renderer/assets/icons'
import { SettingsMultiSelectComponent } from '@renderer/components/settings/SettingsMultiSelect'
import { SETTING_TYPES, SettingOption, TagTypes } from '@deskthing/types'
import { InfoComponent } from '@renderer/components/InfoComponent'
import { Settings } from '@shared/types'
import ClientSettings from './ClientSettings'

const ExtrasSettings: React.FC = () => {
  const saveSettings = useSettingsStore((s) => s.saveSettings)
  const requestSettings = useSettingsStore((s) => s.requestSettings)
  const appsList = useAppStore((state) => state.appsList)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(false)
  const [audioAgentOptions, setAudioAgentOptions] = useState<SettingOption[]>([])

  useEffect(() => {
    const agentApps = appsList
      .filter((app) => app.manifest && app.manifest?.tags?.includes(TagTypes.AUDIO_AGENT))
      .map((app) => ({
        value: app.name,
        label: app.manifest?.label || app.name
      }))
    setAudioAgentOptions(agentApps)

    const fetchSettings = async (): Promise<void> => {
      const s = await requestSettings()
      setSettings(s)
    }
    fetchSettings()
  }, [appsList, requestSettings])

  const handleSettingChange = (value: string | number | boolean | string[]): void => {
    if (!settings || !Array.isArray(value)) return
    setSettings({ ...settings, voice_agent_app_ids: value })
  }

  const handleSave = async (): Promise<void> => {
    if (!settings) return
    setLoading(true)
    await saveSettings(settings)
    setTimeout(() => setLoading(false), 500)
  }

  return (
    <div className="w-full absolute inset h-full p-4 flex flex-col gap-8">
      {/* Audio Agent Settings Section */}
      <section className="w-full px-4 flex flex-col gap-6">
        <h1 className="text-2xl font-bold mb-2">Audio Agent Settings</h1>
        <div className="flex justify-between items-center">
          <div className="flex gap-1 items-center">
            <h2 className="text-xl">Audio Agent Apps</h2>
            <InfoComponent
              description="Select which apps should act as Audio Agents for DeskThing. These apps will be used for voice-related features."
              side="right"
            />
          </div>
        </div>
        <SettingsMultiSelectComponent
          setting={{
            options: audioAgentOptions,
            value: settings?.voice_agent_app_ids || [],
            label: 'Audio Agent Apps',
            type: SETTING_TYPES.MULTISELECT,
            placeholder: 'Select Audio Agent Apps'
          }}
          handleSettingChange={handleSettingChange}
        />
        <div className="border-t py-5 border-gray-900 w-full flex justify-end mt-auto">
          <Button
            className={`border-green-500 border group gap-2 ${loading ? 'text-gray-100 bg-green-600' : 'hover:bg-green-500'}`}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <IconLoading /> : <IconSave className="stroke-2" />}
            <p>{loading ? 'Saving' : 'Save'}</p>
          </Button>
        </div>
      </section>

      {/* Client Settings Section */}
      <section className="w-full px-4 flex flex-col gap-6">
        <h1 className="text-2xl font-bold mb-2">Client Settings</h1>
        <ClientSettings />
      </section>
    </div>
  )
}

export default ExtrasSettings
