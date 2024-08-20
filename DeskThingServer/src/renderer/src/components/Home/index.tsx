import { useState } from 'react'
import Devices from './Devices'
import Dashboard from './Dashboard'
import Tabs, { View } from '../Tabs'

const Index = (): JSX.Element => {
  const views: View[] = [
    { id: 'dashboard', display: 'Dashboard' },
    { id: 'devices', display: 'Devices' }
  ]
  const [currentView, setCurrentView] = useState<View>(views[0])
  const renderView = (): JSX.Element | undefined => {
    switch (currentView.id) {
      case 'devices':
        return <Devices />
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
