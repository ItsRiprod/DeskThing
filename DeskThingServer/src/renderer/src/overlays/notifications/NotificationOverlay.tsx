import React from 'react'
import Overlay from '../Overlay'
import Button from '@renderer/components/Button'
import { IconBell, IconLayoutgrid, IconLogs, IconWarning } from '@renderer/assets/icons'
import EvensPage from './EventsPage'
import { useNotificationStore } from '@renderer/stores/'
import RequestsPage from './RequestsPage'
import TasksPage from './TasksPage'
import IssuesPage from './IssuesPage'
import { useSearchParams } from 'react-router-dom'

const NotificationOverlay: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const notifState = useNotificationStore((state) => state)
  const page = searchParams.get('page') || 'event'

  const activeTasks = notifState.tasks.filter(
    (task) => task.status !== 'complete' && task.status !== 'rejected'
  )

  const setPage = (page: string): void => {
    searchParams.set('page', page)
    setSearchParams(searchParams)
  }

  const onClose = (): void => {
    searchParams.delete('notifications')
    setSearchParams(searchParams)
  }

  return (
    <Overlay
      onClose={onClose}
      className="border border-gray-500 w-5/6 h-5/6 flex flex-col overflow-hidden"
    >
      <div className="w-full py-4 bg-zinc-900 px-5">
        <h1 className="font-semibold text-2xl">Notifications</h1>
      </div>
      <div className="flex h-full">
        <div className="border-r border-gray-500 p-2 bg-zinc-900 flex flex-col gap-2">
          <NavComponent
            setPage={setPage}
            page="Event"
            curPage={page}
            value={notifState.logs.length}
            Icon={<IconLogs />}
          />
          <NavComponent
            setPage={setPage}
            page="Issue"
            curPage={page}
            value={notifState.issues.length}
            Icon={<IconWarning />}
            className={notifState.issues.length > 0 ? 'bg-red-600' : ''}
          />
          <NavComponent
            setPage={setPage}
            page="Request"
            curPage={page}
            value={notifState.requestQueue.length}
            Icon={<IconBell />}
            className="relative"
          >
            {notifState.requestQueue.length > 0 && (
              <div className="absolute inset-0 rounded w-full h-full animate-pulse border-2 border-blue-500"></div>
            )}
          </NavComponent>
          <NavComponent
            setPage={setPage}
            page="Task"
            curPage={page}
            value={activeTasks.length}
            Icon={<IconLayoutgrid />}
          />
        </div>
        <div className="w-full">
          {page == 'issue' && <IssuesPage />}
          {page == 'event' && <EvensPage />}
          {page == 'request' && <RequestsPage />}
          {page == 'task' && <TasksPage />}
        </div>
      </div>
    </Overlay>
  )
}
interface NavComponentProps {
  setPage: (app: string) => void
  page: string
  curPage: string
  value: number
  Icon: React.ReactElement
  className?: string
  children?: React.ReactNode
}

const NavComponent = ({
  setPage,
  page,
  curPage,
  value,
  Icon,
  children,
  className
}: NavComponentProps): React.ReactElement => (
  <Button
    onClick={() => setPage(page.toLowerCase())}
    className={`relative gap-2 ${curPage == page.toLowerCase() ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-900 hover:bg-zinc-800'} ${value == 0 && 'text-gray-500'} ${className}`}
  >
    {value > 0 && <p>{value}</p>}
    <div className="md:hidden block">{Icon}</div>
    <p className="hidden md:block">
      {page}
      {value != 1 && 's'}
      {children}
    </p>
  </Button>
)

export default NotificationOverlay
