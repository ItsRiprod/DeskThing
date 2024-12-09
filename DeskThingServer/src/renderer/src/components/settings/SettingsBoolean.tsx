import React from 'react'
import SettingComponent from './SettingComponent'
import { SettingsBoolean } from '@shared/types'
import Button from '../Button'
import { IconToggle } from '@renderer/assets/icons'

interface SettingsBooleanProps {
  setting: SettingsBoolean
  handleSettingChange: (value: number | boolean | string | string[]) => void
  className?: string
}

export const SettingsBooleanComponent: React.FC<SettingsBooleanProps> = ({
  className,
  setting,
  handleSettingChange
}) => {
  return (
    <SettingComponent setting={setting} className={className}>
      <Button onClick={() => handleSettingChange(!setting.value as boolean)}>
        <IconToggle
          iconSize={64}
          checked={setting.value as boolean}
          className={`${setting.value ? 'text-green-500' : 'text-gray-500'} w-full h-full`}
        />
      </Button>
    </SettingComponent>
  )
}
