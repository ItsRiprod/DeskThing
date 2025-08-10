import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { AppSettings as AppSettingsType, SettingsType } from '@deskthing/types'
import { AppSettingProps } from './AppsOverlay'
import Button from '@renderer/components/Button'
import { IconLoading, IconRefresh, IconSave } from '@renderer/assets/icons'
import Settings from '@renderer/components/settings'
import { useAppStore } from '@renderer/stores'

const AppSettings: React.FC<AppSettingProps> = ({ app }) => {
  const existingSettings = useAppStore((state) => state.appSettings[app.name])
  const getAppSettings = useAppStore((state) => state.getAppSettings)
  const setAppSettings = useAppStore((state) => state.setAppSettings)
  const [appSettings, setAppData] = useState<AppSettingsType | null>(null)
  const [changed, setChanges] = useState(false)
  const [loading, setLoading] = useState(false)
  // List of all settings that depend on another setting
  const [disabledSettingsMap, setDisabledSettingsMap] = useState<Record<string, SettingsType[]>>({})

  const updateDependantSettings = (
    key: string,
    value: string | number | boolean | string[] | boolean[],
    dependentSetting: SettingsType
  ): void => {
    const condition = dependentSetting.dependsOn?.find((dep) => dep.settingId === key)

    if (!dependentSetting.id || !condition) {
      console.warn(`No valid id or condition found for dependent setting: ${dependentSetting}`)
      return
    }

    let isEnabled = false

    // If isValue is present, setting is enabled only if value matches/is included
    if (condition.isValue !== undefined) {
      if (Array.isArray(value)) {
        isEnabled = value.map(String).includes(String(condition.isValue))
      } else {
        isEnabled = String(value) === String(condition.isValue)
      }
    }

    // If isNot is present, setting is disabled if value matches/is included only if isValue is not true
    if (condition.isNot !== undefined && isEnabled == false) {
      if (Array.isArray(value)) {
        if (value.map(String).includes(String(condition.isNot))) {
          isEnabled = false
        } else {
          isEnabled = true
        }
      } else {
        if (String(value) === String(condition.isNot)) {
          isEnabled = false
        } else {
          isEnabled = true
        }
      }
    }

    // If neither isValue nor isNot is present, apply default logic
    if (condition.isValue === undefined && condition.isNot === undefined) {
      if (typeof value === 'boolean') {
        isEnabled = value
      } else if (typeof value === 'string') {
        isEnabled = value.trim().length > 0
      } else if (Array.isArray(value)) {
        isEnabled = value.length > 0
      } else if (typeof value === 'number') {
        isEnabled = value !== 0
      }
    }

    console.log(
      `Setting ${dependentSetting.id} is now ${isEnabled ? 'enabled' : 'disabled'} based on ${key} change`
    )

    setAppData((prev) =>
      prev
        ? {
            ...prev,
            [dependentSetting.id || 'string']: {
              ...dependentSetting,
              id: dependentSetting.id || 'string',
              disabled: !isEnabled
            }
          }
        : prev
    )
  }

  const updateDisabledSettingsMap = useCallback(
    (settings: AppSettingsType | null = appSettings): void => {
      if (!settings) {
        console.log('No app settings available to update disabled settings map.')
        return
      }

      const newDisabledSettingsMap: Record<string, SettingsType[]> = {}

      // Iterate through appSettings and find settings that depend on others
      Object.entries(settings).forEach(([_key, setting]) => {
        if (setting.dependsOn && setting.dependsOn.length > 0) {
          setting.dependsOn.forEach((dependency) => {
            if (!newDisabledSettingsMap[dependency.settingId]) {
              newDisabledSettingsMap[dependency.settingId] = []
            }

            newDisabledSettingsMap[dependency.settingId].push(setting)

            const otherSetting = settings[dependency.settingId]

            updateDependantSettings(dependency.settingId, otherSetting.value, setting)
          })
        }
      })

      console.log(`Found ${Object.keys(newDisabledSettingsMap).length} settings with dependencies`)

      setDisabledSettingsMap(newDisabledSettingsMap)
    },
    [appSettings, updateDependantSettings]
  )

  const handleSettingChange = useCallback(
    (key: string, value: string | number | boolean | string[] | boolean[]) => {
      setChanges(true)
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

      if (disabledSettingsMap && disabledSettingsMap[key]) {
        // If this setting is a dependency for others, update their values
        disabledSettingsMap[key].forEach((dependentSetting) => {
          updateDependantSettings(key, value, dependentSetting)
        })
      } else {
        console.debug(`No dependent settings found for ${key}, skipping update`)
      }
    },
    [disabledSettingsMap, updateDependantSettings]
  )

  const refreshAppSettings = (): void => {
    setLoading(true)
    const fetchAppData = async (): Promise<void> => {
      try {
        const data = await getAppSettings(app.name)
        data && setAppData(data)
        setChanges(false)
        updateDisabledSettingsMap(data)
      } catch {
        //
      } finally {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500))
        setLoading(false)
      }
    }
    fetchAppData()
  }

  const settingsEntries = useMemo(
    () => (appSettings ? Object.entries(appSettings) : []),
    [appSettings]
  )

  const onSaveClick = async (): Promise<void> => {
    if (!appSettings) return
    setLoading(true)
    try {
      await setAppSettings(app.name, appSettings)
      setChanges(false)
    } catch (error) {
      console.error('Error saving app data:', error)
    }

    await setTimeout(() => {
      setLoading(false)
    }, 500)
  }

  // will ensure that when there are no active changes, the settings will be up-to-date
  useEffect(() => {
    if (changed) return

    if (!existingSettings) {
      getAppSettings(app.name)
    }

    setAppData(existingSettings)
    updateDisabledSettingsMap(existingSettings)
  }, [existingSettings, changed])

  return (
    <div className="w-full h-full p-6 flex flex-col">
      {settingsEntries && settingsEntries.length > 0 ? (
        <div>
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
      ) : (
        <div className="w-full flex-col h-full flex items-center justify-center">
          <h2>No settings found ¯\_(ツ)_/¯</h2>
          <Button
            disabled={loading}
            className="group gap-2 border-cyan-500 border m-5 enabled:hover:bg-cyan-500"
            onClick={refreshAppSettings}
          >
            <p className="">Refresh Settings</p>
            <IconRefresh className="group-disabled:animate-spin-smooth" />
          </Button>
        </div>
      )}
    </div>
  )
}
export default AppSettings
