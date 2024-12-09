import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import QROverlay from '@renderer/overlays/QROverlay'
import SettingsOverlay from './settings/SettingsOverlay'
import NotificationOverlay from './notifications/NotificationOverlay'
import AppsOverlay from './apps/AppsOverlay'
import AddProfileOverlay from './AddProfile.'

const overlays = {
  qr: QROverlay,
  settings: SettingsOverlay,
  notifications: NotificationOverlay,
  app: AppsOverlay,
  addProfile: AddProfileOverlay
}

const OverlayWrapper: React.FC<React.PropsWithChildren> = ({
  children
}: React.PropsWithChildren) => {
  const [searchParams] = useSearchParams()
  const [activeOverlays, setActiveOverlays] = useState<string[]>([])

  useEffect(() => {
    const newActiveOverlays = Object.keys(overlays).filter(
      (key) => searchParams.get(key) === 'true'
    )
    setActiveOverlays(newActiveOverlays)
  }, [searchParams])

  return (
    <>
      {activeOverlays.map((key) => {
        const OverlayComponent = overlays[key]
        return <OverlayComponent key={key} />
      })}
      {children}
    </>
  )
}

export default OverlayWrapper
