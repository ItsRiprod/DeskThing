import React from 'react'
import Overlay from '../Overlay'
import { IconGear, IconLogs, IconPlay } from '@renderer/assets/icons'
import Button from '@renderer/components/Button'
import { useSearchParams } from 'react-router-dom'
import AppActions from './AppActions'
import AppDetails from './AppDetails'
import AppSettings from './AppSettings'
import { App } from '@shared/types'
import { useAppStore } from '@renderer/stores'

export interface AppSettingProps {
  app: App
}

const settingsPages = [
  { key: 'actions', label: 'Actions', Icon: IconPlay },
  { key: 'details', label: 'Details', Icon: IconLogs },
  { key: 'settings', label: 'Settings', Icon: IconGear }
]

/**
 * ClientSettingsOverlay component
 *
 * This component renders an overlay for managing client settings.
 * It allows users to view and modify various client configuration options.
 *
 */
const AppsOverlay: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPage = searchParams.get('page') || 'details'

  const appId = searchParams.get('appId')

  const app = useAppStore((state) => state.appsList.find((app) => app.name === appId))

  if (!app) return null

  const onClose = (): void => {
    searchParams.delete('app')
    searchParams.delete('appId')
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
      <div className="w-full py-4 bg-zinc-900 px-5">
        <h1 className="font-semibold text-2xl">{app.manifest?.label || appId} Settings</h1>
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
        <div className="w-full h-full relative overflow-auto">
          <div className="absolute inset w-full h-full">
            {currentPage == 'actions' && <AppActions app={app} />}
            {currentPage == 'details' && <AppDetails app={app} />}
            {currentPage == 'settings' && <AppSettings app={app} />}
          </div>
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

export default AppsOverlay
