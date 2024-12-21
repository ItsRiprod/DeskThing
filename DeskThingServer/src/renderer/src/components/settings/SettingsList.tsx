import React from 'react'
import SettingComponent from './SettingComponent'
import { SettingsList } from '@shared/types'
import TagList from '../TagList'

interface SettingsListProps {
  setting: SettingsList
  handleSettingChange: (value: number | boolean | string | string[]) => void
  className?: string
}

/**
 * A React component that renders a list of settings with a TagList component.
 *
 * @param {SettingsListProps} props - The props for the SettingsListComponent.
 * @param {SettingsList} props.setting - The setting object to be rendered.
 * @param {(value: number | boolean | string | string[]) => void} props.handleSettingChange - A function to handle changes to the setting value.
 * @param {string} [props.className] - An optional CSS class name to apply to the component.
 * @returns {React.ReactElement} - The rendered SettingsListComponent.
 */
export const SettingsListComponent: React.FC<SettingsListProps> = ({
  handleSettingChange,
  className,
  setting
}) => {
  return (
    <SettingComponent setting={setting} className={className}>
      {setting.type == 'list' && (
        <div className="w-96 max-w-s">
          <TagList
            value={setting.value}
            onChange={(values) => handleSettingChange(values)}
            orderable={setting.orderable}
            unique={setting.unique}
            maxValues={setting.maxValues}
            placeholder={setting.placeholder}
          />
        </div>
      )}
    </SettingComponent>
  )
}
