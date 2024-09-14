import { useState } from 'react'
import Apps from './Apps'
import Web from './Web'
import Tabs, { View } from '../../components/Tabs'

const Index = (): JSX.Element => {
  const views: View[] = [
    { id: 'apps', display: 'Apps List' },
    { id: 'web', display: 'App Downloads' }
  ]
  const [currentView, setCurrentView] = useState<View>(views[0])
  const renderView = (): JSX.Element | undefined => {
    switch (currentView.id) {
      case 'apps':
        return <Apps />
      case 'web':
        return <Web />
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
