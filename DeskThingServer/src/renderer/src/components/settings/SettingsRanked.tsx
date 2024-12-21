import React from 'react'
import SettingComponent from './SettingComponent'
import { SettingsRanked } from '@shared/types'
import RankableList from '../RankableList'

interface SettingsRankedProps {
  setting: SettingsRanked
  handleSettingChange: (value: number | boolean | string | string[]) => void
  className?: string
}

/**
 * A React component that renders a settings panel for a ranked setting.
 *
 * The component takes in a `SettingsRanked` object, which contains the options and current value for the setting.
 * It renders a `RankableList` component that allows the user to reorder the options.
 * When the user changes the order of the options, the `handleSettingChange` function is called with the new ranked values.
 *
 * @param props - The props for the `SettingsRankedComponent`.
 * @param props.setting - The `SettingsRanked` object containing the options and current value for the setting.
 * @param props.handleSettingChange - A function that is called when the user changes the order of the options.
 * @param props.className - An optional CSS class name to apply to the component.
 */
export const SettingsRankedComponent: React.FC<SettingsRankedProps> = ({
  className,
  setting,
  handleSettingChange
}) => {
  return (
    <SettingComponent setting={setting} className={className}>
      <div className="w-96 max-w-s">
        {setting.type == 'ranked' && (
          <div className="w-96 max-w-s">
            <RankableList
              options={setting.options}
              value={setting.value}
              onChange={(rankedValues) => {
                handleSettingChange(rankedValues)
              }}
            />
          </div>
        )}
      </div>
    </SettingComponent>
  )
}
