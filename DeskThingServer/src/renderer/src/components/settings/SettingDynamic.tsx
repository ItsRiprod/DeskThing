import React, { ReactNode, Reducer, useCallback, useEffect, useReducer } from 'react'
import SettingComponent from './SettingComponent'
import { SettingsDynamic, SettingsTypeWithoutDynamic, DynamicSettingsValue } from '@shared/types'
import { SETTINGS_COMPONENTS, SettingsProps } from '.'
import Button from '../Button'
import { IconTrash } from '@renderer/assets/icons'

interface SettingsDynamicProps {
  setting: SettingsDynamic
  handleSettingChange: (value: DynamicSettingsValue) => void
  className?: string
}

interface SettingsPropsWithoutDynamic extends Omit<SettingsProps, 'setting'> {
  setting: SettingsTypeWithoutDynamic
}

type SettingsAction =
  | {
      type: 'UPDATE_ENTRY'
      index: number
      key: string
      value: SettingsTypeWithoutDynamic['value']
    }
  | { type: 'ADD_ENTRY'; options: SettingsTypeWithoutDynamic[] }
  | { type: 'REMOVE_ENTRY'; index: number }

const createEmptyEntry = (
  options: SettingsTypeWithoutDynamic[]
): Record<string, SettingsTypeWithoutDynamic['value']> => {
  return options.reduce(
    (acc, option) => ({
      ...acc,
      [option.label]: option.value
    }),
    {}
  )
}

const settingsReducer: Reducer<DynamicSettingsValue, SettingsAction> = (state, action) => {
  switch (action.type) {
    case 'UPDATE_ENTRY':
      return state.map((entry, i) =>
        i === action.index
          ? {
              ...entry,
              [action.key]: action.value
            }
          : entry
      )
    case 'ADD_ENTRY':
      return [...state, createEmptyEntry(action.options)]
    case 'REMOVE_ENTRY':
      return state.filter((_, i) => i !== action.index)
    default:
      return state
  }
}

const settingRenderer = ({
  setting,
  className,
  handleSettingChange
}: SettingsPropsWithoutDynamic): ReactNode => {
  const SettingComponent = SETTINGS_COMPONENTS[setting.type] as React.ComponentType<{
    setting: SettingsTypeWithoutDynamic
    handleSettingChange: (value: SettingsTypeWithoutDynamic['value']) => void
    className?: string
  }>

  return SettingComponent ? (
    <SettingComponent
      setting={setting}
      className={className}
      handleSettingChange={handleSettingChange}
    />
  ) : null
}

const createInitialState = (setting: SettingsDynamic): DynamicSettingsValue => {
  return setting.value || [createEmptyEntry(setting.options)]
}

export const SettingsDynamicComponent: React.FC<SettingsDynamicProps> = ({
  className,
  setting,
  handleSettingChange
}: SettingsDynamicProps) => {
  const [state, dispatch] = useReducer(settingsReducer, setting, createInitialState)

  useEffect(() => {
    handleSettingChange(state)
  }, [state, handleSettingChange])

  const handleChange = useCallback(
    (index: number, key: string, value: SettingsTypeWithoutDynamic['value']): void => {
      dispatch({
        type: 'UPDATE_ENTRY',
        index,
        key,
        value
      })
    },
    []
  )

  const handleAddEntry = useCallback(() => {
    dispatch({ type: 'ADD_ENTRY', options: setting.options })
  }, [setting.options])

  const handleRemoveEntry = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_ENTRY', index })
  }, [])

  const renderEntry = useCallback(
    (index: number): ReturnType<typeof settingRenderer>[] => {
      return setting.options.map((option) => {
        const currentValue = state[index]?.[option.label]

        return settingRenderer({
          setting: {
            ...option,
            value: currentValue ?? option.value
          } as Extract<SettingsTypeWithoutDynamic, { type: typeof option.type }>,
          className: 'flex flex-col',
          handleSettingChange: (value) =>
            handleChange(index, option.label, value as SettingsTypeWithoutDynamic['value'])
        })
      })
    },
    [setting.options, state, handleChange]
  )

  return (
    <SettingComponent setting={setting} className={className}>
      {state.map((_, index) => (
        <div key={index} className="flex flex-col gap-4 mb-4">
          <div className="flex items-center flex-col w-full">
            {renderEntry(index)}
            {state.length > 1 && (
              <Button
                className="justify-center gap-2 hover:bg-red-500 border-red-500 border w-10 shrink-0"
                onClick={() => handleRemoveEntry(index)}
              >
                <IconTrash iconSize={64} className="w-full h-full text-red-500" />
              </Button>
            )}
          </div>
        </div>
      ))}

      <button
        onClick={handleAddEntry}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add New Entry
      </button>

      <code>
        <pre>{JSON.stringify(state, null, 2)}</pre>
      </code>
    </SettingComponent>
  )
}
