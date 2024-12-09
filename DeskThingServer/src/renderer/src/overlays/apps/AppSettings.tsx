import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useAppStore } from '@renderer/stores'
import { AppDataInterface } from '@shared/types'
import { AppSettingProps } from './AppsOverlay'
import Button from '@renderer/components/Button'
import { IconLoading, IconSave } from '@renderer/assets/icons'
import Settings from '@renderer/components/settings'

const AppSettings: React.FC<AppSettingProps> = ({ app }) => {
  const getAppData = useAppStore((state) => state.getAppData)
  const saveAppData = useAppStore((state) => state.setAppData)
  const [appData, setAppData] = useState<AppDataInterface | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchAppData = async (): Promise<void> => {
      const data = await getAppData(app.name)
      setAppData(data)
    }
    fetchAppData()
  }, [app.name, getAppData])

  const handleSettingChange = useCallback(
    (key: string, value: string | number | boolean | string[] | boolean[]) => {
      console.log('Setting changed:', key, value)
      setAppData((prev) =>
        prev && prev.settings
          ? {
              ...prev,
              settings: {
                ...prev.settings,
                [key]: {
                  ...prev.settings[key],
                  // It had to be this way... The way that the type expects a specific value for each type of object means that this can only be every type of value but only one at a time. We have no way of knowing which type of setting it is.
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  value: value as any
                }
              }
            }
          : prev
      )
    },
    []
  )

  const settingsEntries = useMemo(
    () => (appData?.settings ? Object.entries(appData.settings) : []),
    [appData]
  )

  const onSaveClick = async (): Promise<void> => {
    if (!appData) return
    setLoading(true)
    try {
      await saveAppData(app.name, appData)
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
