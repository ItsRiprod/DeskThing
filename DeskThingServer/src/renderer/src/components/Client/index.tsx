import { useState } from 'react'
import Devices from './Devices'
import Loading from '../Loading'
import Client from './Client'
import Tabs, { View } from '../Tabs'

const Index = (): JSX.Element => {
  const views: View[] = [
    { id: 'status', display: 'Status' },
    { id: 'mappings', display: 'Button Maps' },
    { id: 'local', display: 'Local Client' },
    { id: 'client', display: 'Client Downloads' }
  ]
  const [currentView, setCurrentView] = useState<View>(views[0])
  const renderView = (): JSX.Element | undefined => {
    switch (currentView.id) {
      case 'mappings':
        return <Devices />
      case 'status':
        return <Loading message="Not Implemented" />
      case 'local':
        return <Loading message="Not Implemented" />
      case 'client':
        return <Client />
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
