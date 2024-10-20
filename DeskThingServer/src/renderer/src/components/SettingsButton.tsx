import { IconGear } from '@renderer/assets/icons'
import React, { useState } from 'react'
import Button from './Button'
import SettingsOverlay from '@renderer/overlays/settings/SettingsOverlay'

const SettingsButton: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
      {showSettings && <SettingsOverlay onClose={() => setShowSettings(false)} />}
      <Button className="hover:bg-zinc-900" onClick={() => setShowSettings(true)}>
        <IconGear iconSize={24} strokeWidth={2} />
        <p className="flex-grow text-center text-lg md:block hidden">Settings</p>
      </Button>
    </>
  )
}

export default SettingsButton
