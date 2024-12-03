import React from 'react'
import SettingComponent from './SettingComponent'
import { SettingsRanked } from '@shared/types'
import RankableList from '../RankableList'

interface SettingsRankedProps {
  setting: SettingsRanked
  handleSettingChange: (value: number | boolean | string | string[]) => void
  className?: string
}

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
