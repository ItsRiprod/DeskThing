import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import QROverlay from '@renderer/overlays/modals/QROverlay'
import SettingsOverlay from '../settings/SettingsOverlay'
import NotificationOverlay from '../notifications/NotificationOverlay'
import AppsOverlay from '../apps/AppsOverlay'
import AddProfileOverlay from './AddProfile.'
import UpdateOverlay from '../UpdateOverlay'
import useUpdateStore from '@renderer/stores/updateStore'
import useTaskStore from '@renderer/stores/taskStore'
import TaskOverlay from './TaskOverlay'
import FeedbackOverlay from './FeedbackOverlay'
import SetupOverlay from '../setup/SetupOverlay'
import { useSettingsStore } from '@renderer/stores'
import LinkRequestOverlay from './LinkRequestOverlay'
import ProgressPopup from '../ProgressPopup'
import ViewProgressLogs from './ViewProgressLogs'

const overlays = {
  qr: QROverlay,
  settings: SettingsOverlay,
  notifications: NotificationOverlay,
  app: AppsOverlay,
  addProfile: AddProfileOverlay,
  feedback: FeedbackOverlay,
  setup: SetupOverlay,
  progress: ViewProgressLogs
}

const OverlayWrapper: React.FC<React.PropsWithChildren> = ({
  children
}: React.PropsWithChildren) => {
  const [searchParams] = useSearchParams()
  const [activeOverlays, setActiveOverlays] = useState<string[]>([])
  const update = useUpdateStore((state) => state.update)
  const currentTask = useTaskStore((state) => state.currentTask)
  const activeRequests = useSettingsStore((state) => state.activeRequests)

  useEffect(() => {
    const newActiveOverlays = Object.keys(overlays).filter(
      (key) => searchParams.get(key) === 'true'
    )
    setActiveOverlays(newActiveOverlays)
  }, [searchParams])

  const memoizedChildren = useMemo(() => children, [children])

  return (
    <>
      {activeRequests.length > 0 && <LinkRequestOverlay />}
      {(update.updateAvailable || update.updateDownloaded) && <UpdateOverlay />}
      {activeOverlays.map((key) => {
        const OverlayComponent = overlays[key]
        return <OverlayComponent key={key} />
      })}
      <ProgressPopup />
      {memoizedChildren}
      {currentTask && <TaskOverlay />}
    </>
  )
}

export default OverlayWrapper
