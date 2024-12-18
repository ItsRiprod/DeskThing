import React, { useEffect, useReducer, useCallback } from 'react'
import { useAppStore } from '@renderer/stores'
import { AppDataInterface, SettingsOutputValue, SettingsType } from '@shared/types'
import { AppSettingProps } from './AppsOverlay'
import Button from '@renderer/components/Button'
import { IconLoading, IconSave } from '@renderer/assets/icons'
import Settings from '@renderer/components/settings'

type SettingsState = {
  settings: Map<string, SettingsType>
  loaded: boolean
  loading: boolean
}

type SettingsAction =
  | { type: 'INIT_SETTINGS'; payload: AppDataInterface | null }
  | { type: 'UPDATE_SETTING'; payload: { key: string; value: SettingsOutputValue } }
  | { type: 'SET_LOADING'; payload: boolean }

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'INIT_SETTINGS': {
      if (!action.payload) {
        return {
          ...state
        }
      }

      const settingsMap = new Map(Object.entries(action.payload.settings || {}))
      return {
        ...state,
        settings: settingsMap,
        loaded: true
      }
    }
    case 'UPDATE_SETTING': {
      const newSettings = new Map(state.settings)
      const currentSetting = newSettings.get(action.payload.key)
      if (currentSetting) {
        newSettings.set(action.payload.key, {
          ...currentSetting,
          value: action.payload.value
        } as Extract<SettingsType, { type: typeof currentSetting.type }>)
      }
      return {
        ...state,
        settings: newSettings
      }
    }
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }
    default:
      return state
  }
}

const AppSettings: React.FC<AppSettingProps> = ({ app }) => {
  const getAppData = useAppStore((state) => state.getAppData)
  const saveAppData = useAppStore((state) => state.setAppData)

  const [state, dispatch] = useReducer(settingsReducer, {
    settings: new Map(),
    loaded: false,
    loading: false
  })

  useEffect(() => {
    const fetchAppData = async (): Promise<void> => {
      const data = await getAppData(app.name)
      dispatch({ type: 'INIT_SETTINGS', payload: data })
    }
    fetchAppData()
  }, [app.name, getAppData])

  const handleSettingChange = useCallback((key: string, value: SettingsOutputValue) => {
    dispatch({ type: 'UPDATE_SETTING', payload: { key, value } })
  }, [])

  const onSaveClick = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const appData: AppDataInterface = {
        ...(await getAppData(app.name)),
        settings: Object.fromEntries(state.settings)
      }

      saveAppData(app.name, appData)
    } catch (error) {
      console.error('Error saving app data:', error)
    }
    setTimeout(() => {
      dispatch({ type: 'SET_LOADING', payload: false })
    }, 500)
  }

  const settingsEntries = Array.from(state.settings.entries())

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
          className={`border-green-500 border group gap-2 ${state.loading ? 'text-gray-100 bg-green-600' : 'hover:bg-green-500'}`}
          onClick={onSaveClick}
          disabled={state.loading}
        >
          {state.loading ? <IconLoading /> : <IconSave className="stroke-2" />}
          <p>{state.loading ? 'Saving' : 'Save'}</p>
        </Button>
      </div>
    </div>
  )
}

export default AppSettings
