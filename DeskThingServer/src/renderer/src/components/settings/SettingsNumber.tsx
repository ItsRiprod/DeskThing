import React from 'react'
import SettingComponent from './SettingComponent'
import { SettingsNumber } from '@shared/types'

interface SettingsNumberProps {
  setting: SettingsNumber
  handleSettingChange: (value: number | boolean | string | string[]) => void
  className?: string
}

const commonClasses =
  'px-3 py-2 text-black bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
const buttonClasses = 'px-3 py-2 rounded-md mx-1'

/**
 * A React component that renders a settings number input with increment and decrement buttons.
 *
 * @param props - The component props.
 * @param props.setting - The settings number object, containing the value, min, and max properties.
 * @param props.handleSettingChange - A function to handle changes to the settings number value.
 * @param props.className - An optional CSS class name to apply to the component.
 */
export const SettingsNumberComponent: React.FC<SettingsNumberProps> = ({
  className,
  setting,
  handleSettingChange
}) => {
  const clampValue = (value: number, min?: number, max?: number): number => {
    if (min !== undefined && value < min) return min
    if (max !== undefined && value > max) return max
    return value
  }

  const handleIncrement = (): void => {
    const newValue = clampValue((setting.value as number) + 1, setting.min, setting.max)
    handleSettingChange(newValue)
  }

  const handleDecrement = (): void => {
    const newValue = clampValue((setting.value as number) - 1, setting.min, setting.max)
    handleSettingChange(newValue)
  }

  return (
    <SettingComponent setting={setting} className={className}>
      <div className="flex items-center">
        {setting.type == 'number' && (
          <>
            <button onClick={handleDecrement} className={buttonClasses}>
              -
            </button>
            <input
              type="number"
              value={setting.value as number}
              min={setting.min}
              max={setting.max}
              onChange={(e) => {
                let inputValue = Number(e.target.value)
                inputValue = clampValue(inputValue, setting.min, setting.max)
                handleSettingChange(inputValue)
              }}
              className={commonClasses}
            />
            <button onClick={handleIncrement} className={buttonClasses}>
              +
            </button>
          </>
        )}
      </div>
    </SettingComponent>
  )
}
