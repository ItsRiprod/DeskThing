import React, { useState } from 'react'
import Overlay from '../Overlay'
import { IconCarThingSmall, IconComputer, IconServer } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'

interface SettingsOverlayProps {
  onClose: () => void
}

/**
 * ClientSettingsOverlay component
 *
 * This component renders an overlay for managing client settings.
 * It allows users to view and modify various client configuration options.
 *
 * @component
 * @param {Object} props - The component props
 * @param {() => void} props.onClose - Function to call when closing the overlay
 */
const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ onClose }) => {
  const [page, setPage] = useState('server')

  return (
    <Overlay
      onClose={onClose}
      className="border border-gray-500 w-5/6 h-5/6 flex flex-col overflow-hidden"
    >
      <div className="w-full py-4 bg-zinc-900 px-5">
        <h1 className="font-semibold text-2xl">Settings</h1>
      </div>
      <div className="flex h-full">
        <div className="border-r border-gray-500 p-2 bg-zinc-900 flex flex-col gap-2">
          <SettingsComponent setPage={setPage} page="Server" curPage={page}>
            <IconServer strokeWidth={2} />
          </SettingsComponent>
          <SettingsComponent setPage={setPage} page="Client" curPage={page}>
            <IconComputer strokeWidth={2} />
          </SettingsComponent>
          <SettingsComponent setPage={setPage} page="Device" curPage={page}>
            <IconCarThingSmall strokeWidth={3} />
          </SettingsComponent>
        </div>
        <div className="w-full">
          {page == 'issues' && <IssuesPage />}
          {page == 'logs' && <LogsPage />}
          {page == 'requests' && <RequestsPage />}
        </div>
      </div>
    </Overlay>
  )
}
interface SettingsComponentProps {
  setPage: (app: string) => void
  page: string
  curPage: string
  children: React.ReactElement
}

const SettingsComponent = ({
  setPage,
  page,
  curPage,
  children
}: SettingsComponentProps): React.ReactElement => (
  <Button
    onClick={() => setPage(page.toLowerCase())}
    className={`gap-2 ${curPage == page.toLowerCase() ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-900 hover:bg-zinc-800'}`}
  >
    {children}
    <p className="hidden md:block">{page}</p>
  </Button>
)

export default SettingsOverlay
