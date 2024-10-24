import React from 'react'
import { AppSettingProps } from './AppsOverlay'
import Button from '@renderer/components/Button'
import { IconPlay, IconX } from '@renderer/assets/icons'

const AppActions: React.FC<AppSettingProps> = ({ app }: AppSettingProps) => {

  const handlePurge = (): void => {
    window.electron.purgeApp(app.name)
  }

  return (
    <div className="w-full h-full p-4 flex flex-col divide-y-2 divide-gray-500">
      <Button>
        <IconPlay />
        <p>Do Stuff</p>
      </Button>
      <Button onClick={handlePurge} className="hover:bg-red-500">
        <IconX />
        <p>Purge</p>
      </Button>
    </div>
  )
}

export default AppActions
