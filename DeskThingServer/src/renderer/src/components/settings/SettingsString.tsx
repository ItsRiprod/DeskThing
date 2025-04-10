import React, { useState } from 'react'
import SettingComponent from './SettingComponent'
import { SettingsString } from '@deskthing/types'

interface SettingsStringProps {
  setting: SettingsString
  handleSettingChange: (value: number | boolean | string | string[]) => void
  className?: string
}

const commonClasses =
  'px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'

/**
 * A React component that renders a string setting with a text input field.
 *
 * @param setting - The settings string object containing the value and max length.
 * @param handleSettingChange - A function to handle changes to the setting value.
 * @param className - An optional CSS class name to apply to the component.
 */
export const SettingsStringComponent: React.FC<SettingsStringProps> = ({
  className,
  setting,
  handleSettingChange
}) => {
  const [currentValue, setCurrentValue] = useState(setting.value)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const handleChange = (value: string): void => {
    setCurrentValue(value)

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    const newTimeoutId = setTimeout(() => {
      handleSettingChange(value)
    }, 200)

    setTimeoutId(newTimeoutId)
  }

  return (
    <SettingComponent setting={setting} className={className}>
      <div className="flex items-center w-full">
        <input
          type="text"
          value={currentValue}
          maxLength={(setting as SettingsString).maxLength}
          onChange={(e) => handleChange(e.target.value)}
          className={commonClasses + ' text-black w-96 max-w-s'}
        />
      </div>
    </SettingComponent>
  )
}
