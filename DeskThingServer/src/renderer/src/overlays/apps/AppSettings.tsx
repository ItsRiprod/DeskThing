import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useAppStore } from '@renderer/stores'
import { AppDataInterface, SettingsType } from '@shared/types'
import { AppSettingProps } from './AppsOverlay'
import Button from '@renderer/components/Button'
import { IconToggle } from '@renderer/assets/icons'

const AppSettings: React.FC<AppSettingProps> = ({ app }) => {
  const getAppData = useAppStore((state) => state.getAppData)
  const [appData, setAppData] = useState<AppDataInterface | null>(null)

  useEffect(() => {
    const fetchAppData = async (): Promise<void> => {
      const data = await getAppData(app.name)
      setAppData(data)
    }
    fetchAppData()
  }, [app.name, getAppData])

  const handleSettingChange = useCallback(
    (key: string, value: string | number | boolean | string[] | boolean[]) => {
      setAppData((prev) =>
        prev && prev.settings
          ? {
              ...prev,
              settings: {
                ...prev.settings,
                [key]: { ...prev.settings[key], value: value as any }
              }
            }
          : prev
      )
    },
    []
  )

  const renderSettingInput = useCallback(
    (setting: SettingsType, key: string) => {
      const commonClasses =
        'mt-1 block w-full px-3 py-2 bg-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'

      switch (setting.type) {
        case 'string':
          return (
            <div>
              <h3>{setting.label}</h3>

              <input
                type="text"
                value={setting.value as string}
                onChange={(e) => handleSettingChange(key, e.target.value)}
                className={commonClasses}
              />
            </div>
          )
        case 'number':
          return (
            <input
              type="number"
              value={setting.value as number}
              onChange={(e) => handleSettingChange(key, Number(e.target.value))}
              className={commonClasses}
            />
          )
        case 'boolean':
          return (
            <Button onClick={() => handleSettingChange(key, !setting.value)}>
              <IconToggle checked={setting.value as boolean} />
            </Button>
          )
        case 'select':
          return (
            <select
              value={setting.value}
              onChange={(e) => handleSettingChange(key, e.target.value)}
              className={commonClasses}
            >
              {setting.options?.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )
        case 'multiselect':
          return (
            <div className="flex flex-col gap-2">
              {setting.options?.map((option, index) => (
                <label key={index} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={(setting.value as boolean[]).includes(index)}
                    onChange={(e) => {
                      const currentValues = [...(setting.value as boolean[])]
                      currentValues[index] = e.target.checked
                      handleSettingChange(key, currentValues)
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          )
        default:
          return (
            <div>
              <div className="flex flex-col space-y-2">
                {setting.options?.map((option, index) => (
                  <div key={index} className="flex items-center">
                    <span className="text-sm text-gray-600">{option.label}: </span>
                    <span className="ml-2 text-sm font-medium">{option.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )
      }
    },
    [handleSettingChange]
  )

  const settingsEntries = useMemo(
    () => (appData?.settings ? Object.entries(appData.settings) : []),
    [appData]
  )

  return (
    <div className="w-full h-full p-6 flex flex-col space-y-4">
      {settingsEntries.map(([key, setting]) => (
        <div key={key} className="flex flex-col space-y-1">
          {renderSettingInput(setting, key)}
        </div>
      ))}
    </div>
  )
}
export default AppSettings
