import React from 'react'
import SettingComponent from './SettingComponent'
import { SettingsFile } from '@deskthing/types'
import { IconFolderOpen } from '@renderer/assets/icons'

interface SettingsFileProps {
  setting: SettingsFile
  handleSettingChange: (value: number | boolean | string | string[]) => void
  className?: string
}

const commonClasses =
  'px-3 py-2 text-black bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
const buttonClasses = 'px-3 py-2 rounded-md mx-1'

/**
 * A React component that renders a settings file input with file selection button.
 *
 * @param props - The component props.
 * @param props.setting - The settings file object, containing the value, fileTypes, and other properties.
 * @param props.handleSettingChange - A function to handle changes to the settings file value.
 * @param props.className - An optional CSS class name to apply to the component.
 */
export const SettingsFileComponent: React.FC<SettingsFileProps> = ({
  className,
  setting,
  handleSettingChange
}) => {
  const handleFileSelect = async (): Promise<void> => {
    try {
      const result = await window.electron.utility.showOpenDialog({
        properties: ['openFile'],
        filters:
          setting.fileTypes?.map((type) => ({
            name: type.name,
            extensions: type.extensions
          })) || []
      })
      if (!result.canceled && result.filePaths?.length > 0) {
        handleSettingChange(result.filePaths[0])
      }
    } catch (error) {
      console.error('Error selecting file:', error)
    }
  }

  return (
    <SettingComponent setting={setting} className={className}>
      <div className="flex items-center">
        {setting.type === 'file' && (
          <>
            <input
              type="text"
              value={setting.value as string}
              readOnly
              placeholder={setting.placeholder || 'Select a file...'}
              className={`${commonClasses} flex-grow`}
            />
            <button
              onClick={handleFileSelect}
              className={`${buttonClasses} border border-emerald-500 text-white hover:bg-emerald-600`}
            >
              <IconFolderOpen />
            </button>
          </>
        )}
      </div>
    </SettingComponent>
  )
}
