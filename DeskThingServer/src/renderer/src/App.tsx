import { useState } from 'react'
import Overlays from './components/Overlays'

import Sidebar from './components/Sidebar'
import ContentArea from './components/ContentArea'
import ErrorBoundary from './components/ErrorBoundary'

export type SidebarView = 'home' | 'apps' | 'client' | 'dev'

function App(): JSX.Element {
  const [currentView, setCurrentView] = useState<SidebarView>('home')

  return (
    <div className="bg-black overflow-hidden">
      <div className="h-screen w-screen justify-center flex flex-wrap sm:flex-nowrap overflow-y-scroll sm:overflow-hidden items-center text-white p-5">
        <ErrorBoundary>
          <Overlays />
          <Sidebar setCurrentView={setCurrentView} currentView={currentView} />
          <ContentArea currentView={currentView} />
        </ErrorBoundary>
      </div>
    </div>
  )
}

export default App
