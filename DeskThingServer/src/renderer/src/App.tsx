import ErrorBoundary from './components/ErrorBoundary'
import AppRouter from './nav/Router'
import Store from './stores/Store'

export type SidebarView = 'home' | 'apps' | 'client' | 'dev'

function App(): JSX.Element {
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

export default App
