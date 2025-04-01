import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { AppSettings as AppSettingsType } from '@deskthing/types'
import { AppSettingProps } from './AppsOverlay'
import Button from '@renderer/components/Button'
import { IconLoading, IconSave } from '@renderer/assets/icons'
import Settings from '@renderer/components/settings'
import { useAppStore } from '@renderer/stores'

const AppSettings: React.FC<AppSettingProps> = ({ app }) => {
  const { getAppSettings, setAppSettings } = useAppStore((state) => state)
  const [appSettings, setAppData] = useState<AppSettingsType | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchAppData = async (): Promise<void> => {
      const data = await getAppSettings(app.name)
      data && setAppData(data)
    }
    fetchAppData()
  }, [app.name, getAppSettings])

  const handleSettingChange = useCallback(
    (key: string, value: string | number | boolean | string[] | boolean[]) => {
      console.log('Setting changed:', key, value)
      setAppData((prev) =>
        prev
          ? {
              ...prev,
              [key]: {
                ...prev[key],
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                value: value as any
              }
            }
          : prev
      )
    },
    []
  )

  const settingsEntries = useMemo(
    () => (appSettings ? Object.entries(appSettings) : []),
    [appSettings]
  )

  const onSaveClick = async (): Promise<void> => {
    if (!appSettings) return
    setLoading(true)
    try {
      setAppSettings(app.name, appSettings)
    } catch (error) {
      console.error('Error saving app data:', error)
    }

    await setTimeout(() => {
      setLoading(false)
    }, 500)
  }

  return (
    <div className="w-full h-full p-6 flex flex-col">
      {settingsEntries.map(([key, setting]) => (
        <Settings
          setting={setting}
          handleSettingChange={(value) => handleSettingChange(key, value)}
          key={key}
        />
      ))}
      <div className="border-t mt-4 py-5 border-gray-900 w-full flex justify-end">
        <Button
          className={`border-green-500 border group gap-2 ${loading ? 'text-gray-100 bg-green-600' : 'hover:bg-green-500'}`}
          onClick={onSaveClick}
          disabled={loading}
        >
          {loading ? <IconLoading /> : <IconSave className="stroke-2" />}
          <p>{loading ? 'Saving' : 'Save'}</p>
        </Button>
      </div>
    </div>
  )
}
export default AppSettings
