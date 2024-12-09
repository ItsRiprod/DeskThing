import React from 'react'
import SettingComponent from './SettingComponent'
import { SettingsRange } from '@shared/types'

interface SettingsRangeProps {
  setting: SettingsRange
  handleSettingChange: (value: number | boolean | string | string[]) => void
  className?: string
}

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
