import { IconGear } from '@renderer/assets/icons'
import React from 'react'
import Button from './Button'
import { useSearchParams } from 'react-router-dom'

const SettingsButton: React.FC = () => {
  const [_searchParams, setSearchParams] = useSearchParams()

  const handleOpenSettings = (): void => {
    setSearchParams({ settings: 'true' })
  }

  return (
    <>
      <Button className="hover:bg-zinc-900" onClick={handleOpenSettings}>
        <IconGear iconSize={24} strokeWidth={2} />
        <p className="flex-grow text-center text-lg md:block hidden">Settings</p>
      </Button>
    </>
  )
}

export default SettingsButton
