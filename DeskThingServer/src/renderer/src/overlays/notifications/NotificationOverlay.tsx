import React, { useMemo } from 'react'
import Overlay from '../Overlay'
import Button from '@renderer/components/Button'
import { IconBell, IconLayoutgrid, IconLogs, IconWarning } from '@renderer/assets/icons'
import EvensPage from './EventsPage'
import { useNotificationStore } from '@renderer/stores/'
import RequestsPage from './RequestsPage'
import TasksPage from './TasksPage'
import IssuesPage from './IssuesPage'
import { useSearchParams } from 'react-router-dom'
import useTaskStore from '@renderer/stores/taskStore'
import ErrorBoundary from '@renderer/components/ErrorBoundary'

const NotificationOverlay: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const notificationState = useNotificationStore((state) => state)
  const taskList = useTaskStore((state) => state.taskList)
  const page = searchParams.get('page') || 'task'

  const NotificationPage = useMemo(() => {
    switch (page) {
      case 'event':
        return <EvensPage />
      case 'request':
        return <RequestsPage />
      case 'task':
        return <TasksPage />
      case 'issue':
        return <IssuesPage />
      default:
        return <EvensPage />
    }
  }, [page])

  const activeTasks = Object.values(taskList)
    .flatMap((appTasks) => Object.values(appTasks))
    .filter((task) => task.completed === false && task.available === true)

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
          <ErrorBoundary>

            <NavComponent
              setPage={setPage}
              page="Task"
              curPage={page}
              value={activeTasks.length}
              Icon={<IconLayoutgrid />}
            />
            <NavComponent
              setPage={setPage}
              page="Event"
              curPage={page}
              value={notificationState.logs.length}
              Icon={<IconLogs />}
            />
            <NavComponent
              setPage={setPage}
              page="Issue"
              curPage={page}
              value={notificationState.issues.length}
              Icon={<IconWarning />}
              className={notificationState.issues.length > 0 ? 'bg-red-600' : ''}
            />
            <NavComponent
              setPage={setPage}
              page="Request"
              curPage={page}
              value={notificationState.requestQueue.length}
              Icon={<IconBell />}
              className="relative"
            >
              {notificationState.requestQueue.length > 0 && (
                <div className="absolute inset-0 rounded w-full h-full animate-pulse border-2 border-blue-500"></div>
              )}
            </NavComponent>
          </ErrorBoundary>
        </div>
        <div className="w-full">
          <ErrorBoundary key={page}>{NotificationPage}</ErrorBoundary>
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
