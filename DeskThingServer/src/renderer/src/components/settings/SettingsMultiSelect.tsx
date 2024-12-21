import React from 'react'
import SettingComponent from './SettingComponent'
import { SettingOption, SettingsMultiSelect } from '@shared/types'
import Select from '../Select'
import { MultiValue } from 'react-select'

interface SettingsMultiSelectProps {
  setting: SettingsMultiSelect
  handleSettingChange: (value: number | boolean | string | string[]) => void
  className?: string
}

/**
 * A React component that renders a multi-select settings option.
 *
 * @param handleSettingChange - A function that is called when the selected options change. It receives the updated array of selected option values.
 * @param className - An optional CSS class name to apply to the component.
 * @param setting - The settings multi-select configuration, including the options, current value, and placeholder.
 * @returns A React element representing the multi-select settings component.
 */
export const SettingsMultiSelectComponent: React.FC<SettingsMultiSelectProps> = ({
  handleSettingChange,
  className,
  setting
}) => {
  return (
    <SettingComponent setting={setting} className={className}>
      <div className="w-96 max-w-s relative">
        <Select
          options={setting.options}
          value={setting.value}
          isMulti={true}
          placeholder={setting.placeholder ?? 'Select...'}
          onChange={(selected) => {
            const selectedValues = selected as MultiValue<SettingOption>
            const currentValues = selectedValues.map((value) => value.value)
            handleSettingChange(currentValues)
          }}
        />
      </div>
    </SettingComponent>
  )
}
