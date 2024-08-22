import { useState } from 'react'
import Walkthrough from './Walkthrough'
import Dashboard from './Dashboard'
import Tabs, { View } from '../Tabs'

const Index = (): JSX.Element => {
  const views: View[] = [
    { id: 'dashboard', display: 'Dashboard' },
    { id: 'walkthrough', display: 'Walkthrough' }
  ]
  const [currentView, setCurrentView] = useState<View>(views[0])
  const renderView = (): JSX.Element | undefined => {
    switch (currentView.id) {
      case 'walkthrough':
        return <Walkthrough />
      case 'dashboard':
        return <Dashboard />
      default:
        return undefined
    }
  }

  return (
    <>
      <Tabs currentView={currentView} setCurrentView={setCurrentView} views={views} />
      <div className="w-full h-full">{renderView()}</div>
    </>
  )
}

export default Index
