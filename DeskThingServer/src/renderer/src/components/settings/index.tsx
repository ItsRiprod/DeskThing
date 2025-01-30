import React from 'react'
import { SettingsType } from '@shared/types/index.ts'
import { SettingsBooleanComponent } from './SettingsBoolean.tsx'
import { SettingsListComponent } from './SettingsList.tsx'
import { SettingsMultiSelectComponent } from './SettingsMultiSelect.tsx'
import { SettingsNumberComponent } from './SettingsNumber.tsx'
import { SettingsRangeComponent } from './SettingsRange.tsx'
import { SettingsRankedComponent } from './SettingsRanked.tsx'
import { SettingsSelectComponent } from './SettingsSelect.tsx'
import { SettingsStringComponent } from './SettingsString.tsx'
import { SettingsColorComponent } from './SettingsColor.tsx'

export interface SettingsProps {
  setting: SettingsType
  handleSettingChange: (value: number | boolean | string | string[]) => void
  className?: string
}

const SETTINGS_COMPONENTS: {
  [K in SettingsType['type']]: React.ComponentType<{
    setting: SettingsType & { type: K }
    handleSettingChange: (value: number | boolean | string | string[]) => void
    className?: string
  }>
} = {
  boolean: SettingsBooleanComponent,
  list: SettingsListComponent,
  multiselect: SettingsMultiSelectComponent,
  number: SettingsNumberComponent,
  range: SettingsRangeComponent,
  ranked: SettingsRankedComponent,
  select: SettingsSelectComponent,
  string: SettingsStringComponent,
  color: SettingsColorComponent
} as const

export const Settings: React.FC<SettingsProps> = ({ setting, className, handleSettingChange }) => {
  const SettingComponent = SETTINGS_COMPONENTS[setting.type] as React.ComponentType<{
    setting: SettingsType
    handleSettingChange: (value: number | boolean | string | string[]) => void
    className?: string
  }>
  return SettingComponent ? (
    <SettingComponent
      setting={setting}
      className={className}
      handleSettingChange={handleSettingChange}
    />
  ) : null
}

export default Settings
