import React, { useState, useEffect } from 'react'
import SettingComponent from './SettingComponent'
import { SettingsColor } from '@shared/types'

interface SettingsColorProps {
  setting: SettingsColor
  handleSettingChange: (value: number | boolean | string | string[]) => void
  className?: string
}

export const SettingsColorComponent: React.FC<SettingsColorProps> = ({
  handleSettingChange,
  className,
  setting
}) => {
  const [localValue, setLocalValue] = useState(setting.value)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== setting.value) {
        handleSettingChange(localValue)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [localValue, setting.value, handleSettingChange])

  useEffect(() => {
    if (setting.value !== localValue) {
      setLocalValue(setting.value)
    }
  }, [setting])

  useEffect(() => {
    let promptTimer: NodeJS.Timeout
    if (showPrompt) {
      promptTimer = setTimeout(() => {
        setShowPrompt(false)
      }, 10000)
    }
    return () => clearTimeout(promptTimer)
  }, [showPrompt])

  return (
    <SettingComponent setting={setting} className={className}>
      <div className="max-w-[100px] relative flex justify-end items-center">
        <span className="mr-2 text-white">{localValue}</span>
        <div className="relative">
          <input
            type="color"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="w-12 h-8 rounded cursor-pointer"
            onClick={() => setShowPrompt(true)}
          />
          {showPrompt && (
            <div
              onClick={() => setShowPrompt(false)}
              className="fixed top-4 left-4 z-50 flex items-center rounded-lg bg-green-500 px-4 py-2 text-sm text-white"
            >
              <div className="h-2 w-2 rounded-full bg-white" />
              <p className="ml-2">Click the Scroll Wheel or Enter to close</p>
            </div>
          )}
        </div>
      </div>
    </SettingComponent>
  )
}
