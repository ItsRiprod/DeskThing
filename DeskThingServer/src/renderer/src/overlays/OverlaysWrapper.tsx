import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import QROverlay from '@renderer/overlays/QROverlay.tsx'
import SettingsOverlay from './settings/SettingsOverlay.tsx'
import NotificationOverlay from './notifications/NotificationOverlay.tsx'
import AppsOverlay from './apps/AppsOverlay.tsx'
import AddProfileOverlay from './AddProfile.tsx'

const overlays = {
  qr: QROverlay,
  settings: SettingsOverlay,
  notifications: NotificationOverlay,
  app: AppsOverlay,
  addProfile: AddProfileOverlay
} as const;

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
