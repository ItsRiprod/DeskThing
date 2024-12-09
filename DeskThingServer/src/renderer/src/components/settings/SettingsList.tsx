import React from 'react'
import SettingComponent from './SettingComponent'
import { SettingsList } from '@shared/types'
import TagList from '../TagList'

interface SettingsListProps {
  setting: SettingsList
  handleSettingChange: (value: number | boolean | string | string[]) => void
  className?: string
}

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
