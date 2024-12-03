import React from 'react'
import Overlay from '../Overlay'
import { IconCarThingSmall, IconComputer, IconMusic, IconServer } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import ClientSettings from './ClientSettings'
import DeviceSettings from './DeviceSettings'
import ServerSettings from './ServerSettings'
import { useSearchParams } from 'react-router-dom'
import MusicSettings from './MusicSettings'

const settingsPages = [
  { key: 'server', label: 'Server', Icon: IconServer },
  { key: 'client', label: 'Client', Icon: IconComputer },
  { key: 'device', label: 'Device', Icon: IconCarThingSmall },
  { key: 'music', label: 'Music', Icon: IconMusic }
]

/**
 * ClientSettingsOverlay component
 *
 * This component renders an overlay for managing client settings.
 * It allows users to view and modify various client configuration options.
 *
 */
const SettingsOverlay: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPage = searchParams.get('page') || 'server'

  const onClose = (): void => {
    searchParams.delete('settings')
    setSearchParams(searchParams)
  }

  const setCurrentPage = (page: string): void => {
    searchParams.set('page', page)
    setSearchParams(searchParams)
  }

  return (
    <Overlay
      onClose={onClose}
      className="border border-gray-500 w-5/6 h-5/6 flex flex-col overflow-hidden"
    >
      <div className="w-full py-4 bg-zinc-900 px-5 border-b border-gray-500">
        <h1 className="font-semibold text-2xl">Settings</h1>
      </div>
      <div className="flex h-full">
        <div className="border-r border-gray-500 p-2 bg-zinc-900 flex flex-col gap-2">
          {settingsPages.map(({ key, label, Icon }) => (
            <SettingsComponent
              key={key}
              setPage={setCurrentPage}
              page={key}
              label={label}
              curPage={currentPage}
              Icon={Icon}
            />
          ))}
        </div>
        <div className="w-full relative overflow-y-auto">
          {currentPage == 'client' && <ClientSettings />}
          {currentPage == 'device' && <DeviceSettings />}
          {currentPage == 'server' && <ServerSettings />}
          {currentPage == 'music' && <MusicSettings />}
        </div>
      </div>
    </Overlay>
  )
}
interface SettingsComponentProps {
  setPage: (app: string) => void
  page: string
  label: string
  curPage: string
  Icon: React.ComponentType<{ strokeWidth: number }>
}

const SettingsComponent = ({
  setPage,
  page,
  label,
  curPage,
  Icon
}: SettingsComponentProps): React.ReactElement => (
  <Button
    onClick={() => setPage(page)}
    className={`gap-2 ${curPage == page ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-900 hover:bg-zinc-800'}`}
  >
    <Icon strokeWidth={2} />
    <p className="hidden md:block">{label}</p>
  </Button>
)

export default SettingsOverlay
