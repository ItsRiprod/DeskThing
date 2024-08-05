import { useState } from 'react'
import Apps from './Apps'
import Local from './Local'
import Web from './Web'
import Tabs, { View } from '../Tabs'

const Index = (): JSX.Element => {
  const views: View[] = [
    { id: 'apps', display: 'Apps List' },
    { id: 'local', display: 'Local Apps' },
    { id: 'web', display: 'App Downloads' }
  ]
  const [currentView, setCurrentView] = useState<View>(views[0])
  const renderView = (): JSX.Element | undefined => {
    switch (currentView.id) {
      case 'apps':
        return <Apps />
      case 'local':
        return <Local />
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
