import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useAppStore } from '@renderer/stores'
import { AppDataInterface, SettingsType } from '@shared/types'
import { AppSettingProps } from './AppsOverlay'
import Button from '@renderer/components/Button'
import { IconCheck, IconLoading, IconSave, IconToggle, IconX } from '@renderer/assets/icons'

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
        'mt-1 block px-3 py-2 bg-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'

      switch (setting.type || '') {
        case 'string':
          return (
            <SettingComponent key={key} setting={setting}>
              <div className="flex items-center w-full">
                <input
                  type="text"
                  value={setting.value as string}
                  onChange={(e) => handleSettingChange(key, e.target.value)}
                  className={commonClasses + ' w-full'}
                />
              </div>
            </SettingComponent>
          )
        case 'number':
          return (
            <SettingComponent key={key} setting={setting}>
              <div>
                {setting.type == 'number' && (
                  <input
                    type="number"
                    value={setting.value as number}
                    min={setting.min}
                    max={setting.max}
                    onChange={(e) => handleSettingChange(key, Number(e.target.value))}
                    className={commonClasses}
                  />
                )}
              </div>
            </SettingComponent>
          )
        case 'boolean':
          return (
            <SettingComponent key={key} setting={setting}>
              <Button onClick={() => handleSettingChange(key, !setting.value)}>
                <IconToggle
                  iconSize={48}
                  checked={setting.value as boolean}
                  className={`${setting.value ? 'text-green-500' : 'text-gray-500'} w-full h-full`}
                />
              </Button>
            </SettingComponent>
          )
        case 'select':
          return (
            <SettingComponent key={key} setting={setting}>
              {setting.type == 'select' && (
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
              )}
            </SettingComponent>
          )
        case 'multiselect':
          return (
            <SettingComponent key={key} setting={setting}>
              {setting.type == 'multiselect' && (
                <div className="gap-2 flex max-w-1/2 flex-wrap p-2 bg-zinc-900 border border-gray-700 rounded-md">
                  {setting.options?.map((option, index) => (
                    <Button
                      key={index}
                      className={`flex hover:bg-zinc-800 ${setting.value.includes(option.value) ? 'text-green-500' : 'text-red-500'}`}
                      onClick={(e) => {
                        e.preventDefault()
                        const currentValues = [...(setting.value as string[])]
                        if (currentValues.includes(option.value)) {
                          currentValues.splice(currentValues.indexOf(option.value), 1)
                        } else {
                          currentValues.push(option.value)
                        }
                        handleSettingChange(key, currentValues)
                      }}
                    >
                      {setting.value[index] ? <IconCheck /> : <IconX />}
                      <p>{option.label}</p>
                    </Button>
                  ))}
                </div>
              )}
            </SettingComponent>
          )
        default:
          return (
            <SettingComponent key={key} setting={setting}>
              <div className="flex flex-col space-y-2">
                {(
                  setting as SettingsType & { options?: Array<{ value: string; label: string }> }
                ).options?.map((option, index) => (
                  <div key={index} className="flex items-center">
                    <span className="text-sm text-gray-600">{option.label}: </span>
                    <span className="ml-2 text-sm font-medium">{option.value.toString()}</span>
                  </div>
                ))}
              </div>
            </SettingComponent>
          )
      }
    },
    [handleSettingChange]
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
      {settingsEntries.map(([key, setting]) => renderSettingInput(setting, key))}
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

interface SettingComponentProps {
  setting: SettingsType
  children?: React.ReactNode
  className?: string
}
const SettingComponent = ({ setting, children, className }: SettingComponentProps): JSX.Element => {
  return (
    <div
      className={`py-3 flex gap-3 items-center hover:bg-zinc-950 justify-between w-full border-t relative border-gray-900 ${className}`}
    >
      <div className="w-fit text-nowrap">
        <p className="text-xs text-gray-500 font-geistMono absolute -top-2 inset">
          {setting.type?.toUpperCase() || 'Legacy Setting'}
        </p>
        <div className="group relative w-full">
          <p className="py-3 cursor-help">{setting.label}</p>
          {setting.description && (
            <div className="absolute left-0 -bottom-1 translate-y-full invisible group-hover:visible bg-zinc-800 text-sm text-gray-300 px-2 py-1 rounded-md whitespace-normal max-w-xs z-10">
              {setting.description}
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
