import React, { useState, useEffect } from 'react'
import SettingComponent from './SettingComponent'
import { SettingsColor } from '@deskthing/types'

interface SettingsColorProps {
  setting: SettingsColor
  handleSettingChange: (value: number | boolean | string | string[]) => void
  className?: string
}

/**
 * A React component that renders a color setting with a color picker input.
 *
 * @param {SettingsColorProps} props - The component props.
 * @param {SettingsColor} props.setting - The color setting object.
 * @param {(value: number | boolean | string | string[]) => void} props.handleSettingChange - A function to handle changes to the setting value.
 * @param {string} [props.className] - An optional CSS class name to apply to the component.
 * @returns {React.ReactElement} - The rendered SettingsColorComponent.
 */
export const SettingsColorComponent: React.FC<SettingsColorProps> = ({
  handleSettingChange,
  className,
  setting
}) => {
  const [localValue, setLocalValue] = useState(setting.value)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== setting.value) {
        handleSettingChange(localValue)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [localValue, setting.value, handleSettingChange])

  useEffect(() => {
    if (setting.value !== localValue) {
      setLocalValue(setting.value)
    }
  }, [setting])

  return (
    <SettingComponent setting={setting} className={className}>
      <div className="max-w-[100px] relative flex justify-end items-center">
        <span className="mr-2 text-white">{localValue}</span>
        <div className="relative">
          <input
            type="color"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="w-12 h-8 rounded cursor-pointer"
          />
        </div>
      </div>
    </SettingComponent>
  )
}
