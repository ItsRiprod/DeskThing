import React from 'react'
import { SettingsType } from '@shared/types'
import { SettingsBooleanComponent } from './SettingsBoolean'
import { SettingsListComponent } from './SettingsList'
import { SettingsMultiSelectComponent } from './SettingsMultiSelect'
import { SettingsNumberComponent } from './SettingsNumber'
import { SettingsRangeComponent } from './SettingsRange'
import { SettingsRankedComponent } from './SettingsRanked'
import { SettingsSelectComponent } from './SettingsSelect'
import { SettingsStringComponent } from './SettingsString'
import { SettingsColorComponent } from './SettingsColor'

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

/**
 * The `Settings` component is a React functional component that renders a setting component based on the `type` property of the `setting` prop. It uses the `SETTINGS_COMPONENTS` object to map the `type` to the appropriate setting component. If the `SettingComponent` is found, it is rendered with the `setting`, `className`, and `handleSettingChange` props. Otherwise, it returns `null`.
 * @param param0
 * @returns
 */
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
