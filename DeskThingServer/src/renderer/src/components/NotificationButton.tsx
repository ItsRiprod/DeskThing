import { IconBell } from '@renderer/assets/icons'
import React, { useState } from 'react'
import Button from './Button'
import NotificationOverlay from '@renderer/overlays/NotificationOverlay'

const NotificationButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {isOpen && <NotificationOverlay onClose={() => setIsOpen(false)} />}
      <Button
        onClick={() => setIsOpen(true)}
        className="flex-row flex fill-gray-600 hover:bg-gray-600 hover:text-black hover:border-gray-600 text-gray-600 sm:border p-2 rounded-xl border-zinc-500"
      >
        <IconBell iconSize={24} strokeWidth={2} />
        <p className="flex-grow text-center text-lg md:block hidden">Notifications</p>
      </Button>
    </>
  )
}

export default NotificationButton
