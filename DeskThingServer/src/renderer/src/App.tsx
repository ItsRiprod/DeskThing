/**
 * The main entry point of the application. Renders the ErrorBoundary, Store, and AppRouter components.
 *
 * @returns {JSX.Element} The root component of the application.
 */
import ErrorBoundary from './components/ErrorBoundary'
import AppRouter from './nav/Router'
import { StoreProvider } from './stores/StoreProvider'

export type SidebarView = 'home' | 'apps' | 'client' | 'dev'

function App(): JSX.Element {
  return (
    <div className="bg-black">
      <div className="h-screen w-screen text-white">
        <ErrorBoundary>
          <StoreProvider />
          <AppRouter />
        </ErrorBoundary>
      </div>
    </div>
  )
}

export default App
