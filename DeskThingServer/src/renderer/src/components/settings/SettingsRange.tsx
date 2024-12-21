import React from 'react'
import SettingComponent from './SettingComponent'
import { SettingsRange } from '@shared/types'

interface SettingsRangeProps {
  setting: SettingsRange
  handleSettingChange: (value: number | boolean | string | string[]) => void
  className?: string
}

/**
 * A React component that renders a settings range input.
 *
 * @param className - An optional CSS class name to apply to the component.
 * @param setting - The settings range object, which includes the value, min, max, and step properties.
 * @param handleSettingChange - A function to call when the range input value changes, passing the new value.
 */
export const SettingsRangeComponent: React.FC<SettingsRangeProps> = ({
  className,
  setting,
  handleSettingChange
}) => {
  return (
    <SettingComponent setting={setting} className={className}>
      {setting.type == 'range' && (
        <input
          type="range"
          value={setting.value}
          min={setting.min}
          max={setting.max}
          step={setting.step || 1}
          onChange={(e) => handleSettingChange(e.target.value)}
          className="w-96 max-w-s"
        />
      )}
    </SettingComponent>
  )
}
