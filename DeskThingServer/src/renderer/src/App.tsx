import ErrorBoundary from '@renderer/components/ErrorBoundary.tsx'
import AppRouter from '@renderer/nav/Router.tsx'
import Store from '@renderer/stores/Store.tsx'

export type SidebarView = 'home' | 'apps' | 'client' | 'dev'

export default function App(): JSX.Element {
  return (
    <div className="bg-black">
      <div className="h-screen w-screen text-white">
        <ErrorBoundary>
          <Store>
            <AppRouter />
          </Store>
        </ErrorBoundary>
      </div>
    </div>
  )
}
