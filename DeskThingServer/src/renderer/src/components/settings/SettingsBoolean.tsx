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
/**
 * A React component that renders a boolean setting with a toggle button.
 *
 * @param className - An optional CSS class name to apply to the component.
 * @param setting - The boolean setting to be rendered.
 * @param handleSettingChange - A function to be called when the setting is changed, with the new value as a parameter.
 */
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
