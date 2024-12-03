import React from 'react'
import SettingComponent from './SettingComponent'
import { SettingsString } from '@shared/types'

interface SettingsStringProps {
  setting: SettingsString
  handleSettingChange: (value: number | boolean | string | string[]) => void
  className?: string
}

const commonClasses =
  'px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'

export const SettingsStringComponent: React.FC<SettingsStringProps> = ({
  className,
  setting,
  handleSettingChange
}) => {
  return (
    <SettingComponent setting={setting} className={className}>
      <div className="flex items-center w-full">
        <input
          type="text"
          value={setting.value as string}
          maxLength={(setting as SettingsString).maxLength}
          onChange={(e) => handleSettingChange(e.target.value)}
          className={commonClasses + ' text-black w-96 max-w-s'}
        />
      </div>
    </SettingComponent>
  )
}
