import { IconGear } from '@renderer/assets/icons/index.ts'
import React from 'react'
import Button from './Button.tsx'
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
        <p className="grow text-center text-lg md:block hidden">Settings</p>
      </Button>
    </>
  )
}

export default SettingsButton
