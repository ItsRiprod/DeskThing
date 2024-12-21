import React from 'react'
import SettingComponent from './SettingComponent'
import { SettingOption, SettingsSelect } from '@shared/types'
import { SingleValue } from 'react-select'
import Select from '../Select'

interface SettingsSelectProps {
  setting: SettingsSelect
  handleSettingChange: (value: number | boolean | string | string[]) => void
  className?: string
}

/**
 * A React component that renders a settings select input.
 *
 * @param setting - The settings select configuration object.
 * @param handleSettingChange - A function to handle changes to the setting value.
 * @param className - An optional CSS class name to apply to the component.
 */
export const SettingsSelectComponent: React.FC<SettingsSelectProps> = ({
  handleSettingChange,
  className,
  setting
}) => {
  return (
    <SettingComponent setting={setting} className={className}>
      {setting.type == 'select' && (
        <div className="w-96 max-w-s">
          <Select
            options={setting.options}
            placeholder={setting.placeholder ?? ''}
            value={setting.value}
            onChange={(selected) => {
              const selectedValue = selected as SingleValue<SettingOption>
              handleSettingChange(selectedValue!.value)
            }}
          />
        </div>
      )}
    </SettingComponent>
  )
}
