import React, { useMemo } from 'react'
import Overlay from '../Overlay'
import Button from '@renderer/components/Button'
import { IconBluetooth, IconCarThingSmall, IconLink, IconMobile } from '@renderer/assets/icons'
import { useSearchParams } from 'react-router-dom'
import ErrorBoundary from '@renderer/components/ErrorBoundary'
import BluetoothPage from './BluetoothPage'
import WifiPage from './WifiPage'
import AdbPage from './AdbPage'

const PAGE_COMPONENTS = {
  bluetooth: BluetoothPage,
  wifi: WifiPage,
  task: AdbPage,
  default: AdbPage
}

const SetupOverlay: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = searchParams.get('page') || 'event'

  const SetupPage = useMemo(() => {
    return PAGE_COMPONENTS[page] || PAGE_COMPONENTS.default
  }, [page])

  const setPage = (page: string): void => {
    searchParams.set('page', page)
    setSearchParams(searchParams)
  }

  const onClose = (): void => {
    searchParams.delete('setup')
    setSearchParams(searchParams)
  }

  const openClient = (): void => {
    window.electron.client.openClient()
  }

  return (
    <Overlay
      onClose={onClose}
      className="border border-gray-500 w-5/6 h-5/6 flex flex-col overflow-y-auto"
    >
      <div className="w-full py-4 bg-zinc-900 px-5">
        <h1 className="font-semibold text-2xl">Setup Device</h1>
      </div>
      <div className="flex h-full">
        <div className="border-r border-gray-500 p-2 bg-zinc-900 flex flex-col gap-2">
          <NavComponent setPage={setPage} page="Bluetooth" curPage={page} Icon={IconBluetooth} />
          <NavComponent
            setPage={setPage}
            page="WiFi"
            curPage={page}
            Icon={IconMobile}
            className={''}
          />
          <NavComponent
            setPage={setPage}
            page="ADB"
            curPage={page}
            Icon={IconCarThingSmall}
            className="relative"
          />
          <Button onClick={openClient} className={`relative gap-2 bg-zinc-900 hover:bg-zinc-800`}>
            <IconLink iconSize="28" strokeWidth={2} />
            <p className="hidden md:block">Client</p>
          </Button>
        </div>
        <div className="flex w-full max-h-full h-full overflow-y-scroll">
          <ErrorBoundary key={page}>
            <div className="w-full h-full relative">
              <div className="absolute inset-0 w-full h-full">
                <SetupPage />
              </div>
            </div>
          </ErrorBoundary>
        </div>
      </div>
    </Overlay>
  )
}
interface NavComponentProps {
  setPage: (app: string) => void
  page: string
  curPage: string
  Icon: React.ElementType
  className?: string
  children?: React.ReactNode
}

const NavComponent = ({
  setPage,
  page,
  curPage,
  Icon,
  children,
  className
}: NavComponentProps): React.ReactElement => (
  <Button
    onClick={() => setPage(page.toLowerCase())}
    className={`relative gap-2 ${curPage == page.toLowerCase() ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-900 hover:bg-zinc-800'} ${className}`}
  >
    <Icon iconSize="28" strokeWidth={2} />
    <p className="hidden md:block">
      {page}
      {children}
    </p>
  </Button>
)

export default SetupOverlay
