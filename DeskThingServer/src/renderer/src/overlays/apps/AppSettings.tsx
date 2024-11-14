import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useAppStore } from '@renderer/stores'
import { AppDataInterface, SettingOption, SettingsString, SettingsType } from '@shared/types'
import { AppSettingProps } from './AppsOverlay'
import Button from '@renderer/components/Button'
import { IconLoading, IconSave, IconToggle } from '@renderer/assets/icons'
import Select from '@renderer/components/Select'
import { MultiValue, SingleValue } from 'react-select'

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

  const clampValue = (value: number, min?: number, max?: number): number => {
    if (min !== undefined && value < min) return min
    if (max !== undefined && value > max) return max
    return value
  }

  const renderSettingInput = useCallback(
    (setting: SettingsType, key: string) => {
      const commonClasses =
        'mt-1 block px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'

      switch (setting.type || '') {
        case 'string':
          return (
            <SettingComponent key={key} setting={setting}>
              <div className="flex items-center w-full">
                <input
                  type="text"
                  value={setting.value as string}
                  maxLength={(setting as SettingsString).maxLength}
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
                    onChange={(e) => {
                      let inputValue = Number(e.target.value)
                      inputValue = clampValue(inputValue, setting.min, setting.max)
                      handleSettingChange(key, inputValue)
                    }}
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
        case 'range':
          return (
            <SettingComponent key={key} setting={setting}>
              {setting.type == 'range' && (
                <input
                  type="range"
                  value={setting.value}
                  min={setting.min}
                  max={setting.max}
                  step={setting.step || 1}
                  onChange={(e) => handleSettingChange(key, e.target.value)}
                  className="w-96 max-w-s"
                />
              )}
            </SettingComponent>
          )
        case 'select':
          return (
            <SettingComponent key={key} setting={setting}>
              {setting.type == 'select' && (
                <div className="w-96 max-w-s">
                  <Select
                    options={setting.options}
                    placeholder={setting.placeholder ?? ''}
                    value={setting.value}
                    onChange={(selected) => {
                      const selectedValue = selected as SingleValue<SettingOption>
                      handleSettingChange(key, selectedValue!.value)
                    }}
                  />
                </div>
              )}
            </SettingComponent>
          )
        case 'multiselect':
          return (
            <SettingComponent key={key} setting={setting}>
              {setting.type == 'multiselect' && (
                <div className="w-96 max-w-s">
                  <Select
                    options={setting.options}
                    value={setting.value}
                    isMulti={true}
                    placeholder={setting.placeholder ?? 'Select...'}
                    onChange={(selected) => {
                      const selectedValues = selected as MultiValue<SettingOption>
                      const currentValues = selectedValues.map((value) => value.value)
                      handleSettingChange(key, currentValues)
                    }}
                  />
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
      <div className="w-full flex-1">
        <div className="text-xs text-gray-500 font-geistMono absolute -top-2 inset flex justify-between w-full">
          <p>{setting.type?.toUpperCase() || 'Legacy Setting'}</p>
          {setting.type === 'number' && (
            <p>
              MIN: {setting.min} | MAX: {setting.max}
            </p>
          )}
        </div>
        <div className="group relative flex flex-wrap w-full">
          <p className="py-3 cursor-help break-words max-w-xs">{setting.label}</p>
          {setting.description && (
            <div className="absolute left-0 -bottom-1 translate-y-full invisible group-hover:visible bg-zinc-800 text-sm text-gray-300 px-2 py-1 rounded-md whitespace-normal max-w-xs z-10">
              {setting.description}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center">
        {setting.type === 'range' && <div>{setting.value}</div>}
        {children}
      </div>
    </div>
  )
}
